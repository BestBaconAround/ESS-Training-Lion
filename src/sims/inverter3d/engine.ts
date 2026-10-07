import { BAD_CABLE_NOTE, EXPLORE_TASKS, LAB_SCENARIO_IDS, LAB_SCENARIO_TEXT, LOOSE_NOTES, type Fastener } from '../../content/sims/inverter3d'
import { SCENARIO_IDS, SCENARIO_TEXT, SOCKETS, partById, socketById, type Socket } from '../../content/sims/wireBox'
import type { SourceRef } from '../../content/types'
import { src } from '../../content/helpers'
import { createRng, pick, randFloat, shuffle } from '../rng'
import { apply as applyWireFault, correctState, grade, place, touched, type WireState } from '../wirebox/engine'

export type { Fastener }

/** Sockets that have a bolt or screw: the PV, grid, generator and load terminals, and the two battery busbars. */
export const isFastened = (s: Socket): boolean => s.kind === 'terminal' || s.kind === 'busbar'
export const FASTENED_IDS: string[] = SOCKETS.filter(isFastened).map((s) => s.id)

export interface LabState {
  wires: WireState
  fasteners: Record<string, Fastener>
  /** Part ids whose cable fails the cable tester. */
  bad: string[]
  /** Where the spare Ethernet cable is plugged, or null when it is on the bench. */
  spare: string | null
  /** Resting battery voltage for the meter (inside the 51-55.6 V range before wiring). */
  batteryV: number
  gridOn: boolean
}

export const allTight = (): Record<string, Fastener> => Object.fromEntries(FASTENED_IDS.map((id) => [id, 'tight' as Fastener]))

export const correctLab = (batteryV = 52.8): LabState => ({ wires: correctState(), fasteners: allTight(), bad: [], spare: null, batteryV, gridOn: true })

/** Creative mode: every cable on the bench and every bolt loose, so the box can be built from nothing. */
export const emptyLab = (batteryV = 52.8): LabState => ({
  wires: Object.fromEntries(Object.keys(correctState()).map((k) => [k, null])),
  fasteners: Object.fromEntries(FASTENED_IDS.map((id) => [id, 'loose' as Fastener])),
  bad: [],
  spare: null,
  batteryV,
  gridOn: true,
})

export interface LabPlaceResult {
  lab: LabState
  rejected?: string
  displaced?: string
}

/** Move a cable. A bolted terminal must be loosened before a wire can leave it or land on it. */
export function placeWire(lab: LabState, partId: string, socketId: string | null): LabPlaceResult {
  const from = lab.wires[partId]
  if (socketId === from) return { lab }
  if (from && fastenedAt(from) && lab.fasteners[from] === 'tight') {
    return { lab, rejected: `The bolt on ${socketById(from).label} is tight. Loosen it with the screwdriver before you pull the wire off.` }
  }
  if (socketId && fastenedAt(socketId) && lab.fasteners[socketId] === 'tight') {
    return { lab, rejected: `The bolt on ${socketById(socketId).label} is tight. Loosen it first, then place the wire.` }
  }
  if (socketId && fastenedAt(socketId)) {
    const other = Object.keys(lab.wires).find((k) => lab.wires[k] === socketId && k !== partId)
    if (other && from && fastenedAt(from) && lab.fasteners[from] === 'tight') return { lab, rejected: 'Loosen both terminals before swapping wires.' }
  }
  const r = place(lab.wires, partId, socketId)
  if (r.rejected) return { lab, rejected: r.rejected }
  return { lab: { ...lab, wires: r.state }, ...(r.displaced ? { displaced: r.displaced } : {}) }
}

const fastenedAt = (socketId: string): boolean => FASTENED_IDS.includes(socketId)

/** The spare Ethernet cable only fits an RJ45 port. A cable already there goes back to the bench. */
export function placeSpare(lab: LabState, socketId: string | null): LabPlaceResult {
  if (socketId === null) return { lab: { ...lab, spare: null } }
  const s = socketById(socketId)
  if (s.kind !== 'rj45') return { lab, rejected: `The spare Ethernet cable does not fit ${s.label}. Look at the shape of the connector.` }
  const occupant = Object.keys(lab.wires).find((k) => lab.wires[k] === socketId)
  const wires = occupant ? { ...lab.wires, [occupant]: null } : lab.wires
  return { lab: { ...lab, wires, spare: socketId }, ...(occupant ? { displaced: occupant } : {}) }
}

