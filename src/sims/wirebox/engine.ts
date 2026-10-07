import {
  GRID_PHASE_NOTE,
  LOAD_PHASE_NOTE,
  PARTS,
  PV_REVERSED_NOTE,
  SCENARIO_IDS,
  SCENARIO_TEXT,
  WRONG_NOTES,
  partById,
  socketById,
  type Part,
  type Socket,
} from '../../content/sims/wireBox'
import type { SourceRef } from '../../content/types'
import { createRng, pick, shuffle, type Rng } from '../rng'

/** partId -> socketId, or null when the part is in the tray (not connected). */
export type WireState = Record<string, string | null>

export const emptyState = (): WireState => Object.fromEntries(PARTS.map((p) => [p.id, null]))

/** Whether the plug physically fits the socket. A wrong kind is refused, not graded. */
export function fits(part: Part, socket: Socket): boolean {
  switch (part.kind) {
    case 'ethernet':
      return socket.kind === 'rj45'
    case 'antenna':
      return socket.kind === 'antenna'
    case 'plug':
      return socket.kind === 'plug'
    case 'battery':
      return socket.kind === 'busbar'
    case 'pv':
    case 'ac':
      return socket.kind === 'terminal'
  }
}

export const occupant = (state: WireState, socketId: string): string | null =>
  Object.keys(state).find((k) => state[k] === socketId) ?? null

export interface PlaceResult {
  state: WireState
  /** Set when the move was refused. */
  rejected?: string
  /** Part that was bumped into the tray or swapped, if any. */
  displaced?: string
}

/** Move a part onto a socket (or into the tray with null). Dropping on an occupied socket swaps, or bumps to the tray. */
export function place(state: WireState, partId: string, socketId: string | null): PlaceResult {
  const part = partById(partId)
  if (socketId === null) return { state: { ...state, [partId]: null } }
  const socket = socketById(socketId)
  if (!fits(part, socket)) {
    return { state, rejected: `A ${part.kind === 'ethernet' ? 'network plug' : part.label.toLowerCase()} does not fit ${socket.label}. Look at the shape of the connector.` }
  }
  const next = { ...state }
  const from = state[partId]
  const other = occupant(state, socketId)
  if (other && other !== partId) {
    if (from) {
      const otherPart = partById(other)
      if (fits(otherPart, socketById(from))) next[other] = from
      else next[other] = null
    } else next[other] = null
  }
  next[partId] = socketId
  return { state: next, ...(other && other !== partId ? { displaced: other } : {}) }
}

export type PartStatus = 'correct' | 'wrong' | 'unplaced'
export interface PartResult {
  partId: string
  status: PartStatus
  /** Why it is wrong, or why it is right. Specific when the sources give a consequence. */
  note: string
  sources: SourceRef[]
}

const mate = (id: string): string | null => {
  const m = /^pv(\d)([pn])$/.exec(id)
  return m ? `pv${m[1]}${m[2] === 'p' ? 'n' : 'p'}` : null
}

export function gradePart(state: WireState, partId: string): PartResult {
  const part = partById(partId)
  const at = state[partId]
  if (!at) return { partId, status: 'unplaced', note: part.required ? 'Not connected yet.' : 'Not connected (optional).', sources: [] }
  if (part.correct.includes(at)) return { partId, status: 'correct', note: part.why, sources: part.sources }
  const socket = socketById(at)
  const key = WRONG_NOTES[`${partId}@${at}`]
  if (key) return { partId, status: 'wrong', note: key.text, sources: key.sources }
  if (part.kind === 'pv' && mate(part.correct[0]) === at) return { partId, status: 'wrong', note: PV_REVERSED_NOTE.text, sources: PV_REVERSED_NOTE.sources }
  if (part.kind === 'ac' && socket.group !== socketById(part.correct[0]).group) {
    return { partId, status: 'wrong', note: `${part.label} is on the ${socket.group} terminals. On the wire box cover diagram, grid, generator and load each have their own L1, L2 and N terminals. Do not power on until this is fixed.`, sources: part.sources }
  }
  if (part.kind === 'ac' && socket.group === socketById(part.correct[0]).group) {
    const note = socket.group === 'Grid input' ? GRID_PHASE_NOTE : socket.group === 'Load output' ? LOAD_PHASE_NOTE : null
    return { partId, status: 'wrong', note: note ? note.text : `${part.label} is on the wrong terminal for its group. L1, L2 and N must match.`, sources: note ? note.sources : part.sources }
  }
  if (at === 'meter') return { partId, status: 'wrong', note: 'The Meter Port is not used on Rev 4.', sources: part.sources }
  const where = part.correct.map((c) => socketById(c).label).join(' or ')
  return { partId, status: 'wrong', note: `${part.label} goes on ${where}, not ${socket.label}. See the wire box cover diagram.`, sources: part.sources }
}

