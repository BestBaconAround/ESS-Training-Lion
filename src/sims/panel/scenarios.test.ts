import { describe, expect, it } from 'vitest'
import { PANEL_TEMPLATES } from '../../content/sims/panelScenarios'
import { FAULT_CODES } from '../../content/data/faults'
import type { PanelState } from '../../content/sims/panelTypes'
import { generateRun, gradeChoice, gradeSet, runScore, type ChooseScenario, type SetScenario } from './scenarios'
import { computeStatus } from './state'

const seeds = Array.from({ length: 200 }, (_, i) => i + 1)
const allScenarios = seeds.flatMap((seed) => generateRun(seed, PANEL_TEMPLATES.length))

describe('panel scenarios', () => {
  it('is deterministic per seed and varies across seeds', () => {
    expect(generateRun(5)).toEqual(generateRun(5))
    expect(JSON.stringify(generateRun(5))).not.toBe(JSON.stringify(generateRun(6)))
  })

  it('draws distinct templates in a run', () => {
    for (const seed of seeds) {
      const ids = generateRun(seed, 6).map((s) => s.templateId)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('every choose scenario has exactly one correct option and no duplicate option text', () => {
    for (const s of allScenarios.filter((x): x is ChooseScenario => x.type === 'choose')) {
      expect(s.options.filter((o) => o.correct)).toHaveLength(1)
      const texts = s.options.map((o) => o.text.toLowerCase())
      expect(new Set(texts).size).toBe(texts.length)
      expect(s.options.length).toBeGreaterThanOrEqual(3)
      for (const o of s.options) expect(o.why.trim()).not.toBe('')
    }
  })

  it('fault "first step" distractors are never one of that fault\'s own solutions', () => {
    for (const s of allScenarios.filter((x): x is ChooseScenario => x.type === 'choose' && x.templateId === 'fault-code')) {
      const code = FAULT_CODES.find((f) => new RegExp(`\\b${f.code}\\b`).test(s.customerSays))!
      expect(code).toBeDefined()
      if (s.prompt.startsWith('What do you do first')) {
        for (const o of s.options.filter((x) => !x.correct)) {
          expect(code.solutions.map((x) => x.toLowerCase())).not.toContain(o.text.toLowerCase())
        }
      }
    }
  })

  it('every set scenario starts in a state that does NOT already meet its goal', () => {
    for (const s of allScenarios.filter((x): x is SetScenario => x.type === 'set')) {
      expect(gradeSet(s, s.start).correct).toBe(false)
    }
  })

  it('the AC/DC scenario is solved by pushing AC/DC back in', () => {
    const s = allScenarios.find((x): x is SetScenario => x.type === 'set' && x.templateId === 'acdc-off-rev4')!
    const fixed: PanelState = { ...s.start, switches: { ...s.start.switches, power: true } }
    expect(gradeSet(s, fixed).correct).toBe(true)
  })

  it('"fully off" needs outside power off too, not just the shutdown button', () => {
    for (const s of allScenarios.filter((x): x is SetScenario => x.type === 'set' && x.templateId.startsWith('fully-off'))) {
      const shutdownOnly: PanelState = {
        ...s.start,
        switches: { ...s.start.switches, shutdown: false, power: s.family === 'rev4' ? s.start.switches.power : false },
      }
      expect(gradeSet(s, shutdownOnly).correct).toBe(false)
      const solved: PanelState = {
        ...shutdownOnly,
        switches: { ...shutdownOnly.switches, pv: false },
        world: { grid: false, solar: s.start.world.solar, other: false },
      }
      expect(computeStatus(solved).fullyOff.value).toBe(true)
      expect(gradeSet(s, solved).correct).toBe(true)
    }
  })

  it('grades a choice and rejects unknown ids', () => {
    const s = allScenarios.find((x): x is ChooseScenario => x.type === 'choose')!
    const right = s.options.find((o) => o.correct)!
    const wrong = s.options.find((o) => !o.correct)!
    expect(gradeChoice(s, right.id)?.correct).toBe(true)
    expect(gradeChoice(s, wrong.id)?.correct).toBe(false)
    expect(gradeChoice(s, 'nope')).toBeNull()
  })

  it('scores a run as a percentage', () => {
    expect(runScore([true, false, true, true])).toBe(75)
    expect(runScore([])).toBe(0)
  })
})
