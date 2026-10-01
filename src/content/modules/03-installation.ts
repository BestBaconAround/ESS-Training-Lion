import type { Module } from '../types'
import { src } from '../helpers'

const mod: Module = {
  id: 'installation-location',
  number: 3,
  title: 'Installation Location and Mounting',
  summary: 'Where the system can go, the clearances it needs, and how it mounts to the wall.',
  status: 'coming-soon',
  outline: [
    {
      text: 'Choosing a location: garage or utility/storage room (not a living space), climate controlled, clearances for airflow, no flammable vapors',
      sources: [src('manual', 15)],
    },
    {
      text: 'Installation precautions: sunlight, rain/snow exposure, humidity, wall slope, ambient temperature',
      sources: [src('manual', 17)],
    },
    {
      text: 'Mounting brackets: battery bracket, wall spacer (with or without a wire box), inverter bracket, safety clips',
      sources: [src('manual', 18, 19)],
    },
    {
      text: 'Spacing between batteries and between multiple inverters',
      sources: [src('manual', 18, 19)],
    },
    {
      text: 'Revision differences in temperature limits and fastener requirements',
      sources: [src('san2_3', 13, 39)],
    },
  ],
  lessons: [],
  sim: {
    id: 'wall-layout',
    kind: 'wall-layout',
    title: 'Wall layout',
    intro: 'Lay out inverters and batteries on a wall and check clearances.',
  },
}

export default mod
