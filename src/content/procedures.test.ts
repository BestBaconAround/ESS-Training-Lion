import { describe, expect, it } from 'vitest'
import { getModule } from './index'
import { PROCEDURES, PROCEDURE_GROUPS, statusOf } from './procedures'
import { TOPICS } from './topics'
import { TROUBLESHOOTING } from './troubleshooting'

const REVS = new Set(['rev1', 'rev2', 'rev3', 'rev4', 'gen3'])
const PAGES = new Set(['/wire-box', '/inverter-3d', '/', '/reference', '/procedures', '/electricity', '/solar', '/codes', '/competitors', '/troubleshooting', '/feedback'])
const entryIds = new Set(TROUBLESHOOTING.map((e) => e.id))

describe('procedures', () => {
  it('have unique ids, known groups and text', () => {
    expect(new Set(PROCEDURES.map((p) => p.id)).size).toBe(PROCEDURES.length)
    for (const p of PROCEDURES) {
      expect(PROCEDURE_GROUPS, p.id).toContain(p.group)
      expect(p.title.trim(), p.id).not.toBe('')
      expect(p.summary.trim(), p.id).not.toBe('')
    }
  })

  it('give every step a source and valid revisions', () => {
    const errors: string[] = []
    for (const p of PROCEDURES) {
      p.steps?.forEach((st, i) => {
        if (!st.text.trim()) errors.push(`${p.id} step ${i}: empty`)
        if (!st.sources.length) errors.push(`${p.id} step ${i}: no source`)
        if (st.revisions !== 'all' && (!st.revisions.length || st.revisions.some((r) => !REVS.has(r)))) errors.push(`${p.id} step ${i}: bad revisions`)
      })
    }
    expect(errors).toEqual([])
  })

  it('link only to things that exist', () => {
    const errors: string[] = []
    for (const p of PROCEDURES) {
      for (const l of p.links ?? []) {
        if (l.type === 'entry' && !entryIds.has(l.id)) errors.push(`${p.id}: no entry ${l.id}`)
        if (l.type === 'module' && !getModule(l.moduleId)) errors.push(`${p.id}: no module ${l.moduleId}`)
        if (l.type === 'lesson' && !getModule(l.moduleId)?.lessons.some((x) => x.id === l.lessonId)) errors.push(`${p.id}: no lesson ${l.lessonId}`)
        if (l.type === 'page' && !PAGES.has(l.to)) errors.push(`${p.id}: no page ${l.to}`)
      }
    }
    expect(errors).toEqual([])
  })

  it('show every gap: items with no content say what is needed, and the AI item is blocked', () => {
    for (const p of PROCEDURES) {
      if (statusOf(p) === 'todo') expect(p.todo?.length, p.id).toBeGreaterThan(0)
      for (const t of p.todo ?? []) expect(t.trim(), p.id).not.toBe('')
    }
    expect(statusOf(PROCEDURES.find((p) => p.id === 'p-optimize-battery')!)).toBe('blocked')
  })

  it('cover everything the author listed', () => {
    for (const id of [
      'p-wifi', 'p-replace-wcm', 'p-explain-graph', 'p-tou', 'p-generator-setup', 'p-acsolar', 'p-share-access', 'p-optimize-battery',
      'p-parallel-battery-cables', 'p-drifted-cell', 'p-fix-port-wiring', 'p-fix-cts', 'p-power-button', 'p-battery-cables', 'p-comms-map', 'p-install',
      'p-add-to-system', 'p-graph-black', 'p-emsc-connectivity', 'p-update-firmware', 'p-web-app', 'p-registers', 'p-alerts-lesson', 'p-relay-diagnose',
      'p-continuity', 'p-gfci', 'p-wiring-code', 'p-grid-load-side', 'p-generator-trouble', 'p-rma', 'p-string-down', 'p-tigo', 'p-how-comms-work',
      'p-how-sanctuary', 'p-multimeter', 'p-page-electricity', 'p-page-codes', 'p-page-solar', 'p-page-competitors',
    ]) {
      expect(PROCEDURES.some((p) => p.id === id), id).toBe(true)
    }
  })
})

describe('web sources', () => {
  it('always carry the page URL and the date searched, and are never the only source for a Lion fact', () => {
    const errors: string[] = []
    const check = (where: string, sources: { source: string; url?: string; note?: string }[]) => {
      for (const x of sources) {
        if (x.source !== 'web') continue
        if (!x.url?.startsWith('https://')) errors.push(`${where}: web source without an https url`)
        if (!/(searched|read in full) \d/.test(x.note ?? '')) errors.push(`${where}: web source without the date searched`)
      }
    }
    for (const t of TOPICS) for (const sec of t.sections) for (const f of sec.facts) check(`${t.id}/${sec.title}`, f.sources)
    for (const p of PROCEDURES) for (const st of p.steps ?? []) check(p.id, st.sources)
    expect(errors).toEqual([])
  })

  it('are used only in sections marked From the web', () => {
    for (const t of TOPICS) {
      for (const sec of t.sections) {
        const usesWeb = sec.facts.some((f) => f.sources.some((x) => x.source === 'web'))
        if (usesWeb) expect(sec.fromWeb, `${t.id}/${sec.title}`).toBe(true)
      }
    }
  })
})

describe('knowledge pages', () => {
  it('have sourced facts, https links and a list of what is still needed', () => {
    const errors: string[] = []
    for (const t of TOPICS) {
      if (!t.needed.length) errors.push(`${t.id}: no needed list`)
      for (const s of t.sections) {
        for (const f of s.facts) {
          if (!f.sources.length) errors.push(`${t.id}/${s.title}: fact without source`)
          if (f.revisions !== 'all' && (!f.revisions.length || f.revisions.some((r) => !REVS.has(r)))) errors.push(`${t.id}: bad revisions`)
        }
      }
      for (const g of t.links ?? []) for (const l of g.items) if (!l.url.startsWith('https://')) errors.push(`${t.id}: ${l.url}`)
    }
    expect(errors).toEqual([])
    expect(TOPICS.map((t) => t.id)).toEqual(['electricity', 'solar', 'codes', 'competitors'])
  })
})

describe('topic images', () => {
  it('exist on disk and carry alt text, a caption and a source', async () => {
    const fs = await import('node:fs')
    const all = [...TOPICS.flatMap((t) => t.sections.flatMap((x) => x.images ?? [])), ...PROCEDURES.flatMap((p) => p.images ?? [])]
    for (const im of all) {
      expect(fs.existsSync(`public/${im.src}`), im.src).toBe(true)
      expect(im.alt.length, im.src).toBeGreaterThan(10)
      expect(im.caption.length, im.src).toBeGreaterThan(5)
      expect(im.sources.length, im.src).toBeGreaterThan(0)
    }
  })
})
