import { PANEL_TEMPLATES } from '../../content/sims/panelScenarios'
import type {
  PanelFamily,
  PanelGoal,
  PanelState,
  PanelTemplate,
  PanelWorld,
} from '../../content/sims/panelTypes'
import { FAULT_CODES, FAULT_FOOTNOTE, type FaultCode } from '../../content/data/faults'
import type { SourceRef } from '../../content/types'
import { createRng, pick, shuffle, type Rng } from '../rng'
import { computeStatus, defaultState, type PanelStatus } from './state'

export interface RunOption {
  id: string
  text: string
  correct: boolean
  why: string
}

interface RunBase {
  id: string
  templateId: string
  family: PanelFamily
  customerSays: string
  prompt: string
  explanation: string
  sources: SourceRef[]
}

export interface SetScenario extends RunBase {
  type: 'set'
  start: PanelState
  goal: PanelGoal
}

export interface ChooseScenario extends RunBase {
  type: 'choose'
  options: RunOption[]
}

export type PanelScenario = SetScenario | ChooseScenario

const FAMILIES: PanelFamily[] = ['rev4', 'rev1-3']

function buildSet(rng: Rng, t: Extract<PanelTemplate, { kind: 'set' }>, n: number): SetScenario {
  const base = defaultState(t.family)
  const world: PanelWorld = pick(rng, t.worlds)
  return {
    type: 'set',
    id: `${t.id}#${n}`,
    templateId: t.id,
    family: t.family,
    customerSays: pick(rng, t.symptoms),
    prompt: t.prompt,
    explanation: t.explanation,
    sources: t.sources,
    start: {
      family: t.family,
      switches: { ...base.switches, ...t.start.switches },
      world: { ...world },
      condition: t.start.condition ?? 'normal',
    },
    goal: t.goal,
  }
}

function buildChoose(rng: Rng, t: Extract<PanelTemplate, { kind: 'choose' }>, n: number): ChooseScenario {
  const families = FAMILIES.filter((f) => t.symptoms[f]?.length)
  const family = pick(rng, families)
  return {
    type: 'choose',
    id: `${t.id}#${n}`,
    templateId: t.id,
    family,
    customerSays: pick(rng, t.symptoms[family]!),
    prompt: t.prompt,
    explanation: t.explanation,
    sources: t.sources,
    options: shuffle(rng, t.options).map((o, i) => ({ id: `o${i}`, ...o })),
  }
}

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Fault scenarios come from the fault table. Two question styles: "what is this code" and "what do you do first".
 * Distractors never repeat the correct text and, for "first step", are never one of the fault's own solutions,
 * so exactly one option is right.
 */
function buildFault(rng: Rng, t: Extract<PanelTemplate, { kind: 'fault' }>, n: number): ChooseScenario {
  const fault: FaultCode = pick(rng, FAULT_CODES)
  const asName = rng() < 0.5
  const correctText = asName ? fault.name : fault.solutions[0]
  const pool = FAULT_CODES.filter((f) => f.code !== fault.code).flatMap((f) => (asName ? [f.name] : [f.solutions[0]]))
  const taken = new Set([correctText.toLowerCase()])
  const distractors: string[] = []
  for (const text of shuffle(rng, pool)) {
    const lower = text.toLowerCase()
    if (taken.has(lower)) continue
    if (!asName && fault.solutions.some((s) => sameText(s, text))) continue
    taken.add(lower)
    distractors.push(text)
    if (distractors.length === 3) break
  }
  const options: RunOption[] = shuffle(rng, [
    { text: correctText, correct: true, why: `${fault.code} is ${fault.name}. ${fault.description}` },
    ...distractors.map((text) => ({
      text,
      correct: false,
      why: asName ? `That is a different code. ${fault.code} is ${fault.name}.` : `That is not the first step for ${fault.code} (${fault.name}).`,
    })),
  ]).map((o, i) => ({ id: `o${i}`, ...o }))
  const family = pick(rng, FAMILIES)
  return {
    type: 'choose',
    id: `${t.id}#${n}`,
    templateId: t.id,
    family,
    customerSays: pick(rng, t.symptoms).replace('{code}', fault.code),
    prompt: asName ? `What is ${fault.code}?` : `What do you do first for ${fault.code}?`,
    explanation: `${fault.code}: ${fault.name}. ${fault.description} Solutions: ${fault.solutions
      .map((s, i) => `${i + 1}) ${s}`)
      .join(' ')} ${FAULT_FOOTNOTE}`,
    sources: fault.sources.concat(t.sources.filter((s) => s.source === 'author')),
    options,
  }
}

export function buildScenario(rng: Rng, t: PanelTemplate, n = 0): PanelScenario {
  if (t.kind === 'set') return buildSet(rng, t, n)
  if (t.kind === 'choose') return buildChoose(rng, t, n)
  return buildFault(rng, t, n)
}

/** A run is `count` scenarios from distinct templates, in random order. */
export function generateRun(seed: number, count = 6, templates: PanelTemplate[] = PANEL_TEMPLATES): PanelScenario[] {
  const rng = createRng(seed)
  return shuffle(rng, templates)
    .slice(0, count)
    .map((t, i) => buildScenario(rng, t, i))
}

// ---- grading -------------------------------------------------------------

export interface GoalLine {
  label: string
  needed: boolean
  actual: boolean | null
  met: boolean
  why: string
}

export interface SetGrade {
  correct: boolean
  status: PanelStatus
  lines: GoalLine[]
}

const GOAL_LABELS: Record<keyof PanelGoal, string> = {
  fullyOff: 'System fully off',
  loadsPowered: 'Loads powered',
  pvAccepted: 'PV accepted',
  commsOnline: 'Comms online',
}

export function gradeSet(s: SetScenario, finalState: PanelState): SetGrade {
  const status = computeStatus(finalState)
  const lines: GoalLine[] = (Object.keys(s.goal) as (keyof PanelGoal)[]).map((key) => {
    const needed = s.goal[key]!
    const row = status[key]
    return { label: GOAL_LABELS[key], needed, actual: row.value, met: row.value === needed, why: row.why }
  })
  return { correct: lines.every((l) => l.met), status, lines }
}

export interface ChooseGrade {
  correct: boolean
  chosen: RunOption
  right: RunOption
}

export function gradeChoice(s: ChooseScenario, optionId: string): ChooseGrade | null {
  const chosen = s.options.find((o) => o.id === optionId)
  const right = s.options.find((o) => o.correct)
  if (!chosen || !right) return null
  return { correct: chosen.correct, chosen, right }
}

export const runScore = (results: boolean[]): number => (results.length ? Math.round((results.filter(Boolean).length / results.length) * 100) : 0)
