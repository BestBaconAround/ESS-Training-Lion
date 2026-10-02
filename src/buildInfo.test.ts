import { describe, expect, it } from 'vitest'
import { formatBuildTime } from './buildInfo'

describe('formatBuildTime', () => {
  it('formats a date and time in the given time zone', () => {
    expect(formatBuildTime('2026-10-02T01:15:00.000Z', 'en-US', 'UTC')).toBe('Oct 2, 2026, 1:15 AM UTC')
  })
  it('returns an empty string for a missing or invalid date', () => {
    expect(formatBuildTime('')).toBe('')
    expect(formatBuildTime('not a date')).toBe('')
  })
})
