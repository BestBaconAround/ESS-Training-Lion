import type { Module } from '../types'
import { src } from '../helpers'

const mod: Module = {
  id: 'ac-wiring',
  number: 5,
  title: 'AC Wiring, CTs, Generator, AC Solar',
  summary: 'Grid and load wiring, CT placement, generator and AC solar connections, and parallel inverters.',
  status: 'coming-soon',
  outline: [
    { text: 'AC wiring for one inverter and for multiple inverters; transfer switch and breaker sizing', sources: [src('manual', 30, 31)] },
    { text: 'CT installation: which line, which direction, and which inverter gets them', sources: [src('manual', 34)] },
    { text: 'Generator wiring and the two-wire auto start dry contact', sources: [src('manual', 35, 36)] },
    { text: 'AC solar connection to the generator port', sources: [src('manual', 38)] },
    { text: 'Parallel inverter and communication wiring', sources: [src('manual', 39, 40, 41)] },
  ],
  lessons: [],
  sim: {
    id: 'wiring-board',
    kind: 'wiring-board',
    title: 'Wiring board',
    intro: 'Wire the grid, load, generator and CTs on a virtual board.',
  },
}

export default mod
