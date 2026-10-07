import { src } from '../helpers'
import type { SourceRef } from '../types'

// Data for the 3D inverter lab (Rev 4 wire box). Wiring rules come from `wireBox.ts`; this file adds the fastener,
// meter and cable-tester content. Everything here cites a document; gaps are TODO strings and are never graded.

const AUTHOR = src('author')
const TSM = (...p: number[]) => src('tsm', ...p)

export type Fastener = 'tight' | 'loose' | 'removed'

/** Torque is not given for the Sanctuary 2 wire box in any document read. */
export const TORQUE_TODO =
  'TODO(source): the Technical Service Manual (p.18) says torque specs are in the Sanctuary 3 installation manual, and gives about 29 inch-pounds only for the battery front cover screws (p.25). No torque is given here for the Sanctuary 2 wire box terminals or busbar bolts, so the lab only tracks tight, loose and removed.'

export const LOOSE_NOTES: { pv: { text: string; sources: SourceRef[] }; other: { text: string; sources: SourceRef[] } } = {
  pv: {
    text: 'A loose PV connection can spark. The arc fault detector sits just above the PV connections and triggers alarm A2_15 (ARC Fault Detected). Solar production is shut down to prevent fire, and the alarm does not clear on its own: check the PV wiring, repair it, then restart the inverter.',
    sources: [TSM(82)],
  },
  other: {
    text: 'Do not power on the system until a final continuity check shows every connection is secure and correctly installed. A bolt that is loose or removed is not a secure connection.',
    sources: [TSM(7), AUTHOR],
  },
}

export const BAD_CABLE_NOTE = {
  text: 'The cable fails the Ethernet cable tester. Check all Ethernet-style cables with a cable tester and replace a bad one. The OEM black cables seem to fail, and replacing the cable often fixes communication problems.',
  sources: [TSM(23, 80), AUTHOR],
}

/** Lab-only fault scenarios, in addition to the ones in `wireBox.ts`. */
export const LAB_SCENARIO_TEXT: Record<string, { title: string; symptom: string; fix: string; sources: SourceRef[] }> = {
  'loose-pv': {
    title: 'A PV terminal bolt is loose',
    symptom: 'Alarm A2_15 (ARC Fault Detected). Solar production has stopped on that string.',
    fix: 'Switch the PV Disconnect off, tighten the loose PV terminal, then restart the inverter to clear the alarm.',
    sources: [TSM(82)],
  },
  'loose-battery': {
    title: 'A battery cable bolt is loose',
    symptom: 'You are doing the final check before power-up and the battery cable lug moves when you push on it.',
    fix: 'Tighten the busbar bolt. Do not power on until every connection is secure.',
    sources: [TSM(7), AUTHOR],
  },
  'bad-bms-cable': {
    title: 'The BMS cable is bad',
    symptom: 'Alarm A2_11 (BMS Communication Failure). The battery has normal voltage, but the system lost communication with it.',
    fix: 'Test the BMS cable with the cable tester. It fails, so replace it with the spare Ethernet cable on BMS COMM.',
    sources: [TSM(22, 23, 79, 80), AUTHOR],
  },
}

export const LAB_SCENARIO_IDS = Object.keys(LAB_SCENARIO_TEXT)

/** Exploration tasks (the checklist in the lab). Each is completed by looking at the part with the Inspect tool. */
export interface ExploreTask {
  id: string
  label: string
  /** Component ids that complete the task. */
  components: string[]
}

export const EXPLORE_TASKS: ExploreTask[] = [
  { id: 'x-board', label: 'Identify the control board', components: ['control'] },
  { id: 'x-dc', label: 'Find the battery DC busbars', components: ['busbars'] },
  { id: 'x-ac', label: 'Locate the grid, generator and load terminals', components: ['ac-grid', 'ac-gen', 'ac-load'] },
  { id: 'x-fuse', label: 'Spot the PV fuse holders', components: ['pv-fuses'] },
  { id: 'x-comm', label: 'Find the battery and communication connections', components: ['emsc', 'ports-bms', 'ports-wifi', 'ports-ct'] },
]

export interface Component {
  id: string
  title: string
  facts: { text: string; sources: SourceRef[] }[]
}