/**
 * Tighten or loosen a bolt one step: tight, loose, removed. A removed bolt is lying on the bench and has to be put
 * back, which takes two tighten clicks (removed to loose to tight).
 */
export function turnBolt(lab: LabState, socketId: string, dir: 'tighten' | 'loosen'): LabState {
  if (!fastenedAt(socketId)) return lab
  const order: Fastener[] = ['tight', 'loose', 'removed']
  const i = order.indexOf(lab.fasteners[socketId])
  const j = dir === 'loosen' ? Math.min(i + 1, 2) : Math.max(i - 1, 0)
  return { ...lab, fasteners: { ...lab.fasteners, [socketId]: order[j] } }
}

/** The wire state the wire box grader should see: bad cables do not count, and the spare takes the place of a bad cable. */
export function effectiveWires(lab: LabState): WireState {
  const eff: WireState = { ...lab.wires }
  for (const id of lab.bad) {
    eff[id] = null
    if (lab.spare && partById(id).correct.includes(lab.spare)) eff[id] = lab.spare
  }
  return eff
}

export interface Issue {
  kind: 'wire' | 'loose' | 'bad-cable' | 'missing'
  partId?: string
  socketId?: string
  text: string
  sources: SourceRef[]
}

export interface LabGrade {
  issues: Issue[]
  done: boolean
}

export function gradeLab(lab: LabState): LabGrade {
  const eff = effectiveWires(lab)
  const g = grade(eff)
  const issues: Issue[] = []
  for (const r of g.results) if (r.status === 'wrong') issues.push({ kind: 'wire', partId: r.partId, text: r.note, sources: r.sources })
  for (const id of g.missing) issues.push({ kind: 'missing', partId: id, text: `${partById(id).label} is not connected yet.`, sources: [] })
  for (const id of g.incompletePv) issues.push({ kind: 'missing', partId: id, text: `${partById(id).label} is missing its pair.`, sources: [] })
  for (const [partId, at] of Object.entries(lab.wires)) {
    if (!at || !fastenedAt(at) || lab.fasteners[at] === 'tight') continue
    const pv = /^pv\d[pn]$/.test(at)
    const note = pv ? LOOSE_NOTES.pv : LOOSE_NOTES.other
    issues.push({ kind: 'loose', partId, socketId: at, text: `${socketById(at).label} is ${lab.fasteners[at] === 'removed' ? 'missing its bolt' : 'not tight'}. ${note.text}`, sources: note.sources })
  }
  for (const id of lab.bad) {
    const replaced = !!lab.spare && partById(id).correct.includes(lab.spare)
    if (!replaced) issues.push({ kind: 'bad-cable', partId: id, text: `${partById(id).label}: ${BAD_CABLE_NOTE.text}`, sources: BAD_CABLE_NOTE.sources })
  }
  return { issues, done: issues.length === 0 }
}

// ------------------------------------------------------------------ scenarios

export interface LabScenario {
  ids: string[]
  pvString: number
  lab: LabState
  titles: string[]
  symptoms: string[]
  fixes: string[]
  sources: SourceRef[]
}

/** Parts and sockets a lab scenario touches, so two faults never overlap. */
function labTouched(id: string, pvString: number): string[] {
  switch (id) {
    case 'loose-pv': return [`p_pv${pvString}p`, `p_pv${pvString}n`, `pv${pvString}p`]
    case 'loose-battery': return ['p_bat_p', 'p_bat_n', 'bat_p']
    case 'bad-bms-cable': return ['p_bms_cable', 'p_emsc_cable', 'p_addressing_cable']
    default: return touched(id, pvString)
  }
}

export function makeLabScenario(seed: number, only?: string): LabScenario {
  const rng = createRng(seed)
  const pvString = pick(rng, [1, 2])
  const pool = [...SCENARIO_IDS, ...LAB_SCENARIO_IDS]
  const first = only ?? pick(rng, pool)
  const ids = [first]
  if (!only && rng() < 0.5) {
    const used = new Set(labTouched(first, pvString))
    const options = shuffle(rng, pool).filter((id) => id !== first && labTouched(id, pvString).every((p) => !used.has(p)))
    if (options.length) ids.push(options[0])
  }
  const lab = correctLab(randFloat(rng, 51.6, 54.4, 1))
  for (const id of ids) {
    if (SCENARIO_IDS.includes(id)) applyWireFault(id, lab.wires, pvString)
    else if (id === 'loose-pv') lab.fasteners[`pv${pvString}p`] = 'loose'
    else if (id === 'loose-battery') lab.fasteners.bat_p = 'loose'
    else if (id === 'bad-bms-cable') lab.bad = [...lab.bad, 'p_bms_cable']
  }
  const text = ids.map((id) => SCENARIO_TEXT[id] ?? LAB_SCENARIO_TEXT[id])
  return {
    ids,
    pvString,
    lab,
    titles: text.map((t) => t.title),
    symptoms: text.map((t) => t.symptom.replace('One string', `String ${pvString}`)),
    fixes: text.map((t) => t.fix),
    sources: text.flatMap((t) => t.sources),
  }
}

