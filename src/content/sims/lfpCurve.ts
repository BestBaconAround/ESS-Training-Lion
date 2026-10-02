import { official, src } from '../helpers'
import type { SourceRef } from '../types'

// LFP voltage-versus-state-of-charge graph. Two kinds of facts, kept apart:
//  1. The typical LFP curve: from a third-party engineering article (web, read in full). It is NOT a Lion curve.
//     The Lion documents read do not publish a voltage-versus-state-of-charge table.
//  2. Lion's own cell-voltage limits for the Sanctuary battery: Technical Service Manual and the Rev 4 manual.

const TSM = (...p: number[]) => src('tsm', ...p)

export const CURVE_SOURCE: SourceRef = official(
  'LiFePO4 Voltage Chart (Wevolver, third-party article; it says values vary by manufacturer)',
  'https://www.wevolver.com/article/lifepo4-voltage-chart-soc-voltages-for-32v12v24v48v-systems',
)

/** Typical resting (open-circuit) cell voltage by state of charge, from the article's table. 100% is the middle of the 3.30 to 3.40 V range it gives. */
export const CURVE_POINTS: { soc: number; cell: number }[] = [
  { soc: 100, cell: 3.35 },
  { soc: 90, cell: 3.35 },
  { soc: 80, cell: 3.32 },
  { soc: 70, cell: 3.3 },
  { soc: 60, cell: 3.27 },
  { soc: 50, cell: 3.26 },
  { soc: 40, cell: 3.25 },
  { soc: 30, cell: 3.22 },
  { soc: 20, cell: 3.2 },
  { soc: 10, cell: 3.0 },
  { soc: 0, cell: 2.5 },
]

export const CURVE_NOTES: { text: string; sources: SourceRef[] }[] = [
  { text: 'The 100% point is a range: 3.30 to 3.40 V resting. Straight off the charger the cell can read 3.60 to 3.65 V, but that is surface charge and settles after several hours of rest.', sources: [CURVE_SOURCE] },
  { text: 'The curve is flat from about 90% down to 20% state of charge, so voltage alone is a poor indicator of how full the battery is in the middle. It is much more useful near the top and the bottom, where the curve is steep.', sources: [CURVE_SOURCE] },
  { text: 'The article\'s 0% point is 2.50 V per cell, the cell maker\'s absolute limit. Lion\'s battery and inverter stop earlier than that (see the Lion limits on the graph).', sources: [CURVE_SOURCE, TSM(26)] },
  { text: 'Measure with no load and no charger, after at least 30 minutes of rest. Under load or while charging the reading can be several hundred millivolts different.', sources: [CURVE_SOURCE] },
]

/** A Sanctuary battery is sixteen 3.2 V cells in series, 51.2 V nominal (`tsm` p.20). */
export const CELLS_IN_SERIES = 16
export const CELLS_SOURCE: SourceRef[] = [TSM(20)]

export interface LionLimit {
  id: string
  label: string
  mV: number
  /** Short text on the graph line. */
  short: string
  explain: string
  sources: SourceRef[]
}

/** Lion cell-voltage limits (`tsm` pp.21, 26). Pack volts are cell volts times 16. */
export const LION_LIMITS: LionLimit[] = [
  {
    id: 'max-charge', label: 'Battery stops charging', mV: 3650, short: 'Stops charging 3.65 V',
    explain: 'The battery stops charging when the highest cell is above 3650 mV.', sources: [TSM(26)],
  },
  {
    id: 'nominal', label: 'Nominal cell voltage', mV: 3200, short: 'Nominal 3.2 V',
    explain: 'Each cell is a 3.2 V lithium iron phosphate cell. Sixteen in series make the nominal 51.2 V battery.', sources: [TSM(20)],
  },
  {
    id: 'inverter-stop', label: 'Inverter stops battery discharge', mV: 2650, short: 'Inverter stops 2.65 V',
    explain: 'The inverter stops battery discharge when the lowest cell is below 2650 mV.', sources: [TSM(26)],
  },
  {
    id: 'bms-stop', label: 'Battery stops discharging', mV: 2400, short: 'Battery stops 2.40 V',
    explain: 'The battery stops discharging when the lowest cell is below 2400 mV.', sources: [TSM(26)],
  },
  {
    id: 'min-power', label: 'Minimum power mode', mV: 2300, short: 'Min power mode 2.30 V',
    explain: 'If the battery is discharged below 0% and any cell is under 2300 mV, the BMS turns the battery breaker off and goes to minimum power mode. A 0 V reading at the terminals then usually means the breaker is off.', sources: [TSM(21)],
  },
]

/** Rev 4 battery voltage range, 40 to 58.4 VDC (`manual` p.44). */
export const REV4_PACK_RANGE = { min: 40, max: 58.4, sources: [src('manual', 44)] as SourceRef[] }

export const IMBALANCE_NOTE = {
  text: 'A spread of more than 700 mV between the highest and lowest cell may make the battery disable both charging and discharging. Some batteries use 1000 mV instead.',
  sources: [TSM(26)],
}
