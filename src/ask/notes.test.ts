import { describe, expect, it } from 'vitest'
import { buildCorpus } from './corpus'
import {
  NOTES_KEY,
  analyzeNotes,
  detectBatteryReadings,
  detectFaultCodes,
  detectRevisions,
  loadNotes,
  saveNotes,
} from './notes'
import { SearchIndex } from './search'

const index = new SearchIndex(buildCorpus({}))
const run = (t: string) => analyzeNotes(t, index)
const ideaIds = (t: string) => run(t).ideas.map((i) => i.id)

describe('detectors', () => {
  it('reads fault codes written several ways, only real ones', () => {
    expect(detectFaultCodes('shows A2_10 and a1-2, also A2 11')).toEqual(['A2_10', 'A1_2', 'A2_11'])
    expect(detectFaultCodes('A2_99 and B1_1')).toEqual([])
  })

  it('detects revisions', () => {
    expect(detectRevisions('this is a Rev 3 system')).toEqual(['rev3'])
    expect(detectRevisions('rev4, maybe revision 2')).toEqual(['rev4', 'rev2'])
    expect(detectRevisions('revenue 300')).toEqual([])
  })

  it('reads battery-range voltages with a unit and ignores grid/solar numbers', () => {
    expect(detectBatteryReadings('battery 1 reads 50.8V, battery 2 is 53 volts')).toEqual([50.8, 53])
    expect(detectBatteryReadings('grid is 240V, PV string 48 V, 120 VDC')).toEqual([])
    expect(detectBatteryReadings('about 51.5 vdc')).toEqual([51.5])
    expect(detectBatteryReadings('3 batteries 12 amps')).toEqual([])
  })
})

describe('analyzeNotes', () => {
  it('returns nothing for empty or unrelated notes', () => {
    expect(run('').ideas).toEqual([])
    expect(run('   \n  ').ideas).toEqual([])
    expect(run('customer likes pizza and sunny weekends').ideas).toEqual([])
  })

  it('turns a fault code into its entry and uses the revision to filter steps', () => {
    const a = run('Customer has A2_10 on a rev 3 system')
    expect(a.faultCodes).toEqual(['A2_10'])
    expect(a.revisions).toEqual(['rev3'])
    const idea = a.ideas.find((i) => i.id === 'ts-fault-a2_10')!
    expect(idea.kind).toBe('fault')
    expect(idea.lines.length).toBeGreaterThan(0)
    expect(idea.lines.every((l) => l.sources.length > 0)).toBe(true)
  })

  it('flags a battery below 51 V and points to the dead-battery entry', () => {
    const a = run('battery 2 reads 50.2V and will not address')
    const reading = a.ideas.find((i) => i.kind === 'reading')!
    expect(reading.title).toContain('50.2')
    expect(reading.link).toEqual({ type: 'entry', entryId: 'ts-battery-wont-address' })
    expect(reading.sources!.length).toBeGreaterThan(0)
  })

  it('flags 51.1 V as in range but low, not out of range', () => {
    const r = run('one battery is 51.1V').ideas.find((i) => i.kind === 'reading')!
    expect(r.title.toLowerCase()).toContain('in range but low')
  })

  it('flags a spread above 0.5 V between two batteries, and not within 0.5 V', () => {
    expect(ideaIds('battery A 54.1V battery B 52.9V')).toContain('reading-spread')
    expect(ideaIds('battery A 53.1V battery B 53.4V')).not.toContain('reading-spread')
  })

  it('mentions the >98% charged note for a high but valid reading', () => {
    const r = run('battery reads 54.0V').ideas.find((i) => i.kind === 'reading')!
    expect(r.detail).toContain('98%')
  })

  it('matches symptoms in plain words, even when two topics share one note', () => {
    const ids = ideaIds('Light is red and the power is out.\nAlso the app will not connect')
    expect(ids).toContain('ts-red-light')
    expect(ids).toContain('ts-app-offline')
  })

  it('finds a topic inside a long comma-separated sentence', () => {
    expect(ideaIds('Rev 3, light is red, battery 2 reads 50.2V, customer is calling from work')).toContain('ts-red-light')
  })

  it('asks which revision when suggestions depend on it and none was given', () => {
    const a = run('app cannot connect, customer says cellular only')
    expect(a.ideas.some((i) => i.id === 'q-revision')).toBe(true)
  })

  it('does not ask for the revision once one is in the notes', () => {
    expect(run('rev 4, app cannot connect').ideas.some((i) => i.id === 'q-revision')).toBe(false)
  })

  it('asks the first-call questions that the notes have not answered, with sources', () => {
    const qs = run('battery 2 reads 50.2V').ideas.filter((i) => i.kind === 'question')
    expect(qs.some((q) => q.id === 'q-intermittent')).toBe(true)
    for (const q of qs) expect(q.sources!.length).toBeGreaterThan(0)
    const answered = run('battery 2 reads 50.2V, happens constantly, alert A1_2').ideas.filter((i) => i.kind === 'question')
    expect(answered.some((q) => q.id === 'q-intermittent')).toBe(false)
    expect(answered.some((q) => q.id === 'q-alerts')).toBe(false)
  })

  it('never returns more than a handful of matches or questions', () => {
    const a = run('battery inverter solar grid generator light app power fault shutdown')
    expect(a.ideas.filter((i) => i.kind === 'match').length).toBeLessThanOrEqual(4)
    expect(a.ideas.filter((i) => i.kind === 'question').length).toBeLessThanOrEqual(3)
  })

  it('every idea line carries a source', () => {
    for (const t of ['A2_10 rev 3', 'battery 50.2V', 'red light', 'app cannot connect', 'shutdown button still on']) {
      for (const i of run(t).ideas) for (const l of i.lines) expect(l.sources.length).toBeGreaterThan(0)
    }
  })
})

describe('notes storage', () => {
  const fake = () => {
    const m = new Map<string, string>()
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
      raw: m,
    }
  }
  it('saves, loads and clears', () => {
    const s = fake()
    saveNotes(s, 'hello')
    expect(loadNotes(s)).toBe('hello')
    expect(s.raw.has(NOTES_KEY)).toBe(true)
    saveNotes(s, '')
    expect(loadNotes(s)).toBe('')
    expect(s.raw.has(NOTES_KEY)).toBe(false)
  })
  it('survives blocked storage', () => {
    const bad = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadNotes(bad)).toBe('')
    expect(() => saveNotes(bad, 'x')).not.toThrow()
    expect(loadNotes(null)).toBe('')
  })
})
