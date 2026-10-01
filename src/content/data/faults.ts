import type { SourceRef } from '../types'

export interface FaultCode {
  code: string
  name: string
  description: string
  solutions: string[]
  sources: SourceRef[]
}

const S = (...pages: number[]): SourceRef[] => [{ source: 'san2_2', pages }]

/**
 * Fault/alarm codes from the Installation Guide 4/25/25 (2), "Fault Information and Processing".
 * The author confirmed all fault/alarm codes apply to all Sanctuaries.
 * TODO(source): the guide marks A1_3, A1_4 and A2_12 with an asterisk it never explains.
 */
export const FAULT_CODES: FaultCode[] = [
  {
    code: 'A1_0',
    name: 'Over-Current Discharge',
    description: 'Occurs when the load is drawing too much power and the grid is down.',
    solutions: ['Limit load usage to 8kW total (4kW per leg max) per inverter.', 'Ensure loads are balanced on each leg.'],
    sources: S(32),
  },
  {
    code: 'A1_1',
    name: 'Over-Load',
    description:
      'Happens when your load is more than the rated continuous output of the inverter (i.e. 8kW inverter with 10kW load). Inverter should shutdown or cut load output.',
    solutions: ['Disconnect excessive loads, and wait 5-10 minutes for alarm to clear.', 'If system does not reset, try power cycling the inverter.'],
    sources: S(32),
  },
  {
    code: 'A1_2',
    name: 'Battery Disconnected',
    description: 'Happens when the battery is disconnected.',
    solutions: [
      'Ensure that battery terminals are connected.',
      'Make sure battery cables are connected to the inverter.',
      'Send wake up command to the battery to ensure the BMS (Battery Management System) is awake.',
      'If battery is connected, fault is still present, and voltage is within range, power cycle inverter to clear fault.',
    ],
    sources: S(32),
  },
  {
    code: 'A1_3',
    name: 'Battery Under-Voltage / Battery Under Capacity',
    description:
      'Happens when a battery state of charge (percent) is below the desired/target state of charge (i.e. target is 20% and you are currently at 15%, or target is 70% and battery is at 65%). Default should be 90%.',
    solutions: [
      'Ensure default depth of discharge is set at 90%.',
      'If inverter does not charge, use a power supply to charge the battery to at least 10% SOC.',
    ],
    sources: S(32),
  },
  {
    code: 'A1_4',
    name: 'Battery Low Voltage / Battery Low Capacity',
    description: 'See A1_3 Description.',
    solutions: ['See A1_3 Description.'],
    sources: S(32),
  },
  {
    code: 'A1_5',
    name: 'Battery Over-Voltage',
    description: 'Happens when battery is over the voltage limit.',
    solutions: ['Try power cycling inverter.', 'Contact Lion Energy.'],
    sources: S(33),
  },
  {
    code: 'A1_6',
    name: 'Grid Low Voltage',
    description: 'Happens when grid input voltage is below the minimum grid voltage.',
    solutions: ['Ensure grid input voltage is within range.', 'Check the grid input type on inverter settings. Default is US.'],
    sources: S(33),
  },
  {
    code: 'A1_7',
    name: 'Grid Over-Voltage',
    description: 'Happens when grid input voltage is above the maximum grid voltage.',
    solutions: ['Ensure grid input voltage is within range.', 'Check the grid input type on inverter. Default is US.'],
    sources: S(33),
  },
  {
    code: 'A1_8',
    name: 'Grid Low Frequency',
    description: 'Happens when grid input frequency is below the minimum grid frequency.',
    solutions: ['Ensure grid input frequency is within range.', 'Check the grid input type on inverter. Default is US.'],
    sources: S(33),
  },
  {
    code: 'A1_9',
    name: 'Grid High Frequency',
    description: 'Happens when grid input frequency is above the maximum grid frequency.',
    solutions: ['Ensure grid input frequency is within range.', 'Check the grid input type on inverter. Default is US.'],
    sources: S(33),
  },
  {
    code: 'A1_10',
    name: 'Leakage Current (GFCI Fault)',
    description: 'Happens when there is a ground fault.',
    solutions: [
      'Ensure bonding of neutral and ground follow NEC code requirements.',
      'Check wiring of system, inspect wiring of neutral and ensure it is landed in correct terminals.',
      'Ensure load output panel is not bonded.',
    ],
    sources: S(33),
  },
  {
    code: 'A1_11',
    name: 'Parallel CAN Communication Fault',
    description: 'Happens when, in a parallel configuration, inverters are not able to communicate with each other.',
    solutions: [
      'Check to make sure the CAN communication cable is installed correctly.',
      'Parent: Port B to Child: Port A.',
      'Reference installation guide for further instructions.',
    ],
    sources: S(33),
  },
  {
    code: 'A1_12',
    name: 'Grid CT is Reversed',
    description: 'Happens when CTs are installed improperly.',
    solutions: ['Switch CT direction.', 'Reference installation guide for further instructions.'],
    sources: S(33),
  },
  {
    code: 'A1_13',
    name: 'DC BUS Under-Voltage',
    description: 'Happens when the DC bus is imbalanced.',
    solutions: ['Power cycle the inverter.'],
    sources: S(33),
  },
  {
    code: 'A1_14',
    name: 'DC BUS Over-Voltage',
    description: 'Happens when the DC bus is imbalanced.',
    solutions: ['Power cycle the inverter.'],
    sources: S(34),
  },
  {
    code: 'A1_15',
    name: 'Inverter Over-Current',
    description:
      'Happens when the inverter is trying to cover too many loads. This can also happen when multiple inverters are connected, but out of sync.',
    solutions: ['Decrease loads of inverter.', 'Wait for alarm to clear.', 'If alarm does not clear power cycle the inverter.'],
    sources: S(34),
  },
  {
    code: 'A2_8',
    name: 'Battery Under Temperature',
    description: 'Happens when the battery is too cold.',
    solutions: ['Check the temperature of the inverter.', 'Check if fans are functioning properly.'],
    sources: S(34),
  },
  {
    code: 'A2_9',
    name: 'Battery Cell Unbalanced',
    description: 'Voltage on the individual cells of the battery are not within target range of each other.',
    solutions: [
      'Check individual battery cells. If voltage difference is greater than 0.4V, use power supply to charge up low cell(s).',
      'Reference battery troubleshooting guide for further instructions.',
    ],
    sources: S(34),
  },
  {
    code: 'A2_10',
    name: 'Battery is Reverse Polarity',
    description: 'Happens when battery cables are reversed in polarity on the inverter.',
    solutions: ['Install battery cables correctly.', 'Power cycle inverter.'],
    sources: S(34),
  },
  {
    code: 'A2_11',
    name: 'BMS Communication Failure',
    description: 'Happens when the BMS in the battery is not communicating with the inverter.',
    solutions: [
      'After commissioning the system, make sure BMS splitter is plugged into the BMS communication port.',
      'Check wire orientation of BMS cable and re-wire BMS cable if incorrect (reference installation guide).',
      'Power cycle the inverter.',
    ],
    sources: S(34),
  },
  {
    code: 'A2_12',
    name: 'Battery Fault',
    description: 'Contact installer.',
    solutions: ['Power cycle inverter.', 'Contact Lion Energy.'],
    sources: S(34),
  },
  {
    code: 'A2_13',
    name: 'Grid Over-Load',
    description: 'Happens when the load exceeds recommended current rating.',
    solutions: ['Decrease load usage.', 'Power cycle the inverter.'],
    sources: S(35),
  },
  {
    code: 'A2_14',
    name: 'Grid Phase Error',
    description: 'Contact installer.',
    solutions: ['Power cycle the inverter.', 'Contact Lion Energy.'],
    sources: S(35),
  },
  {
    code: 'A2_15',
    name: 'ARC Fault Detected',
    description: 'Contact installer.',
    solutions: ['Check Solar wiring to ensure correct connections.', 'Power cycle the inverter.', 'Contact Lion Energy.'],
    sources: S(35),
  },
]

/** Printed under the table (guide p.35). */
export const FAULT_FOOTNOTE =
  'If you are unable to clear the fault, restart the system. If the fault still shows, contact Lion Energy for assistance.'

export const faultByCode = (code: string): FaultCode | undefined => FAULT_CODES.find((f) => f.code === code)
