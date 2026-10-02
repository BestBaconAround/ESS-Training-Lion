import { describe, expect, it } from 'vitest'
import { REFERENCE_SECTIONS } from './reference'

const VALID = new Set(['rev1', 'rev2', 'rev3', 'rev4'])

describe('reference material', () => {
  it('has unique section ids and rows with a value, a source and valid revisions', () => {
    expect(new Set(REFERENCE_SECTIONS.map((s) => s.id)).size).toBe(REFERENCE_SECTIONS.length)
    const errors: string[] = []
    for (const s of REFERENCE_SECTIONS) {
      if (!s.rows.length) errors.push(`${s.id}: empty`)
      for (const r of s.rows) {
        if (!r.label.trim() || !r.value.trim()) errors.push(`${s.id}/${r.label}: empty text`)
        if (!r.sources.length) errors.push(`${s.id}/${r.label}: no source`)
        if (r.revisions !== 'all' && (!r.revisions.length || r.revisions.some((x) => !VALID.has(x)))) errors.push(`${s.id}/${r.label}: bad revisions`)
      }
    }
    expect(errors).toEqual([])
  })
})
