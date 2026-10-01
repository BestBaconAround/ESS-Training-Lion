import type { Module } from '../types'
import { src } from '../helpers'

const mod: Module = {
  id: 'continuity-phasing',
  number: 6,
  title: 'Continuity Testing and Phasing',
  summary: 'Why crossed phases destroy equipment and how to test for them before power-up.',
  status: 'coming-soon',
  outline: [
    { text: 'Why phasing matters: a crossed phase shorts L1 to L2', sources: [src('manual', 31, 32)] },
    { text: 'Three ways phases get crossed: wiring, panel bussing, the breaker itself', sources: [src('manual', 32)] },
    { text: 'Grid input continuity test', sources: [src('manual', 32)] },
    { text: 'Load output continuity test and short circuit check', sources: [src('manual', 33)] },
    { text: 'Generator input continuity test', sources: [src('manual', 37)] },
  ],
  lessons: [],
  sim: {
    id: 'continuity-bench',
    kind: 'continuity-bench',
    title: 'Continuity test bench',
    intro: 'Run the continuity tests and find the crossed phase.',
  },
}

export default mod
