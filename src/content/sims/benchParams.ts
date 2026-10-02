import type { SourceRef } from '../types'

const src = (source: SourceRef['source'], ...pages: number[]): SourceRef => ({ source, ...(pages.length ? { pages } : {}) })

/**
 * Thresholds for the battery bench. Every number is from a source:
 * - 51-55.6 VDC acceptable before wiring: Correction 1 (manual p.21 says 45-55.6, a typo)
 * - 53.5V (about 98%+ charged) and 51.2V (about under 7% charged), 0.5V spread: manual p.20
 * The author chose not to define a "large spread" fail threshold, so the bench only flags spread > 0.5V.
 */
export const BATTERY_RULES = {
  acceptableMin: 51,
  acceptableMax: 55.6,
  lowChargeBelow: 51.2,
  highChargeAbove: 53.5,
  maxSpread: 0.5,
} as const

export type BatteryClass = 'ok' | 'low-charge' | 'dead-low' | 'high-out'
export type SystemDecision = 'wire-now' | 'wire-with-procedure' | 'charge-first' | 'do-not-wire'

export interface Described {
  label: string
  /** Shown after grading: the rule and why. */
  why: string
  sources: SourceRef[]
}

export const CLASS_INFO: Record<BatteryClass, Described> = {
  ok: {
    label: 'In range: fine to wire',
    why: 'Between 51 and 55.6 VDC and at or above 51.2V, so it can be wired. If it rests above 53.5V it is probably over 98% charged and can be quickly discharged to 53.5V by running the inverter on battery only.',
    sources: [src('manual', 20), src('author')],
  },
  'low-charge': {
    label: 'In range but low: charge it to within 0.5V of the others first',
    why: 'Between 51.0 and 51.2V the battery is inside the acceptable range, but below 51.2V it is probably under 7% charged. Charge it up to within 0.5V of the other batteries before connecting in parallel.',
    sources: [src('manual', 20), src('author')],
  },
  'dead-low': {
    label: 'Below 51V: out of range, recover the battery before wiring it',
    why: 'Below 51 VDC the battery is out of the acceptable range. A battery that reads 0V usually has its circuit breaker off after a deep discharge (Technical Service Manual p.21). Turn the breaker on, charge it at a low current, and use the 60V/5A supply at 54V/5A if it will not charge by itself (p.24).',
    sources: [src('tsm', 21, 24), src('author')],
  },
  'high-out': {
    label: 'Above 55.6V: out of range, do not wire, call ESS Support',
    why: 'The acceptable range tops out at 55.6 VDC. If a battery is outside the range, contact LionESS support at (435) 244-3352.',
    sources: [src('manual', 21), src('emsc', 16)],
  },
}

export const DECISION_INFO: Record<SystemDecision, Described> = {
  'wire-now': {
    label: 'Yes: every battery is in range and within 0.5V of the others',
    why: 'All batteries are within the acceptable range and within 0.5V of each other. Wire in the correct order: cables to the inverter first, battery receptacles last, positives last of all.',
    sources: [src('manual', 20, 21)],
  },
  'wire-with-procedure': {
    label: 'Yes, but they are more than 0.5V apart: use the paralleling procedure',
    why: 'All batteries are in range but not within 0.5V of each other. The 0.5V figure is the recommendation, because excessive current may flow between batteries that are further apart. Use the paralleling procedure: lowest battery first, then add the next once it is within 0.5V. (In the field a larger spread is usually not a big problem.)',
    sources: [src('manual', 20), src('author')],
  },
  'charge-first': {
    label: 'Not yet: a low battery must be charged to within 0.5V of the others first',
    why: 'A battery between 51.0 and 51.2V is probably under 7% charged. Charge it up to within 0.5V of the others before connecting it in parallel.',
    sources: [src('manual', 20)],
  },
  'do-not-wire': {
    label: 'No: a battery is outside 51-55.6V and has to be dealt with first',
    why: 'A battery outside the 51-55.6 VDC range is not acceptable to wire. Below 51V charge it with the power supply; above 55.6V contact ESS Support.',
    sources: [src('manual', 21), src('author')],
  },
}

export const ORDER_WHY =
  'Plug in the positive of the lowest-voltage battery first. Add the next lowest once the lowest is within 0.5V of it, and repeat until all are in. Batteries more than 0.5V apart can let excessive current flow between them.'
export const ORDER_SOURCES: SourceRef[] = [src('manual', 20)]

// ---- PV leakage test ------------------------------------------------------

export type DecisionPv = 'safe' | 'not-safe' | 'inconclusive'

export const PV_DECISION_INFO: Record<DecisionPv, Described> = {
  safe: {
    label: 'Safe to proceed to power-up',
    why: 'Voltage and continuity from both PV(+) and PV(-) to GND were about 0V and open circuit, so there is no path to ground.',
    sources: [src('manual', 27)],
  },
  'not-safe': {
    label: 'Not safe: there is a path to ground, fix the PV wiring first',
    why: 'Any voltage or continuity between PV(+) or PV(-) and GND indicates a current path. Do not proceed to power-up until the PV wiring has no path to ground, and do not turn on any grid breaker.',
    sources: [src('manual', 27, 42)],
  },
  inconclusive: {
    label: 'Cannot conclude: with MLPE the test may miss leakage if rapid shutdown is not turning the panels on',
    why: 'With module level power electronics, this test may not detect a PV-to-ground leakage path if the rapid shutdown system is not turning the PV panels on. A clean result is not conclusive.',
    sources: [src('manual', 27)],
  },
}

export const PV_STEP_TEXT = {
  pvOff: 'Rotate the PV Disconnect to off before measuring (step 1).',
  minus: 'Measure voltage PV(-) to GND, then continuity PV(-) to GND if the voltage is about 0V (step 2).',
  plus: 'Measure voltage PV(+) to GND, then continuity PV(+) to GND if the voltage is about 0V (step 3, corrected: PV(+), not PV(-) again).',
}
export const PV_STEP_SOURCES: SourceRef[] = [src('manual', 27), src('author')]