/** Whether one fault of a scenario is fixed in the current lab state. */
export function faultFixed(id: string, pvString: number, lab: LabState): boolean {
  const w = lab.wires
  const at = (part: string) => w[part] === partById(part).correct[0]
  switch (id) {
    case 'ct-meter': return at('p_ct_cable')
    case 'comms-swap': return at('p_emsc_cable') && at('p_bms_cable')
    case 'pv-reversed': return at(`p_pv${pvString}p`) && at(`p_pv${pvString}n`)
    case 'battery-reversed': return at('p_bat_p') && at('p_bat_n')
    case 'rsd-open': return at('p_rsd_loop')
    case 'grid-swap': return at('p_grid_l1') && at('p_grid_l2')
    case 'load-swap': return at('p_load_l1') && at('p_load_l2')
    case 'antennas-swapped': return at('p_antenna_cell') && at('p_antenna_wifi')
    case 'addressing-cable-left': return w.p_addressing_cable === null && at('p_bms_cable')
    case 'loose-pv': return lab.fasteners[`pv${pvString}p`] === 'tight'
    case 'loose-battery': return lab.fasteners.bat_p === 'tight'
    case 'bad-bms-cable': return lab.spare === 'bms' && w.p_bms_cable !== 'bms'
    default: return false
  }
}

// ------------------------------------------------------------------ tasks

export interface TaskItem {
  id: string
  label: string
  done: boolean
}

export function tasksFor(sc: LabScenario, lab: LabState, inspected: ReadonlySet<string>): TaskItem[] {
  const explore = EXPLORE_TASKS.map((t) => ({ id: t.id, label: t.label, done: t.components.some((c) => inspected.has(c)) && (t.id !== 'x-ac' || t.components.every((c) => inspected.has(c))) }))
  const fixes = sc.ids.map((id, i) => ({ id: `f-${id}`, label: `Fix: ${sc.titles[i]}`, done: faultFixed(id, sc.pvString, lab) }))
  const final = { id: 'final', label: 'Every wire correct and every bolt tight', done: gradeLab(lab).done }
  return [...explore, ...fixes, final]
}

export const progressOf = (tasks: TaskItem[]): number => Math.round((100 * tasks.filter((t) => t.done).length) / tasks.length)

// ------------------------------------------------------------------ meter and cable tester

export interface Reading {
  headline: string
  detail: string
  sources: SourceRef[]
  /** False when the documents do not describe a reading for these points. */
  described: boolean
}

const TSM = (...p: number[]) => src('tsm', ...p)

/** Which part is on a socket and secured there (bolted sockets must be tight). */
function secured(lab: LabState, socketId: string): string | null {
  const part = Object.keys(lab.wires).find((k) => lab.wires[k] === socketId)
  if (!part) return null
  if (fastenedAt(socketId) && lab.fasteners[socketId] !== 'tight') return null
  return part
}

const phase = (part: string | null): number | null => (part === 'p_grid_l1' ? 1 : part === 'p_grid_l2' ? -1 : part === 'p_grid_n' ? 0 : null)

