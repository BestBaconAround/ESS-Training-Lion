import type { PanelState } from '../../content/sims/panelTypes'

export type LightColor = 'off' | 'green' | 'green-blink' | 'red' | 'unknown'

export interface PanelLight {
  label: string
  color: LightColor
}

export interface StatusRow<T> {
  value: T
  /** One-line reason, shown so wrong actions explain themselves. */
  why: string
}

export interface PanelStatus {
  externalSource: boolean
  fullyOff: StatusRow<boolean>
  controllerOn: StatusRow<boolean>
  loadsPowered: StatusRow<boolean>
  pvAccepted: StatusRow<boolean>
  /** null = not known (TODO for Revs 1-3 WCM). */
  commsOnline: StatusRow<boolean | null>
  settingsFirmware: StatusRow<boolean | null>
  lights: PanelLight[]
}

/** Grid, generator/AC solar/wind, or PV that is connected (PV switch on) and has sun. */
export const hasExternalSource = (s: PanelState): boolean =>
  s.world.grid || s.world.other || (s.world.solar && s.switches.pv)

/**
 * Derives what the customer would see from the switch and power state.
 * Rules (manual p.10, Technical Service Manual pp.13, 35; the Technical Service Manual overrules the author):
 * - Rev 4 Complete System Shutdown off turns off all components, whatever outside power is connected: the
 *   control board and battery feed go through that button, so the LED is off and the inverter cannot be reached.
 * - Rev 4 AC/DC off: loads off, no PV used (manual p.10), the controller stays on and the normal light flashes
 *   (standby). The EMS-C is powered from the 12V supply that turns off with AC power, so comms and
 *   settings/firmware go offline (EMS-C manual p.8, Technical Service Manual p.39).
 * - Revs 1-3 power button off: standby with the normal light flashing (Technical Service Manual p.13). Whether it
 *   turns everything off, and comms with it off, are not confirmed (TODO).
 * - A fault shuts the inverter down to protect itself (manual p.10).
 */
export function computeStatus(s: PanelState): PanelStatus {
  const rev4 = s.family === 'rev4'
  const external = hasExternalSource(s)
  const fullyOff = rev4 && !s.switches.shutdown
  const fault = s.condition === 'fault'
  // The AC power button: AC/DC on Rev 4, the single power button on Revs 1-3.
  const acdcOn = s.switches.power

  const fullyOffRow = {
    value: fullyOff,
    why: fullyOff
      ? 'Complete System Shutdown is off. It turns off all components of the inverter, so the system is fully off whatever outside power is connected.'
      : rev4
        ? 'The system is not shut down.'
        : 'The power button puts the inverter in standby (Technical Service Manual p.13). TODO(author): confirm whether it turns everything off on Revs 1-3.',
  }

  if (fullyOff) {
    const off = (why: string) => ({ value: false, why })
    return {
      externalSource: external,
      fullyOff: fullyOffRow,
      controllerOn: off('Everything is off.'),
      loadsPowered: off('The system is fully off.'),
      pvAccepted: off('The system is fully off.'),
      commsOnline: off('The system is fully off.'),
      settingsFirmware: off('The system is fully off.'),
      lights: [
        { label: 'Normal light', color: 'off' },
        { label: 'Fault light', color: 'off' },
      ],
    }
  }

  const loads = acdcOn && !fault
  const loadsWhy = fault
    ? 'The inverter is in a fault and shuts down to protect itself.'
    : acdcOn
      ? 'The system is on and the loads are powered.'
      : 'AC/DC is off, so the inverter loads are powered off.'
  const pv = loads && s.switches.pv
  const pvWhy = !s.switches.pv
    ? `The ${rev4 ? 'PV Disconnect' : 'DC switch'} is off, so the inverter does not accept solar power.`
    : fault
      ? 'The inverter is in a fault, so no PV power is used.'
      : acdcOn
        ? 'The PV switch is on and the system is running, so solar power is accepted.'
        : `${rev4 ? 'AC/DC' : 'The power button'} is off, so no PV power is used.`

  let comms: StatusRow<boolean | null>
  let settings: StatusRow<boolean | null>
  if (rev4) {
    const up = s.switches.power
    comms = {
      value: up,
      why: up
        ? 'The EMS-C has its 12V supply, so comms are online.'
        : 'AC/DC is off, which turns off the 12V supply that powers the EMS-C, so comms go offline.',
    }
    settings = {
      value: up,
      why: up ? 'Settings and firmware can be updated while the EMS-C has power.' : 'The EMS-C has no power, so settings and firmware cannot be updated.',
    }
  } else {
    const unknown = { value: null, why: 'TODO(author): not known for Revs 1-3 (WCM) yet.' }
    comms = unknown
    settings = unknown
  }

  // All revisions have a normal light and a fault light (author). The normal light while in a fault is not described.
  const lights: PanelLight[] = [
    // AC power button off: the controller is on in standby and the green LED flashes (Technical Service Manual pp.13, 35).
    { label: 'Normal light', color: fault ? 'unknown' : s.condition === 'alarm' || !acdcOn ? 'green-blink' : 'green' },
    { label: 'Fault light', color: fault ? 'red' : 'off' },
  ]

  return {
    externalSource: external,
    fullyOff: fullyOffRow,
    controllerOn: { value: true, why: 'The controller stays on while the system is not shut down.' },
    loadsPowered: { value: loads, why: loadsWhy },
    pvAccepted: { value: pv, why: pvWhy },
    commsOnline: comms,
    settingsFirmware: settings,
    lights,
  }
}

export const defaultState = (family: PanelState['family']): PanelState => ({
  family,
  switches: { pv: true, power: true, shutdown: true },
  world: { grid: true, solar: true, other: false },
  condition: 'normal',
})
