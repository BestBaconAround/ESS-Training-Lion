import { describe, expect, it } from 'vitest'
import { COMPONENTS, EXPLORE_TASKS, LAB_SCENARIO_IDS, LAB_SCENARIO_TEXT } from '../../content/sims/inverter3d'
import { SCENARIO_IDS, SOCKETS } from '../../content/sims/wireBox'
import {
  FASTENED_IDS,
  correctLab,
  emptyLab,
  faultFixed,
  gradeLab,
  makeLabScenario,
  measure,
  measureRsd,
  placeSpare,
  placeWire,
  progressOf,
  tasksFor,
  testCable,
  turnBolt,
} from './engine'

const ALL = [...SCENARIO_IDS, ...LAB_SCENARIO_IDS]

describe('lab data', () => {
  it('lab scenarios and components cite sources', () => {
    for (const id of LAB_SCENARIO_IDS) expect(LAB_SCENARIO_TEXT[id].sources.length, id).toBeGreaterThan(0)
    for (const c of COMPONENTS) for (const f of c.facts) expect(f.sources.length, c.id).toBeGreaterThan(0)
  })
  it('every explore task points at a real component', () => {
    const ids = new Set(COMPONENTS.map((c) => c.id))
    for (const t of EXPLORE_TASKS) for (const c of t.components) expect(ids.has(c), c).toBe(true)
  })
  it('bolts are on terminals and busbars only', () => {
    expect(FASTENED_IDS.length).toBe(SOCKETS.filter((s) => s.kind === 'terminal' || s.kind === 'busbar').length)
    expect(FASTENED_IDS).toContain('bat_p')
    expect(FASTENED_IDS).not.toContain('bms')
  })
})

describe('correct lab', () => {
  it('is done', () => expect(gradeLab(correctLab()).done).toBe(true))
})

describe('every fault', () => {
  for (const id of ALL) {
    it(`${id}: is a problem, and is solved by its fix`, () => {
      const sc = makeLabScenario(11, id)
      expect(sc.ids).toEqual([id])
      expect(gradeLab(sc.lab).done, 'starts broken').toBe(false)
      expect(faultFixed(id, sc.pvString, sc.lab), 'not fixed at the start').toBe(false)
    })
  }
  it('is reproducible from the seed', () => {
    expect(makeLabScenario(5)).toEqual(makeLabScenario(5))
  })
  it('never combines overlapping faults', () => {
    for (let seed = 1; seed < 200; seed++) {
      const sc = makeLabScenario(seed)
      expect(new Set(sc.ids).size).toBe(sc.ids.length)
      const g = gradeLab(sc.lab)
      expect(g.done).toBe(false)
    }
  })
})

describe('bolts and wires', () => {
  it('refuses to pull a wire off a tight terminal, and lets you after loosening', () => {
    const lab = correctLab()
    const r = placeWire(lab, 'p_grid_l1', null)
    expect(r.rejected).toMatch(/tight/)
    const loose = turnBolt(lab, 'grid_l1', 'loosen')
    expect(loose.fasteners.grid_l1).toBe('loose')
    const off = placeWire(loose, 'p_grid_l1', null)
    expect(off.rejected).toBeUndefined()
    expect(off.lab.wires.p_grid_l1).toBeNull()
  })
  it('refuses to land a wire on a tight terminal', () => {
    let lab = correctLab()
    lab = turnBolt(lab, 'grid_l1', 'loosen')
    lab = placeWire(lab, 'p_grid_l1', null).lab
    lab = turnBolt(lab, 'grid_l1', 'tighten')
    expect(placeWire(lab, 'p_grid_l1', 'grid_l1').rejected).toMatch(/tight/)
  })
  it('a wire left on a loose bolt is an issue until tightened (PV cites the arc fault alarm)', () => {
    let lab = correctLab()
    lab = turnBolt(lab, 'pv1p', 'loosen')
    const g = gradeLab(lab)
    expect(g.done).toBe(false)
    expect(g.issues[0].text).toMatch(/A2_15/)
    lab = turnBolt(lab, 'pv1p', 'tighten')
    expect(gradeLab(lab).done).toBe(true)
  })
  it('a removed bolt takes two tighten turns', () => {
    let lab = correctLab()
    lab = turnBolt(turnBolt(lab, 'bat_n', 'loosen'), 'bat_n', 'loosen')
    expect(lab.fasteners.bat_n).toBe('removed')
    expect(gradeLab(lab).issues[0].text).toMatch(/missing its bolt/)
    lab = turnBolt(lab, 'bat_n', 'tighten')
    expect(lab.fasteners.bat_n).toBe('loose')
    lab = turnBolt(lab, 'bat_n', 'tighten')
    expect(lab.fasteners.bat_n).toBe('tight')
  })
  it('plug sockets have no bolt', () => {
    const lab = correctLab()
    expect(turnBolt(lab, 'bms', 'loosen')).toBe(lab)
  })
})

