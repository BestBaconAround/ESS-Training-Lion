import { describe, expect, it } from 'vitest'
import { HOMEOWNER_MESSAGES } from './homeowner'

// Words an older homeowner should never meet. Keep this list in step with what support actually sees in the app.
const JARGON = ['ssid', 'ems-c', 'wcm', 'mppt', 'soc', 'firmware', 'inverter', 'dod', 'breaker', 'rssi', 'commission', 'parallel', 'bms', 'cts', 'amp', 'voltage']

describe('homeowner messages', () => {
  it('have unique ids, sources and revisions', () => {
    const ids = new Set<string>()
    for (const m of HOMEOWNER_MESSAGES) {
      expect(ids.has(m.id), m.id).toBe(false)
      ids.add(m.id)
      expect(m.sources.length, m.id).toBeGreaterThan(0)
      expect(m.revisions, m.id).toBeTruthy()
    }
  })

  it('use short sentences and everyday words', () => {
    const errors: string[] = []
    for (const m of HOMEOWNER_MESSAGES) {
      const words = m.text.toLowerCase()
      for (const j of JARGON) if (new RegExp(`\\b${j}\\b`).test(words)) errors.push(`${m.id}: jargon "${j}"`)
      for (const sentence of m.text.split(/[.!?\n]+/)) {
        const n = sentence.trim().split(/\s+/).filter(Boolean).length
        if (n > 22) errors.push(`${m.id}: sentence over 22 words: "${sentence.trim().slice(0, 50)}..."`)
      }
      if (m.text.split(/\s+/).length > 120) errors.push(`${m.id}: over 120 words`)
    }
    expect(errors).toEqual([])
  })
})
