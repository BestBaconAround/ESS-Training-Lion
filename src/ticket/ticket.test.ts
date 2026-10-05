import { describe, expect, it } from 'vitest'
import { CHECKLIST, OUTCOMES } from '../content/ticket'
import { analysisText, durationText, formatTicket, isBlank, loadTicket, newTicket, saveTicket, ticketNumber, TICKET_KEY } from './ticket'

const memStore = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m }
}

describe('ticket content', () => {
  it('every checklist item has a source and a unique id', () => {
    const ids = new Set<string>()
    for (const c of CHECKLIST) {
      expect(c.sources.length, c.id).toBeGreaterThan(0)
      expect(ids.has(c.id), c.id).toBe(false)
      ids.add(c.id)
    }
  })
  it('outcome values are unique', () => {
    expect(new Set(OUTCOMES.map((o) => o.value)).size).toBe(OUTCOMES.length)
  })
})

describe('ticket', () => {
  const at = new Date(2026, 9, 5, 14, 32, 7)
  it('numbers by local date and time', () => {
    expect(ticketNumber(at)).toBe('T-20261005-1432')
  })
  it('a new ticket is blank, and typing makes it not blank', () => {
    const t = newTicket(at)
    expect(isBlank(t)).toBe(true)
    expect(isBlank({ ...t, reason: 'offline' })).toBe(false)
  })
  it('formats only the filled-in fields, with fault names and ticked checks', () => {
    const t = { ...newTicket(at), callerType: 'homeowner', callerName: 'Pat', revision: 'rev4', codes: ['A2_11'], reason: 'System offline', checks: { reset: true, band: false }, outcome: 'follow-up' }
    const text = formatTicket(t)
    expect(text).toContain('Ticket: T-20261005-1432')
    expect(text).toContain('Type: Homeowner')
    expect(text).toContain('Revision: Rev 4')
    expect(text).toMatch(/A2_11 BMS Communication Failure/)
    expect(text).toContain('[x] Pressed the communicator reset button')
    expect(text).not.toContain('2.4 GHz')
    expect(text).toContain('Result: Follow-up needed')
    expect(text).not.toContain('Phone:')
    expect(text).not.toContain('NOTES')
  })
  it('shows the duration once the call has ended', () => {
    const t = { ...newTicket(at), endedAt: new Date(at.getTime() + 725_000).toISOString() }
    expect(durationText(t.startedAt, t.endedAt)).toBe('12 min 5 s')
    expect(formatTicket(t)).toContain('Duration: 12 min 5 s')
  })
  it('collects the problem text for the notes analysis', () => {
    const t = { ...newTicket(at), reason: 'offline', readings: 'battery 2 reads 50.2V', codes: ['A2_11'], revision: 'rev3' }
    const a = analysisText(t)
    expect(a).toContain('50.2V')
    expect(a).toContain('A2_11')
    expect(a).toContain('Rev 3')
  })
  it('saves and loads a draft in the tab store, and clears it when blank', () => {
    const s = memStore()
    const t = { ...newTicket(at), reason: 'offline', codes: ['A2_11'], checks: { reset: true } }
    saveTicket(s, t)
    expect(loadTicket(s)).toMatchObject({ reason: 'offline', codes: ['A2_11'], checks: { reset: true } })
    saveTicket(s, newTicket(at))
    expect(s.m.has(TICKET_KEY)).toBe(false)
  })
  it('ignores a damaged draft', () => {
    const s = memStore()
    s.setItem(TICKET_KEY, '{bad')
    expect(loadTicket(s)).toBeNull()
    s.setItem(TICKET_KEY, JSON.stringify({ hello: 1 }))
    expect(loadTicket(s)).toBeNull()
  })
})
