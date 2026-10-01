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
    expect(matches(e, 'power supply 51.5')).toBe(true)
    expect(matches(e, 'power supply zebra')).toBe(false)
  })

  it('matches the customer wording', () => {
    expect(filterEntries(TROUBLESHOOTING, 'all', 'zero volts').some((e) => e.id === 'ts-battery-wont-address')).toBe(true)
  })

  it('returns nothing when no entry matches', () => {
    expect(filterEntries(TROUBLESHOOTING, 'all', 'qqqqzzzz')).toEqual([])
  })

  it('shows only steps that apply to the chosen revision', () => {
    const e = TROUBLESHOOTING.find((x) => x.id === 'ts-app-offline')!
    expect(stepsFor(e, 'all')).toHaveLength(e.steps.length)
    expect(stepsFor(e, 'rev4')).toHaveLength(e.steps.length)
    expect(stepsFor(e, 'rev3')).toHaveLength(0)
  })

  it('keeps steps that apply to every revision', () => {
    const e = TROUBLESHOOTING.find((x) => x.id === 'ts-red-light')!
    expect(stepsFor(e, 'rev2').length).toBeGreaterThan(0)
  })
})
