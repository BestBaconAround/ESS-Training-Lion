import type { Module } from './types'
import m1 from './modules/01-fundamentals'
import m2 from './modules/02-controls'
import m3 from './modules/03-installation'
import m4 from './modules/04-dc-wiring'
import m5 from './modules/05-ac-wiring'
import m6 from './modules/06-continuity'
import m7 from './modules/07-power-up'

/** Register new modules here. Order is by `number`. */
export const modules: Module[] = [m1, m2, m3, m4, m5, m6, m7].sort((a, b) => a.number - b.number)

export const getModule = (id: string): Module | undefined => modules.find((m) => m.id === id)
