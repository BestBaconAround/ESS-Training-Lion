import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { modules } from './index'
import { FAULT_CODES } from './data/faults'
import { REVISIONS, SOURCE_LABELS } from './labels'
import type { Block, RevisionTag, SourceRef } from './types'

const validSources = Object.keys(SOURCE_LABELS)

function checkSources(where: string, refs: SourceRef[], errors: string[]) {
  if (!refs?.length) errors.push(`${where}: needs at least one source`)
  for (const r of refs ?? []) {
    if (!validSources.includes(r.source)) errors.push(`${where}: unknown source "${r.source}"`)
    for (const p of r.pages ?? []) {
      if (!Number.isInteger(p) || p < 1) errors.push(`${where}: bad page ${p}`)
    }
  }
}

function checkRevisions(where: string, tag: RevisionTag, errors: string[]) {
  if (tag === 'all') return
  if (!Array.isArray(tag) || !tag.length) errors.push(`${where}: revisions must be 'all' or a non-empty list`)
  for (const r of tag as string[]) if (!REVISIONS.includes(r as never)) errors.push(`${where}: unknown revision "${r}"`)
}

function checkBlock(where: string, b: Block, errors: string[]) {
  switch (b.type) {
    case 'text':
    case 'todo':
      if (!b.text.trim()) errors.push(`${where}: empty ${b.type}`)
      break
    case 'facts':
      if (!b.items.length) errors.push(`${where}: empty facts block`)
      b.items.forEach((f, i) => {
        if (!f.text.trim()) errors.push(`${where} fact ${i}: empty text`)
        checkSources(`${where} fact ${i}`, f.sources, errors)
        checkRevisions(`${where} fact ${i}`, f.revisions, errors)
      })
      break
    case 'call':
      if (!b.customer.trim() || !b.answer.trim()) errors.push(`${where}: call needs customer and answer`)
      checkSources(where, b.sources, errors)
      checkRevisions(where, b.revisions, errors)
      break
    case 'callout':
      if (!b.text.trim()) errors.push(`${where}: empty callout`)
      checkSources(where, b.sources, errors)
      checkRevisions(where, b.revisions, errors)
      break
    case 'image':
      if (!b.alt.trim() || !b.caption.trim()) errors.push(`${where}: image needs alt text and a caption`)
      if (!existsSync(join(process.cwd(), 'public', b.src))) errors.push(`${where}: image file public/${b.src} does not exist`)
      if (!(b.width > 0 && b.height > 0)) errors.push(`${where}: image needs width and height`)
      checkSources(where, b.sources, errors)
      checkRevisions(where, b.revisions, errors)
      break
    case 'revisionDiff':
      if (!b.rows.length) errors.push(`${where}: empty revisionDiff`)
      b.rows.forEach((r, i) => {
        if (!Object.keys(r.values).length) errors.push(`${where} row ${i}: no values`)
        for (const k of Object.keys(r.values)) if (!REVISIONS.includes(k as never)) errors.push(`${where} row ${i}: unknown revision "${k}"`)
        checkSources(`${where} row ${i}`, r.sources, errors)
      })
      break
  }
}

describe('content', () => {
  it('registers 7 modules numbered 1-7 with unique ids', () => {
    expect(modules.map((m) => m.number)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(new Set(modules.map((m) => m.id)).size).toBe(7)
  })

  it('has globally unique lesson, question and sim ids', () => {
    const ids: string[] = []
    for (const m of modules) {
      m.lessons.forEach((l) => ids.push(`lesson:${l.id}`))
      m.quiz?.questions.forEach((q) => ids.push(`question:${q.id}`))
      ids.push(`sim:${m.sim.id}`)
    }
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  })

  it('every module is complete for its status and every fact is sourced', () => {
    const errors: string[] = []
    for (const m of modules) {
      const mw = `module ${m.number} (${m.id})`
      if (!m.title.trim() || !m.summary.trim()) errors.push(`${mw}: needs title and summary`)
      if (!m.sim.id || !m.sim.title.trim()) errors.push(`${mw}: needs a sim`)
      if (!m.outline.length) errors.push(`${mw}: needs an outline`)
      m.outline.forEach((o, i) => checkSources(`${mw} outline ${i}`, o.sources, errors))

      if (m.status === 'ready') {
        if (!m.lessons.length) errors.push(`${mw}: ready module needs lessons`)
        if (!m.quiz?.questions.length) errors.push(`${mw}: ready module needs a quiz`)
      }

      const lessonIds = new Set(m.lessons.map((l) => l.id))
      m.lessons.forEach((l) => {
        const lw = `${mw} lesson ${l.id}`
        if (!l.title.trim() || !l.summary.trim()) errors.push(`${lw}: needs title and summary`)
        if (!l.blocks.length) errors.push(`${lw}: needs blocks`)
        l.blocks.forEach((b, i) => checkBlock(`${lw} block ${i}`, b, errors))
      })

      if (m.quiz) {
        if (m.quiz.passMark <= 0 || m.quiz.passMark > 1) errors.push(`${mw}: passMark must be in (0, 1]`)
        m.quiz.questions.forEach((q) => {
          const qw = `${mw} question ${q.id}`
          if (!q.prompt.trim()) errors.push(`${qw}: empty prompt`)
          if (!q.explanation.trim()) errors.push(`${qw}: every question needs an explanation`)
          if (q.lessonId && !lessonIds.has(q.lessonId)) errors.push(`${qw}: unknown lessonId "${q.lessonId}"`)
          const choiceIds = q.choices.map((c) => c.id)
          if (q.choices.length < 2) errors.push(`${qw}: needs at least 2 choices`)
          if (new Set(choiceIds).size !== choiceIds.length) errors.push(`${qw}: duplicate choice ids`)
          if (!q.correct.length) errors.push(`${qw}: needs a correct answer`)
          for (const c of q.correct) if (!choiceIds.includes(c)) errors.push(`${qw}: correct "${c}" is not a choice`)
          if (q.kind !== 'multi' && q.correct.length !== 1) errors.push(`${qw}: ${q.kind} needs exactly one correct answer`)
          if (q.kind === 'truefalse' && q.choices.length !== 2) errors.push(`${qw}: truefalse needs exactly 2 choices`)
          checkSources(qw, q.sources, errors)
          checkRevisions(qw, q.revisions, errors)
        })
      }
    }
    expect(errors).toEqual([])
  })

  it('fault table has unique codes with solutions and sources', () => {
    const codes = FAULT_CODES.map((f) => f.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(codes).toHaveLength(88)
    const errors: string[] = []
    for (const f of FAULT_CODES) {
      if (!f.name.trim() || !f.description.trim()) errors.push(`${f.code}: incomplete`)
      checkSources(f.code, f.sources, errors)
    }
    expect(errors).toEqual([])
  })
})
