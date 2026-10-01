import { describe, expect, it } from 'vitest'
import { classify, decide, generateBatteryScenario, gradeBattery, type BatteryAnswer } from './batteries'

const seeds = Array.from({ length: 500 }, (_, i) => i + 1)

describe('battery classification', () => {
  it('uses 51-55.6 as the acceptable range, 51.2 as the low-charge line', () => {
    expect(classify(0)).toBe('dead-low')
    expect(classify(50.99)).toBe('dead-low')
    expect(classify(51.0)).toBe('low-charge')
    expect(classify(51.19)).toBe('low-charge')
    expect(classify(51.2)).toBe('ok')
    expect(classify(55.6)).toBe('ok')
    expect(classify(55.61)).toBe('high-out')
  })

  it('45V is NOT acceptable (the manual typo range)', () => {
    expect(classify(46)).toBe('dead-low')
  })

  it('decides from classes and the 0.5V spread', () => {
    expect(decide([53.0, 53.4])).toBe('wire-now')
    expect(decide([53.0, 53.5])).toBe('wire-now')
    expect(decide([53.0, 53.6])).toBe('wire-with-procedure')
    expect(decide([51.1, 53.0])).toBe('charge-first')
    expect(decide([53.0, 49.0])).toBe('do-not-wire')
    expect(decide([53.0, 56.0])).toBe('do-not-wire')
    expect(decide([53.2])).toBe('wire-now')
  })
})

describe('battery scenarios', () => {
  it('is deterministic per seed and varies across seeds', () => {
    expect(generateBatteryScenario(7)).toEqual(generateBatteryScenario(7))
    expect(JSON.stringify(generateBatteryScenario(7))).not.toBe(JSON.stringify(generateBatteryScenario(8)))
  })

  it('always produces 1-3 batteries with distinct voltages and consistent truth', () => {
    for (const seed of seeds) {
      const s = generateBatteryScenario(seed)
      expect(s.batteries.length).toBeGreaterThanOrEqual(1)
      expect(s.batteries.length).toBeLessThanOrEqual(3)
      const vs = s.batteries.map((b) => b.volts)
      expect(new Set(vs).size).toBe(vs.length)
      for (const b of s.batteries) expect(s.truth.classes[b.id]).toBe(classify(b.volts))
      expect(s.truth.decision).toBe(decide(vs))
      if (s.truth.order) {
        const sorted = [...s.batteries].sort((a, b) => a.volts - b.volts).map((b) => b.id)
        expect(s.truth.order).toEqual(sorted)
      }
      // No order is asked for one battery or when something must be fixed first.
      if (s.batteries.length === 1 || s.truth.decision === 'do-not-wire') expect(s.truth.order).toBeNull()
    }
  })

  it('covers every decision and every battery class across seeds', () => {
    const decisions = new Set<string>()
    const classes = new Set<string>()
    for (const seed of seeds) {
      const s = generateBatteryScenario(seed)
      decisions.add(s.truth.decision)
      Object.values(s.truth.classes).forEach((c) => classes.add(c))
    }
    expect([...decisions].sort()).toEqual(['charge-first', 'do-not-wire', 'wire-now', 'wire-with-procedure'])
    expect([...classes].sort()).toEqual(['dead-low', 'high-out', 'low-charge', 'ok'])
  })

  it('"tight" scenarios really are within 0.5V', () => {
    for (const seed of seeds) {
      const s = generateBatteryScenario(seed)
      if (s.truth.decision === 'wire-now') expect(s.truth.spread).toBeLessThanOrEqual(0.5)
      if (s.truth.decision === 'wire-with-procedure') expect(s.truth.spread).toBeGreaterThan(0.5)
    }
  })
})

describe('battery grading', () => {
  const perfect = (seed: number): { s: ReturnType<typeof generateBatteryScenario>; a: BatteryAnswer } => {
    const s = generateBatteryScenario(seed)
    return { s, a: { classes: { ...s.truth.classes }, decision: s.truth.decision, order: s.truth.order ?? [] } }
  }

  it('gives 100 for a perfect answer', () => {
    for (const seed of seeds.slice(0, 100)) {
      const { s, a } = perfect(seed)
      expect(gradeBattery(s, a).score).toBe(100)
    }
  })

  it('grades step by step and explains each miss', () => {
    const { s, a } = perfect(3)
    const wrong: BatteryAnswer = { ...a, decision: s.truth.decision === 'wire-now' ? 'do-not-wire' : 'wire-now' }
    const g = gradeBattery(s, wrong)
    expect(g.score).toBeLessThan(100)
    const miss = g.items.find((i) => !i.correct)!
    expect(miss.why.length).toBeGreaterThan(20)
    expect(miss.sources.length).toBeGreaterThan(0)
  })

  it('plugging in the highest battery first is wrong', () => {
    for (const seed of seeds) {
      const { s, a } = perfect(seed)
      if (!s.truth.order || s.truth.order.length < 2) continue
      const g = gradeBattery(s, { ...a, order: [...s.truth.order].reverse() })
      expect(g.items.find((i) => i.key === 'order')!.correct).toBe(false)
      return
    }
  })

  it('counts unanswered items as wrong (except "plug nothing in" when that is correct)', () => {
    for (const seed of seeds.slice(0, 50)) {
      const s = generateBatteryScenario(seed)
      const g = gradeBattery(s, { classes: {}, order: [] })
      const order = g.items.find((i) => i.key === 'order')
      if (order) expect(order.correct).toBe(s.truth.order === null)
      expect(g.items.filter((i) => i.key !== 'order').every((i) => !i.correct)).toBe(true)
    }
  })

  it('asks for the order whenever there are 2+ batteries, and expects nothing plugged in when something must be fixed', () => {
    for (const seed of seeds) {
      const s = generateBatteryScenario(seed)
      const g = gradeBattery(s, { classes: { ...s.truth.classes }, decision: s.truth.decision, order: s.truth.order ?? [] })
      expect(g.items.some((i) => i.key === 'order')).toBe(s.batteries.length >= 2)
      if (s.batteries.length >= 2 && s.truth.decision === 'do-not-wire') {
        const wrong = gradeBattery(s, { classes: { ...s.truth.classes }, decision: s.truth.decision, order: s.batteries.map((b) => b.id) })
        expect(wrong.items.find((i) => i.key === 'order')!.correct).toBe(false)
      }
    }
  })
})