/** What the voltmeter or continuity beeper shows between two test points (socket ids). */
export function measure(lab: LabState, mode: 'volts' | 'continuity', a: string, b: string): Reading {
  const none: Reading = { headline: 'No reading described', detail: 'The documents read do not describe a reading for these two points.', sources: [], described: false }
  if (a === b) return { ...none, headline: 'Same point', detail: 'Put the probes on two different points.' }
  const pair = new Set([a, b])
  const has = (x: string, y: string) => pair.has(x) && pair.has(y)

  if (has('bat_p', 'bat_n') && mode === 'volts') {
    const p = secured(lab, 'bat_p')
    const n = secured(lab, 'bat_n')
    if (!p || !n) return { headline: 'Not a reliable reading', detail: 'A battery cable is off, or its bolt is not tight. Tighten it first, then measure again.', sources: [TSM(7)], described: true }
    const sign = p === 'p_bat_p' && n === 'p_bat_n' ? 1 : p === 'p_bat_n' && n === 'p_bat_p' ? -1 : 0
    if (sign === 0) return none
    const v = (sign * lab.batteryV).toFixed(1)
    return {
      headline: `${v} V`,
      detail: sign === 1 ? 'The acceptable battery voltage before wiring is 51 to 55.6 VDC.' : 'The red probe is on the negative cable. The battery cables are reversed: reverse polarity will probably destroy something. Fix it before power-up.',
      sources: [src('manual', 21), TSM(53, 78)],
      described: true,
    }
  }

  const pv = /^pv(\d)([pn])$/.exec(a)
  const pv2 = /^pv(\d)([pn])$/.exec(b)
  if (pv && pv2 && pv[1] === pv2[1] && pv[2] !== pv2[2] && mode === 'volts') {
    const plus = pv[2] === 'p' ? a : b
    const minus = pv[2] === 'p' ? b : a
    const pp = secured(lab, plus)
    const pn = secured(lab, minus)
    if (!pp || !pn) return { headline: 'Open: no string connected', detail: 'One side of this PV input has no wire, or its bolt is not tight.', sources: [TSM(63)], described: true }
    const n = pv[1]
    if (pp === `p_pv${n}p` && pn === `p_pv${n}n`) return { headline: 'Positive voltage', detail: 'The string reads positive. The exact voltage depends on the panels and the sun.', sources: [TSM(63)], described: true }
    if (pp === `p_pv${n}n` && pn === `p_pv${n}p`) return { headline: 'about -1 V', detail: 'PV+ to PV- reads about -1 V, so the PV lines are reversed. Swap the string wires on this input. Reversed polarity is a common cause of no solar power.', sources: [TSM(63)], described: true }
    return none
  }

  const ga = phase(secured(lab, a))
  const gb = phase(secured(lab, b))
  const isGrid = (s: string) => s.startsWith('grid_')
  if (isGrid(a) && isGrid(b) && mode === 'volts') {
    if (!lab.gridOn) return { headline: '0 V', detail: 'The grid breaker is off.', sources: [TSM(45)], described: true }
    if (ga === null || gb === null) return { headline: 'Not a reliable reading', detail: 'A grid wire is missing or its bolt is not tight.', sources: [TSM(7)], described: true }
    const v = Math.abs(ga - gb) * 120
    return {
      headline: `${v} V`,
      detail: 'Split phase reads 120 V line to neutral and 240 V line to line. A single meter reading cannot show swapped L1 and L2: in a parallel system the inverter finds it and raises alarm A2_20.',
      sources: [TSM(34, 45, 85)],
      described: true,
    }
  }
  return none
}

/** The remote shutdown plug is one point in the lab, so it has its own meter rule. */
export function measureRsd(lab: LabState, mode: 'volts' | 'continuity'): Reading {
  const loop = lab.wires.p_rsd_loop === 'rsd'
  if (mode === 'volts') {
    return loop
      ? { headline: '0 V', detail: 'The loop is closed, so the remote shutdown circuit is closed. If this terminal reads 5 V, the circuit is open.', sources: [TSM(32, 36, 39)], described: true }
      : { headline: '5 V', detail: 'The remote shutdown terminal reads 5 V DC, so the circuit is open. The remote shutdown switch, the AC/DC button and the Complete System Shutdown button must all be closed, and the port comes with a wire loop from the factory.', sources: [TSM(32, 34, 36, 39)], described: true }
  }
  return loop
    ? { headline: 'Continuity (beep)', detail: 'The factory wire loop closes the remote shutdown circuit.', sources: [TSM(32, 39)], described: true }
    : { headline: 'Open (no beep)', detail: 'Nothing is plugged in, so the circuit is open. Plug the factory loop or a closed switch back in.', sources: [TSM(32, 36, 39)], described: true }
}

export interface TestResult {
  pass: boolean
  headline: string
  detail: string
  sources: SourceRef[]
}

/** Cable tester on an Ethernet cable (`p_*` part id, or 'spare'). A cable tester checks the cable, not where it is plugged. */
export function testCable(lab: LabState, partId: string): TestResult {
  const fail = partId !== 'spare' && lab.bad.includes(partId)
  return fail
    ? { pass: false, headline: 'Fails the cable tester', detail: BAD_CABLE_NOTE.text, sources: BAD_CABLE_NOTE.sources }
    : { pass: true, headline: 'Passes the cable tester', detail: 'All the wires in the cable have continuity. A good cable can still be in the wrong port.', sources: [TSM(23, 80)] }
}
