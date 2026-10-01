import { describe, expect, it } from 'vitest'
import {
  generateLeakScenario,
  gradeLeak,
  leakDetectable,
  measure,
  truthDecision,
  type LeakScenario,
  type Measurement,
} from './leakage'

const seeds = Array.from({ length: 500 }, (_, i) => i + 1)
const base: LeakScenario = { stringVolts: 380, mlpe: false, rssEnergized: true, leak: null }

/** Takes the full correct sequence of measurements. */
function fullTest(s: LeakScenario): Measurement[] {
  const log: Measurement[] = []
  for (const side of ['PV-', 'PV+'] as const) {
    const v = measure(s, true, 'volts', side, 'GND')
    log.push(v)
    if (v.clean) log.push(measure(s, true, 'continuity', side, 'GND'))
  }
  return log
}

describe('leakage measurements', () => {
  it('a clean string reads 0V and open to GND', () => {
    expect(measure(base, true, 'volts', 'PV+', 'GND').reading).toBe('0.00 V')
    expect(measure(base, true, 'continuity', 'PV-', 'GND').reading).toBe('OPEN')
  })

  it('a voltage leak shows voltage on the leaking side only', () => {
    const s: LeakScenario = { ...base, leak: { side: 'PV-', shows: 'voltage', volts: 90 } }
    expect(measure(s, true, 'volts', 'PV-', 'GND').reading).toBe('90.00 V')
    expect(measure(s, true, 'volts', 'PV+', 'GND').reading).toBe('0.00 V')
  })

  it('a continuity leak reads about 0V but CLOSED on continuity', () => {
    const s: LeakScenario = { ...base, leak: { side: 'PV+', shows: 'continuity', volts: 0 } }
    expect(measure(s, true, 'volts', 'PV+', 'GND').clean).toBe(true)
    const c = measure(s, true, 'continuity', 'PV+', 'GND')
    expect(c.reading).toContain('CLOSED')
    expect(c.clean).toBe(false)
  })

  it('the leads can be swapped', () => {
    const s: LeakScenario = { ...base, leak: { side: 'PV-', shows: 'voltage', volts: 50 } }
    expect(measure(s, true, 'volts', 'GND', 'PV-').reading).toBe('50.00 V')
  })

  it('measuring to GND with the PV Disconnect on is not valid', () => {
    const m = measure(base, false, 'volts', 'PV-', 'GND')
    expect(m.reading).toBe('Not valid')
    expect(m.counts).toBe(false)
  })

  it('MLPE with rapid shutdown not turning panels on hides the leak', () => {
    const s: LeakScenario = { ...base, mlpe: true, rssEnergized: false, leak: { side: 'PV+', shows: 'continuity', volts: 0 } }
    expect(leakDetectable(s)).toBe(false)
    expect(measure(s, true, 'continuity', 'PV+', 'GND').reading).toBe('OPEN')
    expect(measure(s, true, 'volts', 'PV+', 'PV-').reading).toBe('0.00 V')
    expect(truthDecision(s)).toBe('inconclusive')
  })

  it('PV(+) to PV(-) is shown but does not count toward the test', () => {
    const m = measure(base, true, 'volts', 'PV+', 'PV-')
    expect(m.counts).toBe(false)
    expect(m.reading).toBe('380.00 V')
  })
})

describe('leakage scenarios', () => {
  it('is deterministic per seed', () => {
    expect(generateLeakScenario(11)).toEqual(generateLeakScenario(11))
  })

  it('covers every decision and has consistent truth', () => {
    const seen = new Set<string>()
    for (const seed of seeds) {
      const s = generateLeakScenario(seed)
      seen.add(truthDecision(s))
      expect(s.stringVolts).toBeGreaterThanOrEqual(240)
      expect(s.stringVolts).toBeLessThanOrEqual(470)
      if (s.leak?.shows === 'voltage') expect(s.leak.volts).toBeGreaterThan(0)
      if (!s.mlpe) expect(s.rssEnergized).toBe(true)
      if (truthDecision(s) === 'not-safe') expect(leakDetectable(s)).toBe(true)
      if (truthDecision(s) === 'safe') expect(s.leak).toBeNull()
    }
    expect([...seen].sort()).toEqual(['inconclusive', 'not-safe', 'safe'])
  })
})

describe('leakage grading', () => {
  it('gives 100 for the correct procedure and call, on every scenario', () => {
    for (const seed of seeds) {
      const s = generateLeakScenario(seed)
      const g = gradeLeak(s, fullTest(s), truthDecision(s))
      expect(g.score).toBe(100)
    }
  })

  it('flags measuring to GND with the PV Disconnect on', () => {
    const live = measure(base, false, 'volts', 'PV-', 'GND')
    const g = gradeLeak(base, [live, ...fullTest(base)], 'safe')
    expect(g.items.find((i) => i.key === 'pvOff')!.correct).toBe(false)
  })

  it('requires continuity on PV(+), not PV(-) twice (the manual typo)', () => {
    const log: Measurement[] = [
      measure(base, true, 'volts', 'PV-', 'GND'),
      measure(base, true, 'continuity', 'PV-', 'GND'),
      measure(base, true, 'volts', 'PV+', 'GND'),
      measure(base, true, 'continuity', 'PV-', 'GND'),
    ]
    const g = gradeLeak(base, log, 'safe')
    const plus = g.items.find((i) => i.key === 'plus')!
    expect(plus.correct).toBe(false)
    expect(plus.detail).toContain('PV(+)')
  })

  it('an immediate "safe" with no measurements scores low and states the truth', () => {
    const s: LeakScenario = { ...base, leak: { side: 'PV-', shows: 'voltage', volts: 60 } }
    const g = gradeLeak(s, [], 'safe')
    expect(g.score).toBe(0)
    expect(g.truth).toContain('PV-')
  })

  it('MLPE de-energized: calling it safe is wrong even if it reads clean', () => {
    const s: LeakScenario = { ...base, mlpe: true, rssEnergized: false, leak: { side: 'PV-', shows: 'voltage', volts: 70 } }
    const g = gradeLeak(s, fullTest(s), 'safe')
    expect(g.items.find((i) => i.key === 'decision')!.correct).toBe(false)
    expect(g.truth).toContain('hidden')
  })

  it('a voltage leak does not require a continuity check on that side', () => {
    const s: LeakScenario = { ...base, leak: { side: 'PV-', shows: 'voltage', volts: 70 } }
    const log = [measure(s, true, 'volts', 'PV-', 'GND'), measure(s, true, 'volts', 'PV+', 'GND'), measure(s, true, 'continuity', 'PV+', 'GND')]
    expect(gradeLeak(s, log, 'not-safe').score).toBe(100)
  })
})
