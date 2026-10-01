import type { Module } from '../types'
import { src } from '../helpers'

const mod: Module = {
  id: 'inverter-controls',
  number: 2,
  title: 'Inverter Controls and Indicators',
  summary: 'The switches, lights and shutdown behavior a customer will describe on a support call.',
  status: 'coming-soon',
  outline: [
    { text: 'PV Disconnect, AC/DC Power, and Complete System Shutdown', sources: [src('manual', 10)] },
    { text: 'What the LED lights mean (solid green, blinking green, red, off)', sources: [src('manual', 10)] },
    { text: 'Alarms vs faults, and when a power cycle is needed', sources: [src('manual', 10), src('san2_2', 32, 33, 34, 35)] },
    { text: 'Remote shutdown switch and rapid shutdown power', sources: [src('manual', 28, 29)] },
    { text: 'Revision differences in controls and lights', sources: [src('author')] },
  ],
  lessons: [],
  sim: {
    id: 'inverter-panel',
    kind: 'inverter-panel',
    title: 'Interactive inverter panel',
    intro: 'Flip the switches and watch the status. Then diagnose customer symptoms.',
  },
}

export default mod