export interface Grade {
  results: PartResult[]
  wrong: string[]
  missing: string[]
  /** A PV string wire is connected without its pair. */
  incompletePv: string[]
  done: boolean
}

export function grade(state: WireState): Grade {
  const results = PARTS.map((p) => gradePart(state, p.id))
  const wrong = results.filter((r) => r.status === 'wrong').map((r) => r.partId)
  const missing = PARTS.filter((p) => p.required && !state[p.id]).map((p) => p.id)
  const incompletePv: string[] = []
  for (let n = 1; n <= 4; n++) {
    const a = !!state[`p_pv${n}p`]
    const b = !!state[`p_pv${n}n`]
    if (a !== b) incompletePv.push(a ? `p_pv${n}n` : `p_pv${n}p`)
  }
  return { results, wrong, missing, incompletePv, done: wrong.length === 0 && missing.length === 0 && incompletePv.length === 0 }
}

/** A correct single-inverter build: every required part plus PV strings 1 and 2. */
export function correctState(): WireState {
  const s = emptyState()
  for (const p of PARTS) if (p.required || /^p_pv[12][pn]$/.test(p.id)) s[p.id] = p.correct[0]
  return s
}

export interface FixScenario {
  ids: string[]
  /** PV string used by the pv-reversed scenario. */
  pvString: number
  state: WireState
  /** Symptom lines the learner sees, one per fault. */
  symptoms: string[]
  fixes: string[]
  sources: SourceRef[]
  titles: string[]
}

export const touched = (id: string, pvString: number): string[] => {
  switch (id) {
    case 'ct-meter': return ['p_ct_cable']
    case 'comms-swap': return ['p_emsc_cable', 'p_bms_cable']
    case 'pv-reversed': return [`p_pv${pvString}p`, `p_pv${pvString}n`]
    case 'battery-reversed': return ['p_bat_p', 'p_bat_n']
    case 'rsd-open': return ['p_rsd_loop']
    case 'grid-swap': return ['p_grid_l1', 'p_grid_l2']
    case 'load-swap': return ['p_load_l1', 'p_load_l2']
    case 'antennas-swapped': return ['p_antenna_cell', 'p_antenna_wifi']
    case 'addressing-cable-left': return ['p_addressing_cable', 'p_bms_cable']
    default: return []
  }
}

export function apply(id: string, state: WireState, pvString: number): void {
  const swap = (a: string, b: string) => {
    const t = state[a]
    state[a] = state[b]
    state[b] = t
  }
  switch (id) {
    case 'ct-meter': state.p_ct_cable = 'meter'; break
    case 'comms-swap': state.p_emsc_cable = 'bms'; state.p_bms_cable = 'wifi'; break
    case 'pv-reversed': swap(`p_pv${pvString}p`, `p_pv${pvString}n`); break
    case 'battery-reversed': swap('p_bat_p', 'p_bat_n'); break
    case 'rsd-open': state.p_rsd_loop = null; break
    case 'grid-swap': swap('p_grid_l1', 'p_grid_l2'); break
    case 'load-swap': swap('p_load_l1', 'p_load_l2'); break
    case 'antennas-swapped': swap('p_antenna_cell', 'p_antenna_wifi'); break
    case 'addressing-cable-left': state.p_addressing_cable = 'ems_bat'; state.p_bms_cable = null; break
  }
}

/** Pick one or two non-overlapping faults and wire them into an otherwise correct box. Same seed gives the same box. */
export function makeFixScenario(seed: number, only?: string): FixScenario {
  const rng: Rng = createRng(seed)
  const pvString = pick(rng, [1, 2])
  const first = only ?? pick(rng, SCENARIO_IDS)
  const ids = [first]
  if (!only && rng() < 0.5) {
    const used = new Set(touched(first, pvString))
    const options = shuffle(rng, SCENARIO_IDS).filter((id) => id !== first && touched(id, pvString).every((p) => !used.has(p)))
    if (options.length) ids.push(options[0])
  }
  const state = correctState()
  for (const id of ids) apply(id, state, pvString)
  const text = ids.map((id) => SCENARIO_TEXT[id])
  return {
    ids,
    pvString,
    state,
    symptoms: text.map((t) => t.symptom.replace('One string', `String ${pvString}`)),
    fixes: text.map((t) => t.fix),
    sources: text.flatMap((t) => t.sources),
    titles: text.map((t) => t.title),
  }
}