describe('bad BMS cable', () => {
  it('is fixed by putting the spare on BMS COMM', () => {
    const sc = makeLabScenario(3, 'bad-bms-cable')
    expect(testCable(sc.lab, 'p_bms_cable').pass).toBe(false)
    expect(testCable(sc.lab, 'p_emsc_cable').pass).toBe(true)
    const r = placeSpare(sc.lab, 'bms')
    expect(r.displaced).toBe('p_bms_cable')
    expect(gradeLab(r.lab).done).toBe(true)
    expect(faultFixed('bad-bms-cable', sc.pvString, r.lab)).toBe(true)
  })
  it('the spare only fits an RJ45 port', () => {
    expect(placeSpare(correctLab(), 'pv1p').rejected).toBeTruthy()
  })
  it('swapping the bad cable alone is not enough', () => {
    const sc = makeLabScenario(3, 'bad-bms-cable')
    const off = placeWire(sc.lab, 'p_bms_cable', null).lab
    expect(gradeLab(off).done).toBe(false)
  })
})

describe('meter', () => {
  it('reads the battery within the allowed range, and negative when reversed', () => {
    const ok = measure(correctLab(), 'volts', 'bat_p', 'bat_n')
    expect(ok.headline).toBe('52.8 V')
    const rev = makeLabScenario(1, 'battery-reversed')
    expect(measure(rev.lab, 'volts', 'bat_p', 'bat_n').headline).toMatch(/^-/)
  })
  it('PV reads about -1 V when reversed', () => {
    const sc = makeLabScenario(2, 'pv-reversed')
    expect(measure(sc.lab, 'volts', `pv${sc.pvString}p`, `pv${sc.pvString}n`).headline).toBe('about -1 V')
    expect(measure(correctLab(), 'volts', 'pv1p', 'pv1n').headline).toBe('Positive voltage')
  })
  it('remote shutdown reads 5 V when the loop is out', () => {
    expect(measureRsd(makeLabScenario(1, 'rsd-open').lab, 'volts').headline).toBe('5 V')
    expect(measureRsd(correctLab(), 'continuity').headline).toMatch(/Continuity/)
  })
  it('grid reads 120 and 240 and does not show swapped phases', () => {
    expect(measure(correctLab(), 'volts', 'grid_l1', 'grid_n').headline).toBe('120 V')
    expect(measure(correctLab(), 'volts', 'grid_l1', 'grid_l2').headline).toBe('240 V')
    const sw = makeLabScenario(1, 'grid-swap').lab
    expect(measure(sw, 'volts', 'grid_l1', 'grid_l2').headline).toBe('240 V')
  })
  it('a loose bolt makes the reading unreliable', () => {
    const lab = turnBolt(correctLab(), 'bat_p', 'loosen')
    expect(measure(lab, 'volts', 'bat_p', 'bat_n').headline).toMatch(/Not a reliable/)
  })
  it('says so when a reading is not described', () => {
    const r = measure(correctLab(), 'volts', 'bms', 'ct')
    expect(r.described).toBe(false)
  })
})

describe('tasks', () => {
  it('start at the exploration tasks, and the final task needs a correct box', () => {
    const sc = makeLabScenario(9)
    const t0 = tasksFor(sc, sc.lab, new Set())
    expect(progressOf(t0)).toBe(0)
    const t1 = tasksFor(sc, correctLab(), new Set(['control']))
    expect(t1.find((t) => t.id === 'x-board')?.done).toBe(true)
    expect(t1.find((t) => t.id === 'final')?.done).toBe(true)
  })
  it('the AC task needs grid, generator and load', () => {
    const sc = makeLabScenario(9)
    const t = (s: string[]) => tasksFor(sc, sc.lab, new Set(s)).find((x) => x.id === 'x-ac')!.done
    expect(t(['ac-grid'])).toBe(false)
    expect(t(['ac-grid', 'ac-gen', 'ac-load'])).toBe(true)
  })
})

describe('creative mode', () => {
  it('an empty box has every cable on the bench, and can be built to a correct install', () => {
    let lab = emptyLab()
    expect(Object.values(lab.wires).every((w) => w === null)).toBe(true)
    expect(gradeLab(lab).done).toBe(false)
    const correct = correctLab()
    for (const [part, socket] of Object.entries(correct.wires)) lab = placeWire(lab, part, socket).lab
    for (const id of FASTENED_IDS) lab = turnBolt(lab, id, 'tighten')
    expect(gradeLab(lab).done).toBe(true)
  })
  it('the grid breaker setting changes the meter', () => {
    expect(measure({ ...correctLab(), gridOn: false }, 'volts', 'grid_l1', 'grid_n').headline).toBe('0 V')
  })
})
