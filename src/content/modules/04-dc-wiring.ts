import type { Module } from '../types'
import { src } from '../helpers'

const mod: Module = {
  id: 'dc-wiring-batteries',
  number: 4,
  title: 'DC Wiring and Batteries',
  summary: 'Checking batteries, wiring them to the inverter, solar (PV) wiring, and the ground leakage test.',
  status: 'coming-soon',
  outline: [
    { text: 'Battery voltage check before wiring', sources: [src('manual', 20)] },
    { text: 'Paralleling procedure and wiring order, BMS communication cable', sources: [src('manual', 20, 21, 22, 23, 24, 25)] },
    { text: 'PV input: MPPTs, voltage and current limits, Dual MPPT mode, optimizers', sources: [src('manual', 26, 27)] },
    { text: 'PV must never be grounded, and the PV-to-ground leakage test', sources: [src('manual', 27)] },
    { text: 'Rapid shutdown power supply', sources: [src('manual', 28)] },
    { text: 'Battery specifications and a dead battery that will not address', sources: [src('manual', 44), src('author')] },
  ],
  lessons: [],
  sim: {
    id: 'multimeter-bench',
    kind: 'multimeter-bench',
    title: 'Multimeter bench',
    intro: 'Probe batteries, decide what can be wired, and run the PV leakage test.',
  },
}

export default mod
