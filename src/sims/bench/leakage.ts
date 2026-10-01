import {
  PV_DECISION_INFO,
  PV_STEP_SOURCES,
  PV_STEP_TEXT,
  type DecisionPv,
} from '../../content/sims/benchParams'
import type { SourceRef } from '../../content/types'
import { createRng, pick, randFloat, randInt } from '../rng'

export type { DecisionPv }
export type Node = 'PV+' | 'PV-' | 'GND'
export type MeterMode = 'volts' | 'continuity'

export interface LeakScenario {
  /** String open-circuit voltage between PV(+) and PV(-) when the panels are on. */
  stringVolts: number
  /** Module level power electronics (optimizers) on the array. */
  mlpe: boolean
  /** Whether rapid shutdown is currently turning the panels on. Only meaningful with MLPE. */
  rssEnergized: boolean
  /** Hidden path to ground, or null. `volts` is the simulated reading when the string is energized. */
  leak: { side: 'PV+' | 'PV-'; shows: 'voltage' | 'continuity'; volts: number } | null
}

/** Panels are producing voltage unless MLPE is on and rapid shutdown is not turning them on. */
export const panelsEnergized = (s: LeakScenario): boolean => !s.mlpe || s.rssEnergized

/** What the test can reveal: a leak is only detectable while the panels are energized. */
export const leakDetectable = (s: LeakScenario): boolean => s.leak !== null && panelsEnergized(s)

export function truthDecision(s: LeakScenario): DecisionPv {
  if (!panelsEnergized(s)) return 'inconclusive'
  return s.leak ? 'not-safe' : 'safe'
}

type Kind =
  | 'clean'
  | 'leak-minus-voltage'
  | 'leak-plus-voltage'
  | 'leak-minus-continuity'
  | 'leak-plus-continuity'
  | 'mlpe-on-clean'
  | 'mlpe-on-leak'
  | 'mlpe-off-hidden-leak'
  | 'mlpe-off-clean'
const KINDS: Kind[] = [
  'clean',
  'clean',
  'leak-minus-voltage',
  'leak-plus-voltage',
  'leak-minus-continuity',
  'leak-plus-continuity',
  'mlpe-on-clean',
  'mlpe-on-leak',
  'mlpe-off-hidden-leak',
  'mlpe-off-clean',
]

export function generateLeakScenario(seed: number): LeakScenario {
  const rng = createRng(seed)
  const kind = pick(rng, KINDS)
  const stringVolts = randInt(rng, 240, 470)
  const mkLeak = (side: 'PV+' | 'PV-', shows: 'voltage' | 'continuity'): LeakScenario['leak'] => ({
    side,
    shows,
    volts: shows === 'voltage' ? randFloat(rng, 25, 190, 1) : 0,
  })
  const sideOf = () => pick(rng, ['PV+', 'PV-'] as const)
  const showsOf = () => pick(rng, ['voltage', 'continuity'] as const)

  switch (kind) {
    case 'clean':
      return { stringVolts, mlpe: false, rssEnergized: true, leak: null }
    case 'leak-minus-voltage':
      return { stringVolts, mlpe: false, rssEnergized: true, leak: mkLeak('PV-', 'voltage') }
    case 'leak-plus-voltage':
      return { stringVolts, mlpe: false, rssEnergized: true, leak: mkLeak('PV+', 'voltage') }
    case 'leak-minus-continuity':
      return { stringVolts, mlpe: false, rssEnergized: true, leak: mkLeak('PV-', 'continuity') }
    case 'leak-plus-continuity':
      return { stringVolts, mlpe: false, rssEnergized: true, leak: mkLeak('PV+', 'continuity') }
    case 'mlpe-on-clean':
      return { stringVolts, mlpe: true, rssEnergized: true, leak: null }
    case 'mlpe-on-leak':
      return { stringVolts, mlpe: true, rssEnergized: true, leak: mkLeak(sideOf(), showsOf()) }
    case 'mlpe-off-hidden-leak':
      return { stringVolts, mlpe: true, rssEnergized: false, leak: mkLeak(sideOf(), showsOf()) }
    case 'mlpe-off-clean':
      return { stringVolts, mlpe: true, rssEnergized: false, leak: null }
  }
}

// ---- measuring -------------------------------------------------------------

export interface Measurement {
  mode: MeterMode
  a: Node
  b: Node
  /** Was the PV Disconnect already off when this reading was taken? */
  pvOff: boolean
  /** Display text, e.g. "0.00 V", "OPEN", "CLOSED (about 0 ohms)". */
  reading: string
  /** True when the reading is about 0V (voltage) or open (continuity). */
  clean: boolean
  /** True if this measurement counts toward the test (PV to GND, PV disconnect off). */
  counts: boolean
  note?: string
}

const pair = (a: Node, b: Node, x: Node, y: Node) => (a === x && b === y) || (a === y && b === x)

