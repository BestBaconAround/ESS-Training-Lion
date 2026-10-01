import type { ComponentType } from 'react'
import type { Module, SimKind } from '../content/types'
import BenchSim from './bench/BenchSim'
import PanelSim from './panel/PanelSim'

export interface SimProps {
  module: Module
}

/**
 * Maps a sim kind to its UI. Register a new simulator here; modules reference it by `sim.kind`.
 * Kinds with no entry show a "not built yet" message.
 */
export const simRegistry: Partial<Record<SimKind, ComponentType<SimProps>>> = {
  'inverter-panel': PanelSim,
  'multimeter-bench': BenchSim,
}
