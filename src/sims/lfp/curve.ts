import { CELLS_IN_SERIES, CURVE_POINTS, LION_LIMITS, type LionLimit } from '../../content/sims/lfpCurve'

/** Typical resting cell voltage at a state of charge (0 to 100), by straight lines between the table points. */
export function cellVoltageAt(soc: number): number {
  const s = Math.min(100, Math.max(0, soc))
  const pts = [...CURVE_POINTS].sort((a, b) => a.soc - b.soc)
  for (let i = 1; i < pts.length; i++) {
    if (s <= pts[i].soc) {
      const a = pts[i - 1]
      const b = pts[i]
      return a.cell + ((b.cell - a.cell) * (s - a.soc)) / (b.soc - a.soc)
    }
  }
  return pts[pts.length - 1].cell
}

export const packVolts = (cell: number): number => cell * CELLS_IN_SERIES
export const cellVolts = (pack: number): number => pack / CELLS_IN_SERIES

export type Zone = 'above-max' | 'normal' | 'inverter-stops' | 'battery-stops' | 'min-power-risk'

export interface ZoneInfo {
  zone: Zone
  text: string
  /** The Lion limit this reading is at or past, if any. */
  limit?: LionLimit
}

const L = (id: string): LionLimit => LION_LIMITS.find((x) => x.id === id)!

/** What Lion's battery and inverter do at the lowest (or highest) cell voltage. Cell volts in, not pack volts. */
export function zoneAt(cell: number): ZoneInfo {
  const mV = cell * 1000
  if (mV > L('max-charge').mV) return { zone: 'above-max', text: 'Above the 3650 mV limit: the battery stops charging.', limit: L('max-charge') }
  if (mV < L('min-power').mV) return { zone: 'min-power-risk', text: 'Below 2300 mV: if the battery is also discharged below 0%, the BMS turns the battery breaker off and goes to minimum power mode.', limit: L('min-power') }
  if (mV < L('bms-stop').mV) return { zone: 'battery-stops', text: 'Below 2400 mV: the battery stops discharging.', limit: L('bms-stop') }
  if (mV < L('inverter-stop').mV) return { zone: 'inverter-stops', text: 'Below 2650 mV: the inverter stops battery discharge.', limit: L('inverter-stop') }
  return { zone: 'normal', text: 'Between the inverter\'s low limit and the battery\'s high limit: normal operation.' }
}
