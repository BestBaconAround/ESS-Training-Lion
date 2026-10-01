import type { Module } from '../types'
import { src } from '../helpers'

const mod: Module = {
  id: 'first-time-power-up',
  number: 7,
  title: 'First-Time Power-Up',
  summary: 'Commissioning and the power-up sequence, in the right order, with the right checks.',
  status: 'coming-soon',
  outline: [
    { text: 'The first-time power-up sequence and the PV insulation check', sources: [src('manual', 42)] },
    { text: 'Commissioning in the Lion Technician app (pre-commissioning walkthrough)', sources: [src('video'), src('emsc', 16)] },
    { text: 'Addressing batteries and moving the BMS cable', sources: [src('video'), src('emsc', 8)] },
    { text: 'EMS-C and WCM: wiring and LED indicators by revision', sources: [src('emsc', 6, 8, 9, 10)] },
    { text: 'Power cycling an inverter', sources: [src('author')] },
  ],
  lessons: [],
  sim: {
    id: 'power-up-sequence',
    kind: 'power-up-sequence',
    title: 'Power-up sequence',
    intro: 'Put the power-up steps in the right order.',
  },
}

// TODO(author): the video requires both power buttons on during commissioning, but manual p.42
// step 3 says leave AC/DC off. Confirm how this changes the 9-step sequence before building the sim.
export default mod
