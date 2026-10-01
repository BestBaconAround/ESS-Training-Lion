import {
  BATTERY_RULES as R,
  CLASS_INFO,
  DECISION_INFO,
  ORDER_SOURCES,
  ORDER_WHY,
  type BatteryClass,
  type SystemDecision,
} from '../../content/sims/benchParams'
import type { SourceRef } from '../../content/types'
import { createRng, pick, randFloat, randInt, shuffle, type Rng } from '../rng'

export type { BatteryClass, SystemDecision }

export interface Battery {
  id: string
  label: string
  /** Resting voltage at room temperature, volts. */
  volts: number
}

export interface BatteryScenario {
  batteries: Battery[]
  truth: {
    classes: Record<string, BatteryClass>
    decision: SystemDecision
    /** Battery ids lowest voltage first, or null when no order is asked. */
    order: string[] | null
    spread: number
  }
}

export function classify(volts: number): BatteryClass {
  if (volts < R.acceptableMin) return 'dead-low'
  if (volts > R.acceptableMax) return 'high-out'
  if (volts < R.lowChargeBelow) return 'low-charge'
  return 'ok'
}

const round2 = (n: number) => Math.round(n * 100) / 100
const spreadOf = (vs: number[]) => (vs.length ? Math.max(...vs) - Math.min(...vs) : 0)

export function decide(volts: number[]): SystemDecision {
  const classes = volts.map(classify)
  if (classes.some((c) => c === 'dead-low' || c === 'high-out')) return 'do-not-wire'
  if (classes.includes('low-charge')) return 'charge-first'
  return round2(spreadOf(volts)) > R.maxSpread ? 'wire-with-procedure' : 'wire-now'
}

type Kind = 'tight' | 'wide' | 'low-charge' | 'dead' | 'high'
const KINDS: Kind[] = ['tight', 'tight', 'tight', 'wide', 'wide', 'wide', 'low-charge', 'low-charge', 'dead', 'dead', 'high', 'high']
const clampOk = (v: number) => Math.min(R.acceptableMax, Math.max(R.lowChargeBelow, v))

function voltagesFor(rng: Rng, kind: Kind, n: number): number[] {
  const okOther = () => randFloat(rng, 52.0, 54.6)
  switch (kind) {
    case 'tight': {
      const base = randFloat(rng, 51.6, 55.1)
      return Array.from({ length: n }, () => clampOk(base + randFloat(rng, 0, 0.4)))
    }
    case 'wide': {
      const low = randFloat(rng, 51.5, 53.0)
      const high = Math.min(R.acceptableMax, low + randFloat(rng, 0.7, 2.4))
      const vs = [low, high]
      if (n === 3) vs.push(randFloat(rng, low + 0.1, high - 0.1))
      return vs
    }
    case 'low-charge':
      return [randFloat(rng, 51.0, 51.19), ...Array.from({ length: n - 1 }, okOther)]
    case 'dead':
      return [rng() < 0.3 ? 0 : randFloat(rng, 41, 50.9), ...Array.from({ length: n - 1 }, okOther)]
    case 'high':
      return [randFloat(rng, 55.7, 57.4), ...Array.from({ length: n - 1 }, okOther)]
  }
}

/** Nudges duplicates apart so each battery has a distinct voltage (needed for a clear plug-in order). */
function dedupe(vs: number[]): number[] {
  const seen = new Set<number>()
  return vs.map((v) => {
    let x = round2(v)
    while (seen.has(x)) x = round2(x + 0.01)
    seen.add(x)
    return x
  })
}

export function generateBatteryScenario(seed: number): BatteryScenario {
  const rng = createRng(seed)
  const kind = pick(rng, KINDS)
  const n = kind === 'wide' ? randInt(rng, 2, 3) : randInt(rng, 1, 3)
  const volts = shuffle(rng, dedupe(voltagesFor(rng, kind, n)))
  const batteries: Battery[] = volts.map((v, i) => ({ id: `b${i}`, label: `Battery ${'ABC'[i]}`, volts: v }))

  const decision = decide(volts)
  const askOrder = n >= 2 && decision !== 'do-not-wire'
  return {
    batteries,
    truth: {
      classes: Object.fromEntries(batteries.map((b) => [b.id, classify(b.volts)])),
      decision,
      order: askOrder ? [...batteries].sort((a, b) => a.volts - b.volts).map((b) => b.id) : null,
      spread: round2(spreadOf(volts)),
    },
  }
}

// ---- grading -------------------------------------------------------------

export interface BatteryAnswer {
  classes: Record<string, BatteryClass | undefined>
  decision?: SystemDecision
  /** Battery ids in the order the learner plugged the positives in. */
  order: string[]
}

export interface GradeItem {
  key: string
  label: string
  correct: boolean
  yours: string
  expected: string
  why: string
  sources: SourceRef[]
}

export interface BatteryGrade {
  items: GradeItem[]
  /** 0-100. */
  score: number
}

export function gradeBattery(s: BatteryScenario, a: BatteryAnswer): BatteryGrade {
  const items: GradeItem[] = []

  for (const b of s.batteries) {
    const truth = s.truth.classes[b.id]
    const given = a.classes[b.id]
    items.push({
      key: `class-${b.id}`,
      label: `${b.label} (${b.volts.toFixed(2)} V)`,
      correct: given === truth,
      yours: given ? CLASS_INFO[given].label : 'No answer',
      expected: CLASS_INFO[truth].label,
      why: CLASS_INFO[truth].why,
      sources: CLASS_INFO[truth].sources,
    })
  }

  const d = s.truth.decision
  items.push({
    key: 'decision',
    label: 'Can the system be wired?',
    correct: a.decision === d,
    yours: a.decision ? DECISION_INFO[a.decision].label : 'No answer',
    expected: DECISION_INFO[d].label,
    why: DECISION_INFO[d].why,
    sources: DECISION_INFO[d].sources,
  })

  // The order step is always shown for 2+ batteries so its presence does not give away the decision.
  // When something must be fixed first, the right answer is to plug nothing in yet.
  if (s.batteries.length >= 2) {
    const name = (id: string) => s.batteries.find((b) => b.id === id)?.label ?? id
    const expectedOrder = s.truth.order
    const ok = expectedOrder
      ? a.order.length === expectedOrder.length && a.order.every((id, i) => id === expectedOrder[i])
      : a.order.length === 0
    items.push({
      key: 'order',
      label: 'Order to plug in the positive cables',
      correct: ok,
      yours: a.order.length ? a.order.map(name).join(', then ') : 'Plugged nothing in',
      expected: expectedOrder ? expectedOrder.map(name).join(', then ') : 'Plug nothing in yet: fix the out-of-range battery first',
      why: expectedOrder ? ORDER_WHY : 'A battery outside 51-55.6V has to be dealt with before any positive cable is plugged in.',
      sources: ORDER_SOURCES,
    })
  }

  const right = items.filter((i) => i.correct).length
  return { items, score: Math.round((right / items.length) * 100) }
}
