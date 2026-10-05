import { faultByCode } from '../content/data/faults'
import { CALLER_TYPES, CHECKLIST, COMMUNICATOR_CHOICES, OUTCOMES, PATTERNS, REVISION_CHOICES, YES_NO } from '../content/ticket'

export interface Ticket {
  id: string
  startedAt: string
  endedAt: string
  callerType: string
  callerName: string
  phone: string
  email: string
  systemName: string
  address: string
  installer: string
  revision: string
  communicator: string
  commissioned: string
  inverters: string
  batteries: string
  firmware: string
  reason: string
  pattern: string
  began: string
  codes: string[]
  readings: string
  checks: Record<string, boolean>
  actions: string
  outcome: string
  nextSteps: string
  followUp: string
  notes: string
}

const pad = (n: number): string => String(n).padStart(2, '0')

/** T-YYYYMMDD-HHMM in local time. A local reference only, not a number from any ticket system. */
export function ticketNumber(d: Date): string {
  return `T-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

export function newTicket(now: Date = new Date()): Ticket {
  return {
    id: ticketNumber(now), startedAt: now.toISOString(), endedAt: '',
    callerType: '', callerName: '', phone: '', email: '', systemName: '', address: '', installer: '',
    revision: '', communicator: '', commissioned: '', inverters: '', batteries: '', firmware: '',
    reason: '', pattern: '', began: '', codes: [], readings: '', checks: {}, actions: '', outcome: '', nextSteps: '', followUp: '', notes: '',
  }
}

export function isBlank(t: Ticket): boolean {
  const fresh = newTicket(new Date(t.startedAt))
  return JSON.stringify({ ...t, id: '', startedAt: '', endedAt: '' }) === JSON.stringify({ ...fresh, id: '', startedAt: '', endedAt: '' })
}

/** "12 min 5 s" between two instants. */
export function durationText(fromIso: string, toIso: string): string {
  const ms = Math.max(0, new Date(toIso).getTime() - new Date(fromIso).getTime())
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h} h ${m} min` : `${m} min ${sec} s`
}

const stamp = (iso: string): string => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const label = (list: readonly { value: string; label: string }[], v: string): string => list.find((x) => x.value === v)?.label ?? v

/** Plain text for pasting into a ticket system. Only filled-in fields are included. */
export function formatTicket(t: Ticket): string {
  const out: string[] = []
  const line = (k: string, v: string) => {
    if (v.trim()) out.push(`${k}: ${v.trim()}`)
  }
  const block = (title: string, body: () => void) => {
    const before = out.length
    out.push('', title.toUpperCase())
    body()
    if (out.length === before + 2) out.splice(before, 2)
  }
  out.push('LION ESS SUPPORT CALL TICKET')
  line('Ticket', t.id)
  line('Call started', stamp(t.startedAt))
  if (t.endedAt) {
    line('Call ended', stamp(t.endedAt))
    line('Duration', durationText(t.startedAt, t.endedAt))
  }
  block('Caller', () => {
    line('Type', label(CALLER_TYPES, t.callerType))
    line('Name', t.callerName)
    line('Phone', t.phone)
    line('Email', t.email)
  })
  block('System', () => {
    line('System name or serial', t.systemName)
    line('Address', t.address)
    line('Installer', t.installer)
    line('Revision', label(REVISION_CHOICES, t.revision))
    line('Communicator', label(COMMUNICATOR_CHOICES, t.communicator))
    line('Commissioned', label(YES_NO, t.commissioned))
    line('Inverters', t.inverters)
    line('Batteries', t.batteries)
    line('Firmware', t.firmware)
  })
  block('Problem', () => {
    line('Reason for the call', t.reason)
    line('Pattern', label(PATTERNS, t.pattern))
    line('Started', t.began)
    if (t.codes.length) line('Alerts and faults', t.codes.map((c) => { const f = faultByCode(c); return f ? `${c} ${f.name}` : c }).join('; '))
    line('Readings', t.readings)
  })
  block('Checked', () => {
    for (const c of CHECKLIST) if (t.checks[c.id]) out.push(`[x] ${c.label}`)
  })
  block('What was done', () => line('Steps', t.actions))
  block('Outcome', () => {
    line('Result', label(OUTCOMES, t.outcome))
    line('Next steps', t.nextSteps)
    line('Follow up on', t.followUp)
  })
  block('Notes', () => line('Notes', t.notes))
  return out.join('\n') + '\n'
}

/** The words the notes analysis reads: everything typed that describes the problem. */
export function analysisText(t: Ticket): string {
  return [t.reason, t.began, t.readings, t.actions, t.notes, t.codes.join(' '), t.revision === 'gen3' ? 'Sanctuary 3' : t.revision.startsWith('rev') ? t.revision.replace('rev', 'Rev ') : ''].filter(Boolean).join('\n')
}

// ---- draft storage (this browser tab only) ---------------------------------

export const TICKET_KEY = 'ess-training:ticket'

interface TextStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function loadTicket(store: TextStore | null): Ticket | null {
  try {
    const raw = store?.getItem(TICKET_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<Ticket>
    if (typeof v !== 'object' || v === null || typeof v.id !== 'string' || typeof v.startedAt !== 'string') return null
    return { ...newTicket(new Date(v.startedAt)), ...v, codes: Array.isArray(v.codes) ? v.codes.filter((c) => typeof c === 'string') : [], checks: v.checks && typeof v.checks === 'object' ? v.checks : {} }
  } catch {
    return null
  }
}

export function saveTicket(store: TextStore | null, t: Ticket): void {
  try {
    if (!store) return
    if (isBlank(t)) store.removeItem(TICKET_KEY)
    else store.setItem(TICKET_KEY, JSON.stringify(t))
  } catch {
    // Storage can be blocked; the ticket still works in memory.
  }
}
