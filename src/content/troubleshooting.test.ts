import { describe, expect, it } from 'vitest'
import { FAULT_CODES } from './data/faults'
import { getModule } from './index'
import { REVISIONS } from './labels'
import { ESCALATION, FAULT_AREA, TROUBLESHOOTING } from './troubleshooting'

const validRevs = new Set<string>(REVISIONS)

describe('troubleshooting content', () => {
  it('has unique ids and every entry has steps', () => {
    const ids = TROUBLESHOOTING.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of TROUBLESHOOTING) {
      expect(e.title.trim(), e.id).not.toBe('')
      expect(e.steps.length, e.id).toBeGreaterThan(0)
    }
  })

  it('every step has a source and valid revisions', () => {
    const errors: string[] = []
    for (const e of TROUBLESHOOTING) {
      e.steps.forEach((s, i) => {
        if (!s.text.trim()) errors.push(`${e.id} step ${i}: empty`)
        if (!s.sources.length) errors.push(`${e.id} step ${i}: needs a source`)
        if (s.revisions !== 'all' && (!s.revisions.length || s.revisions.some((r) => !validRevs.has(r)))) errors.push(`${e.id} step ${i}: bad revisions`)
      })
    }
    expect(errors).toEqual([])
  })

  it('lists every fault code exactly once, in an area', () => {
    const codes = TROUBLESHOOTING.filter((e) => e.faultCode).map((e) => e.faultCode)
    expect(codes.sort()).toEqual(FAULT_CODES.map((f) => f.code).sort())
    for (const f of FAULT_CODES) expect(FAULT_AREA[f.code], f.code).toBeDefined()
  })

  it('links only to lessons that exist', () => {
    const errors: string[] = []
    for (const e of TROUBLESHOOTING) {
      for (const r of e.related ?? []) {
        const lesson = getModule(r.moduleId)?.lessons.find((l) => l.id === r.lessonId)
        if (!lesson) errors.push(`${e.id}: unknown lesson ${r.moduleId}/${r.lessonId}`)
      }
    }
    expect(errors).toEqual([])
  })

  it('covers every area', () => {
    expect(new Set(TROUBLESHOOTING.map((e) => e.area))).toEqual(new Set(['general', 'battery', 'inverter', 'power']))
  })

  it('has an escalation contact with a source', () => {
    expect(ESCALATION.text).toContain('(435) 244-3352')
    expect(ESCALATION.sources.length).toBeGreaterThan(0)
  })
})