export function measure(s: LeakScenario, pvOff: boolean, mode: MeterMode, a: Node, b: Node): Measurement {
  const base = { mode, a, b, pvOff }
  if (a === b) return { ...base, reading: 'Leads on the same point', clean: true, counts: false, note: 'Put the leads on two different points.' }

  const toGround = a === 'GND' || b === 'GND'
  const side: Node = a === 'GND' ? b : a

  // Between PV(+) and PV(-): not part of the leakage test.
  if (!toGround && pair(a, b, 'PV+', 'PV-')) {
    if (mode === 'continuity') {
      return { ...base, reading: 'Not measured', clean: true, counts: false, note: 'Continuity across a string is not part of the leakage test.' }
    }
    const v = panelsEnergized(s) ? s.stringVolts : 0
    return {
      ...base,
      reading: `${v.toFixed(2)} V`,
      clean: true,
      counts: false,
      note: 'There can be voltage between PV(+) and PV(-). The test looks for voltage or continuity to GND.',
    }
  }

  if (!pvOff) {
    return {
      ...base,
      reading: 'Not valid',
      clean: true,
      counts: false,
      note: 'The PV Disconnect must be off before the test (step 1). Turn it off, then measure again.',
    }
  }

  const leakHere = s.leak !== null && s.leak.side === side && panelsEnergized(s)
  if (mode === 'volts') {
    const v = leakHere && s.leak!.shows === 'voltage' ? s.leak!.volts : 0
    return { ...base, reading: `${v.toFixed(2)} V`, clean: v < 1, counts: true }
  }
  // Continuity. A path is found when a leak is present and detectable on this side.
  const closed = leakHere
  return {
    ...base,
    reading: closed ? 'CLOSED (about 0 ohms)' : 'OPEN',
    clean: !closed,
    counts: true,
  }
}

// ---- grading ---------------------------------------------------------------

export interface LeakGradeItem {
  key: 'pvOff' | 'minus' | 'plus' | 'decision'
  label: string
  correct: boolean
  detail: string
  why: string
  sources: SourceRef[]
}

export interface LeakGrade {
  items: LeakGradeItem[]
  score: number
  /** What was really going on, shown after grading so a wrong "safe" has a visible consequence. */
  truth: string
}

const volts = (log: Measurement[], side: 'PV+' | 'PV-') =>
  log.filter((m) => m.counts && m.mode === 'volts' && (m.a === side || m.b === side))
const cont = (log: Measurement[], side: 'PV+' | 'PV-') =>
  log.filter((m) => m.counts && m.mode === 'continuity' && (m.a === side || m.b === side))

export function describeTruth(s: LeakScenario): string {
  if (!s.leak) {
    return s.mlpe && !s.rssEnergized
      ? 'There was no leakage path, but rapid shutdown was not turning the panels on, so the test could not have proved that.'
      : 'There was no path to ground.'
  }
  const where = `a path from ${s.leak.side} to ground (shows as ${s.leak.shows === 'voltage' ? 'voltage' : 'continuity'} when energized)`
  return s.mlpe && !s.rssEnergized
    ? `There was ${where}, hidden because rapid shutdown was not turning the panels on. Powering up with this path means catastrophic failure once the grid is on.`
    : `There was ${where}.`
}

/**
 * Items: PV Disconnect off first; PV(-) tests; PV(+) tests (continuity to PV(+), per the correction);
 * and the final call. A continuity check is only required on a side whose voltage read about 0V.
 */
export function gradeLeak(s: LeakScenario, log: Measurement[], decision: DecisionPv | undefined): LeakGrade {
  const items: LeakGradeItem[] = []

  const firstCounted = log.find((m) => m.counts || m.note?.startsWith('The PV Disconnect'))
  const measuredLive = log.some((m) => !m.pvOff && !(m.a !== 'GND' && m.b !== 'GND'))
  items.push({
    key: 'pvOff',
    label: 'PV Disconnect off before measuring',
    correct: log.length > 0 && !measuredLive && !!firstCounted?.pvOff,
    detail: measuredLive ? 'You measured to GND with the PV Disconnect still on.' : log.length === 0 ? 'No measurements taken.' : 'Done first.',
    why: PV_STEP_TEXT.pvOff,
    sources: PV_STEP_SOURCES,
  })

  const sideItem = (side: 'PV+' | 'PV-', key: 'minus' | 'plus'): LeakGradeItem => {
    const v = volts(log, side)
    const c = cont(log, side)
    const needCont = v.some((m) => m.clean) // about 0V means continuity must be checked next
    const ok = v.length > 0 && (!needCont || c.length > 0)
    const mistaken =
      key === 'plus' && c.length === 0 && cont(log, 'PV-').length > 1
        ? ' It looks like PV(-) continuity was repeated. Step 3 checks PV(+) (the manual typo says PV(-)).'
        : ''
    return {
      key,
      label: `Tests from ${side} to GND`,
      correct: ok,
      detail: ok ? 'Voltage and, where needed, continuity were checked.' : `Missing: ${v.length === 0 ? 'voltage' : 'continuity'} ${side} to GND.${mistaken}`,
      why: key === 'minus' ? PV_STEP_TEXT.minus : PV_STEP_TEXT.plus,
      sources: PV_STEP_SOURCES,
    }
  }
  items.push(sideItem('PV-', 'minus'), sideItem('PV+', 'plus'))

  const truth = truthDecision(s)
  items.push({
    key: 'decision',
    label: 'Safe to proceed to power-up?',
    correct: decision === truth,
    detail: `You said: ${decision ? PV_DECISION_INFO[decision].label : 'no answer'}. Correct: ${PV_DECISION_INFO[truth].label}.`,
    why: PV_DECISION_INFO[truth].why,
    sources: PV_DECISION_INFO[truth].sources,
  })

  const right = items.filter((i) => i.correct).length
  return { items, score: Math.round((right / items.length) * 100), truth: describeTruth(s) }
}
