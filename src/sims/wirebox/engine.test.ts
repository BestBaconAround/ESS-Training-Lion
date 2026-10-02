import { describe, expect, it } from 'vitest'
import { PARTS, SCENARIO_IDS, SOCKETS, socketById } from '../../content/sims/wireBox'
import { correctState, emptyState, fits, grade, gradePart, makeFixScenario, occupant, place } from './engine'

describe('wire box data', () => {
  it('every part has correct sockets it fits, and sources', () => {
    for (const p of PARTS) {
      expect(p.sources.length, p.id).toBeGreaterThan(0)
      expect(p.correct.length, p.id).toBeGreaterThan(0)
      for (const c of p.correct) expect(fits(p, socketById(c)), `${p.id}@${c}`).toBe(true)
    }
  })
  it('socket ids are unique', () => {
    expect(new Set(SOCKETS.map((s) => s.id)).size).toBe(SOCKETS.length)
  })
  it('a correct build is done', () => {
    const g = grade(correctState())
    expect(g.done).toBe(true)
  })
  it('an empty box is not done and lists the required parts', () => {
    const g = grade(emptyState())
    expect(g.done).toBe(false)
    expect(g.missing.length).toBe(PARTS.filter((p) => p.required).length)
  })
})

describe('place', () => {
  it('refuses a plug that does not fit', () => {
    const r = place(emptyState(), 'p_ct_cable', 'pv1p')
    expect(r.rejected).toBeTruthy()
    expect(r.state.p_ct_cable).toBeNull()
  })
  it('swaps when a placed part is dropped on an occupied socket', () => {
    let s = place(emptyState(), 'p_grid_l1', 'grid_l1').state
    s = place(s, 'p_grid_l2', 'grid_l2').state
    const r = place(s, 'p_grid_l1', 'grid_l2')
    expect(r.state.p_grid_l1).toBe('grid_l2')
    expect(r.state.p_grid_l2).toBe('grid_l1')
    expect(r.displaced).toBe('p_grid_l2')
  })
  it('bumps the occupant to the tray when the dragged part came from the tray', () => {
    let s = place(emptyState(), 'p_grid_l2', 'grid_l1').state
    const r = place(s, 'p_grid_l1', 'grid_l1')
    expect(r.state.p_grid_l2).toBeNull()
    expect(occupant(r.state, 'grid_l1')).toBe('p_grid_l1')
  })
})

describe('grading specifics from the Technical Service Manual', () => {
  it('CT in the meter port explains the L2-only backwards reading', () => {
    const s = place(emptyState(), 'p_ct_cable', 'meter').state
    expect(gradePart(s, 'p_ct_cable').note).toMatch(/L2 CT/)
  })
  it('reversed PV polarity mentions -1 V', () => {
    const s = place(emptyState(), 'p_pv1p', 'pv1n').state
    expect(gradePart(s, 'p_pv1p').note).toMatch(/-1 V/)
  })
  it('grid L1 and L2 swapped gives A2_20, load gives A2_19', () => {
    const g = place(emptyState(), 'p_grid_l1', 'grid_l2').state
    expect(gradePart(g, 'p_grid_l1').note).toMatch(/A2_20/)
    const l = place(emptyState(), 'p_load_l1', 'load_l2').state
    expect(gradePart(l, 'p_load_l1').note).toMatch(/A2_19/)
  })
  it('a PV wire without its pair is incomplete', () => {
    const s = correctState()
    s.p_pv1n = null
    expect(grade(s).incompletePv).toEqual(['p_pv1n'])
  })
})

describe('fix scenarios', () => {
  it('are reproducible for a seed', () => {
    expect(makeFixScenario(42)).toEqual(makeFixScenario(42))
  })
  it('every scenario breaks the box, and putting the parts right fixes it', () => {
    for (const id of SCENARIO_IDS) {
      const sc = makeFixScenario(1, id)
      expect(grade(sc.state).done, id).toBe(false)
      expect(sc.symptoms.length).toBe(1)
      // The fix is the correct build.
      expect(grade(correctState()).done, id).toBe(true)
    }
  })
  it('combined scenarios never touch the same part', () => {
    for (let seed = 0; seed < 200; seed++) {
      const sc = makeFixScenario(seed)
      expect(sc.ids.length).toBeGreaterThan(0)
      expect(grade(sc.state).done).toBe(false)
    }
  })
  it('the pv string is 1 or 2 and the symptom names it', () => {
    const sc = makeFixScenario(7, 'pv-reversed')
    expect([1, 2]).toContain(sc.pvString)
    expect(sc.symptoms[0]).toContain(`String ${sc.pvString}`)
  })
})
