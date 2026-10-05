import { describe, expect, it } from 'vitest'
import { TROUBLESHOOTING } from '../content/troubleshooting'
import { filterEntries, matches, stepsFor } from './filter'

describe('troubleshooting filter', () => {
  it('returns everything for an empty query and "all"', () => {
    expect(filterEntries(TROUBLESHOOTING, 'all', '')).toHaveLength(TROUBLESHOOTING.length)
  })

  it('filters by area', () => {
    const battery = filterEntries(TROUBLESHOOTING, 'battery', '')
    expect(battery.length).toBeGreaterThan(0)
    expect(battery.every((e) => e.area === 'battery')).toBe(true)
  })

  it('finds a fault code by its code, case-insensitively', () => {
    const hits = filterEntries(TROUBLESHOOTING, 'all', 'a2_10')
    expect(hits.map((e) => e.faultCode)).toContain('A2_10')
  })

  it('requires every word to match', () => {
    const e = TROUBLESHOOTING.find((x) => x.id === 'ts-battery-wont-address')!
    expect(matches(e, 'power supply 54V')).toBe(true)
    expect(matches(e, 'power supply zebra')).toBe(false)
  })

  it('matches the customer wording', () => {
    expect(filterEntries(TROUBLESHOOTING, 'all', 'zero volts').some((e) => e.id === 'ts-battery-wont-address')).toBe(true)
  })

  it('returns nothing when no entry matches', () => {
    expect(filterEntries(TROUBLESHOOTING, 'all', 'qqqqzzzz')).toEqual([])
  })

  it('shows only steps that apply to the chosen revision', () => {
    const cycle = TROUBLESHOOTING.find((x) => x.id === 'ts-power-cycle')!
    expect(stepsFor(cycle, 'all')).toHaveLength(cycle.steps.length)
    // One step is Rev 1 only (unplug the batteries), some are Sanctuary 3 only, one applies to every Sanctuary 2 revision (generator off).
    const gen3Only = cycle.steps.filter((x) => Array.isArray(x.revisions) && x.revisions.length === 1 && x.revisions[0] === 'gen3').length
    expect(gen3Only).toBeGreaterThan(0)
    expect(stepsFor(cycle, 'rev4')).toHaveLength(cycle.steps.length - 1 - gen3Only)
    expect(stepsFor(cycle, 'gen3')).toHaveLength(gen3Only)
    expect(stepsFor(cycle, 'rev1')).toHaveLength(2)
    expect(stepsFor(cycle, 'rev3').map((x) => x.revisions)).toEqual(['all'])
    // Mixed entry: Rev 4-only steps are hidden on Rev 3, steps for every revision stay.
    const app = TROUBLESHOOTING.find((x) => x.id === 'ts-app-offline')!
    const rev3 = stepsFor(app, 'rev3')
    expect(rev3.length).toBeGreaterThan(0)
    expect(rev3.length).toBeLessThan(app.steps.length)
    expect(rev3.every((x) => x.revisions === 'all')).toBe(true)
  })

  it('keeps steps that apply to every revision', () => {
    const e = TROUBLESHOOTING.find((x) => x.id === 'ts-red-light')!
    expect(stepsFor(e, 'rev2').length).toBeGreaterThan(0)
  })
})
