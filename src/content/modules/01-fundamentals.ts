import type { Module } from '../types'
import { src } from '../helpers'

const mod: Module = {
  id: 'system-fundamentals',
  number: 1,
  title: 'System Fundamentals',
  summary: 'What the Sanctuary is, how the pieces fit together, and how a system is sized.',
  status: 'coming-soon',
  outline: [
    {
      text: 'What the Sanctuary is: inverter, solar charger, battery charger, generator support and an LFP battery, sold only as an inverter + battery system',
      sources: [src('manual', 8)],
    },
    {
      text: 'Basic system architecture: grid, solar, generator, and the essential loads panel',
      sources: [src('manual', 8)],
    },
    {
      text: 'Commonly used terms: AC-coupled solar, bypass, C rate, consumption, CT, essential/backup loads, MPPT, PV',
      sources: [src('manual', 7)],
    },
    {
      text: 'Sizing basics: loads above a 30A breaker need multiple inverters; 33.3A AC off-grid per inverter; minimum PV input per battery',
      sources: [src('manual', 8), src('san2_3', 8)],
    },
    {
      text: 'The four Gen 2 hardware revisions and what differs between them',
      sources: [src('author'), src('emsc', 13)],
    },
  ],
  lessons: [],
  sim: {
    id: 'sizing-calculator',
    kind: 'sizing-calculator',
    title: 'Sizing calculator',
    intro: 'Size a system for a customer from their loads.',
  },
}

// TODO(source): the sizing calculator needs formulas beyond the ones in the manual
// (30A breaker rule, 33.3A per inverter, minimum PV per battery). Ask the author before building it.
export default mod
