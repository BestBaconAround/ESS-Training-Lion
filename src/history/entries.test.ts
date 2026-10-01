import { describe, expect, it } from 'vitest'
import { MAX_ENTRIES, addEntry, newId, removeEntry, snapshotAnswer } from './entries'
import { emptyHistory, type HistoryEntry } from './types'
import { buildCorpus } from '../ask/corpus'
import { SearchIndex } from '../ask/search'

const entry = (n: number): HistoryEntry => ({ id: `e${n}`, at: n, kind: 'ask', question: `q${n}`, answer: null })

describe('history entries', () => {
  it('adds newest first and removes by id', () => {
    let d = addEntry(emptyHistory(), entry(1))
    d = addEntry(d, entry(2))
    expect(d.entries.map((e) => e.id)).toEqual(['e2', 'e1'])
    expect(removeEntry(d, 'e2').entries.map((e) => e.id)).toEqual(['e1'])
  })

  it('caps the number of entries and drops the oldest', () => {
    let d = emptyHistory()
    for (let i = 0; i < MAX_ENTRIES + 20; i++) d = addEntry(d, entry(i))
    expect(d.entries).toHaveLength(MAX_ENTRIES)
    expect(d.entries[0].id).toBe(`e${MAX_ENTRIES + 19}`)
    expect(d.entries.some((e) => e.id === 'e0')).toBe(false)
  })

  it('makes unique ids', () => {
    expect(new Set(Array.from({ length: 200 }, newId)).size).toBe(200)
  })

  it('snapshots an answer with its sources, or null when nothing matched', () => {
    const idx = new SearchIndex(buildCorpus({}))
    const snap = snapshotAnswer(idx.search("my battery won't address"))!
    expect(snap.title).toContain('battery')
    expect(snap.lines.length).toBeGreaterThan(0)
    expect(snap.lines.every((l) => l.sources.length > 0)).toBe(true)
    expect(snapshotAnswer([])).toBeNull()
  })
})
