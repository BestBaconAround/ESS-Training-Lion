import { describe, expect, it } from 'vitest'
import { CURVE_POINTS, LION_LIMITS } from '../../content/sims/lfpCurve'
import { cellVoltageAt, cellVolts, packVolts, zoneAt } from './curve'

describe('LFP curve', () => {
  it('hits the table points and falls as the battery discharges', () => {
    for (const p of CURVE_POINTS) expect(cellVoltageAt(p.soc)).toBeCloseTo(p.cell, 5)
    let prev = Infinity
    for (let s = 100; s >= 0; s -= 5) {
      const v = cellVoltageAt(s)
      expect(v).toBeLessThanOrEqual(prev + 1e-9)
      prev = v
    }
  })
  it('is flat in the middle and steep at the bottom', () => {
    expect(cellVoltageAt(80) - cellVoltageAt(30)).toBeLessThan(0.12)
    expect(cellVoltageAt(10) - cellVoltageAt(0)).toBeGreaterThan(0.4)
  })
  it('clamps outside 0 to 100', () => {
    expect(cellVoltageAt(-5)).toBe(cellVoltageAt(0))
    expect(cellVoltageAt(140)).toBe(cellVoltageAt(100))
  })
  it('scales to a 16-cell pack: 3.2 V is 51.2 V and 3.65 V is 58.4 V', () => {
    expect(packVolts(3.2)).toBeCloseTo(51.2, 6)
    expect(packVolts(3.65)).toBeCloseTo(58.4, 6)
    expect(cellVolts(51.2)).toBeCloseTo(3.2, 6)
  })
  it('uses Lion\'s limits in order', () => {
    expect(zoneAt(3.3).zone).toBe('normal')
    expect(zoneAt(3.7).zone).toBe('above-max')
    expect(zoneAt(2.6).zone).toBe('inverter-stops')
    expect(zoneAt(2.35).zone).toBe('battery-stops')
    expect(zoneAt(2.2).zone).toBe('min-power-risk')
  })
  it('every Lion limit has a source and the limits are sorted high to low', () => {
    for (const l of LION_LIMITS) expect(l.sources.length, l.id).toBeGreaterThan(0)
    const mv = LION_LIMITS.map((l) => l.mV)
    expect([...mv].sort((a, b) => b - a)).toEqual(mv)
  })
})
