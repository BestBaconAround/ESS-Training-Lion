import { describe, expect, it } from 'vitest'
import type { PanelState } from '../../content/sims/panelTypes'
import { computeStatus, defaultState } from './state'

const rev4 = (over: Partial<PanelState['switches']> = {}, world: Partial<PanelState['world']> = {}, condition: PanelState['condition'] = 'normal'): PanelState => ({
  ...defaultState('rev4'),
  switches: { ...defaultState('rev4').switches, ...over },
  world: { ...defaultState('rev4').world, ...world },
  condition,
})

describe('computeStatus: Rev 4', () => {
  it('normal operation', () => {
    const s = computeStatus(rev4())
    expect(s.loadsPowered.value).toBe(true)
    expect(s.pvAccepted.value).toBe(true)
    expect(s.commsOnline.value).toBe(true)
    expect(s.settingsFirmware.value).toBe(true)
    expect(s.lights).toEqual([
      { label: 'Normal light', color: 'green' },
      { label: 'Fault light', color: 'off' },
    ])
  })

  it('PV Disconnect off: no solar accepted, loads still on', () => {
    const s = computeStatus(rev4({ pv: false }))
    expect(s.pvAccepted.value).toBe(false)
    expect(s.loadsPowered.value).toBe(true)
  })

  it('AC/DC off: loads off, no PV, controller on, EMS-C comms and settings offline', () => {
    const s = computeStatus(rev4({ power: false }))
    expect(s.loadsPowered.value).toBe(false)
    expect(s.pvAccepted.value).toBe(false)
    expect(s.controllerOn.value).toBe(true)
    expect(s.commsOnline.value).toBe(false)
    expect(s.settingsFirmware.value).toBe(false)
  })

  it('shutdown off with an external source on: works as normal', () => {
    const s = computeStatus(rev4({ shutdown: false }, { grid: true }))
    expect(s.fullyOff.value).toBe(false)
    expect(s.loadsPowered.value).toBe(true)
    expect(s.commsOnline.value).toBe(true)
  })

  it('shutdown off with no external source: fully off, no light', () => {
    const s = computeStatus(rev4({ shutdown: false }, { grid: false, solar: false, other: false }))
    expect(s.fullyOff.value).toBe(true)
    expect(s.loadsPowered.value).toBe(false)
    expect(s.commsOnline.value).toBe(false)
    expect(s.lights).toEqual([
      { label: 'Normal light', color: 'off' },
      { label: 'Fault light', color: 'off' },
    ])
  })

  it('PV only counts as a source while the PV switch is on', () => {
    const sunOnly = { grid: false, solar: true, other: false }
    expect(computeStatus(rev4({ shutdown: false, pv: true }, sunOnly)).fullyOff.value).toBe(false)
    expect(computeStatus(rev4({ shutdown: false, pv: false }, sunOnly)).fullyOff.value).toBe(true)
  })

  it('the generator/AC solar/wind source keeps it running', () => {
    expect(computeStatus(rev4({ shutdown: false, pv: false }, { grid: false, solar: false, other: true })).fullyOff.value).toBe(false)
  })

  it('alarm blinks green and fault is red and shuts loads down', () => {
    expect(computeStatus(rev4({}, {}, 'alarm')).lights[0].color).toBe('green-blink')
    const f = computeStatus(rev4({}, {}, 'fault'))
    expect(f.lights[1].color).toBe('red')
    expect(f.loadsPowered.value).toBe(false)
    expect(f.pvAccepted.value).toBe(false)
  })
})

describe('computeStatus: Revs 1-3', () => {
  const r13 = (power: boolean, world: Partial<PanelState['world']> = {}, pv = true, condition: PanelState['condition'] = 'normal'): PanelState => ({
    ...defaultState('rev1-3'),
    switches: { pv, power, shutdown: true },
    world: { ...defaultState('rev1-3').world, ...world },
    condition,
  })

  it('has two lights: normal and fault', () => {
    expect(computeStatus(r13(true)).lights).toEqual([
      { label: 'Normal light', color: 'green' },
      { label: 'Fault light', color: 'off' },
    ])
    expect(computeStatus(r13(true, {}, true, 'alarm')).lights[0].color).toBe('green-blink')
    expect(computeStatus(r13(true, {}, true, 'fault')).lights[1].color).toBe('red')
  })

  it('power button off behaves like Rev 4 shutdown', () => {
    expect(computeStatus(r13(false, { grid: true })).fullyOff.value).toBe(false)
    expect(computeStatus(r13(false, { grid: false, solar: false, other: false })).fullyOff.value).toBe(true)
  })

  it('leaves comms unknown until the author supplies Revs 1-3 behavior', () => {
    expect(computeStatus(r13(true)).commsOnline.value).toBeNull()
  })
})