/** Info cards for the Inspect tool. Port and board facts repeat what the 2D wire box simulator shows. */
export const COMPONENTS: Component[] = [
  {
    id: 'control',
    title: 'Control board',
    facts: [
      { text: 'The USB-C port is at the top left of the control board.', sources: [AUTHOR] },
      { text: 'The colored plugs on the cover diagram are Remote Shutdown, Generator AGS and Rapid Solar Shutdown (RSS). The remote shutdown port comes with a wire loop from the factory.', sources: [AUTHOR, TSM(32, 36, 39)] },
      { text: 'The two black blocks at the right of the board are the load relays on the I/O board. The line 1 load relay is on the left, and the line 2 load relay is on the right.', sources: [TSM(45)] },
    ],
  },
  {
    id: 'busbars',
    title: 'Battery busbars (BAT+ and BAT-)',
    facts: [
      { text: 'The battery cables bolt into the inverter and plug into the battery. The wire box cover diagram labels the busbars BAT+ and BAT-.', sources: [AUTHOR] },
      { text: 'The battery terminals are not protected from reverse polarity.', sources: [TSM(53)] },
    ],
  },
  {
    id: 'pv-fuses',
    title: 'PV fuse holders and PV terminals',
    facts: [
      { text: 'There are four PV inputs, each with a PV+ and PV- terminal: PV1+ to PV4+, then PV1- to PV4-.', sources: [AUTHOR] },
      { text: 'The arc fault detector is just above the PV connections. A loose PV wire that sparks triggers alarm A2_15.', sources: [TSM(82)] },
    ],
  },
  {
    id: 'ac-grid',
    title: 'Grid input terminals (L1, L2, N)',
    facts: [
      { text: 'Grid L1, L2 and N each have their own terminal. Split phase reads 120 V line to neutral and 240 V line to line.', sources: [AUTHOR, TSM(34)] },
      { text: 'Rev 4 has the grid and generator ports in a different order on the DIN rail than earlier revisions.', sources: [TSM(45)] },
    ],
  },
  {
    id: 'ac-gen',
    title: 'Generator terminals (L1, L2, N)',
    facts: [{ text: 'The generator terminals sit between the grid and load terminals on the cover diagram. Generator wiring is optional.', sources: [AUTHOR] }],
  },
  {
    id: 'ac-load',
    title: 'Load output terminals (L1, L2, N)',
    facts: [{ text: 'If load L1 and L2 are swapped in a parallel system, the load power shuts off with alarm A2_19.', sources: [TSM(34, 84, 85)] }],
  },
  {
    id: 'emsc',
    title: 'EMS-C (energy management communicator)',
    facts: [
      { text: 'The lights are STATUS, CELLULAR, BLUETOOTH and POWER. Solid blue means connected, solid red disconnected.', sources: [AUTHOR, src('emsc', 6)] },
      { text: 'The EMS-C connects to the inverter WiFi port. Its battery port is used only during commissioning to address each battery.', sources: [src('emsc', 8)] },
      { text: 'Cellular antenna goes to the cellular port, WiFi/Bluetooth antenna to the WiFi port.', sources: [TSM(60)] },
    ],
  },
  {
    id: 'ports-bms',
    title: 'Port block: Parallel A (front) over BMS COMM (back)',
    facts: [{ text: 'Battery 1 plugs into BMS COMM. The other batteries daisy chain from battery 1. If the inverter cannot read the batteries you get alarm A2_11.', sources: [src('emsc', 8), TSM(22, 79)] }],
  },
  {
    id: 'ports-wifi',
    title: 'Port block: Parallel B (front) over WiFi Port (back)',
    facts: [{ text: 'The EMS-C cable goes in the WiFi Port. If the communicator cannot reach the inverter you get alarm E1_1.', sources: [src('emsc', 8), TSM(91, 92)] }],
  },
  {
    id: 'ports-ct',
    title: 'Port block: Meter Port, NOT USED (front) over CT1 & CT2 (back)',
    facts: [
      { text: 'Both CTs are combined in one plug that goes in the CT1 & CT2 port. Pins 3 and 6 are the L1 CT and pins 1 and 2 are the L2 CT.', sources: [TSM(9)] },
      { text: 'The Meter Port is not used on Rev 4. With the CT cord in the meter port only the L2 CT reads power and it reads backwards.', sources: [TSM(9), AUTHOR] },
    ],
  },
]
