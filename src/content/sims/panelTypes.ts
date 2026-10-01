import type { SourceRef } from '../types'

/** Rev 4 has three controls (PV, AC/DC, Complete System Shutdown). Revs 1-3 have a power button and a DC (PV) switch. */
export type PanelFamily = 'rev4' | 'rev1-3'

export interface PanelWorld {
  grid: boolean
  /** Sunlight on the panels. Only a source while the PV switch is on. */
  solar: boolean
  /** Generator, AC solar, or wind. */
  other: boolean
}

export interface PanelSwitches {
  /** PV Disconnect (Rev 4) / DC switch (Revs 1-3). true = on. */
  pv: boolean
  /** AC/DC button (Rev 4) / power button (Revs 1-3). true = pushed in. */
  power: boolean
  /** Complete System Shutdown button (Rev 4 only; ignored on Revs 1-3). true = pushed in. */
  shutdown: boolean
}

export type PanelCondition = 'normal' | 'alarm' | 'fault'

export interface PanelState {
  family: PanelFamily
  switches: PanelSwitches
  world: PanelWorld
  condition: PanelCondition
}

/** What a "set the switches" scenario requires of the final status. Omitted keys are not checked. */
export interface PanelGoal {
  fullyOff?: boolean
  loadsPowered?: boolean
  pvAccepted?: boolean
  commsOnline?: boolean
}

export interface ChoiceOption {
  text: string
  correct: boolean
  /** Shown after answering: why this option is right or wrong. */
  why: string
}

interface TemplateBase {
  id: string
  explanation: string
  sources: SourceRef[]
}

export interface SetTemplate extends TemplateBase {
  kind: 'set'
  family: PanelFamily
  /** Customer phrasings. The generator picks one at random. */
  symptoms: string[]
  prompt: string
  start: { switches: Partial<PanelSwitches>; condition?: PanelCondition }
  /** One is picked at random. They must not change which final states are correct. */
  worlds: PanelWorld[]
  goal: PanelGoal
}

export interface ChooseTemplate extends TemplateBase {
  kind: 'choose'
  /** Customer phrasings per family; the keys decide which families this scenario can appear for. */
  symptoms: Partial<Record<PanelFamily, string[]>>
  prompt: string
  options: ChoiceOption[]
}

/** Generated from the fault-code table instead of fixed options. */
export interface FaultTemplate extends TemplateBase {
  kind: 'fault'
  /** Phrasings use {code}. */
  symptoms: string[]
}

export type PanelTemplate = SetTemplate | ChooseTemplate | FaultTemplate
