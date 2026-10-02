import { src } from '../helpers'
import type { SourceRef } from '../types'

// Rev 4 wire box simulator data. Port and terminal names come from the diagram inside the wire box cover and the
// photos of the author's training unit (source `author`). Consequences come from the Technical Service Manual.
// Anything the documents do not describe is shown as "not described" and is never graded.

const AUTHOR = src('author')
const TSM = (...p: number[]) => src('tsm', ...p)
const EMSC = (...p: number[]) => src('emsc', ...p)
const DIAGRAM: SourceRef[] = [AUTHOR]

export type StubDir = 'up' | 'down' | 'left'
export type SocketKind = 'terminal' | 'rj45' | 'plug' | 'busbar' | 'antenna'

export interface Socket {
  id: string
  label: string
  /** Shorter text printed on the socket in the diagram. */
  short?: string
  group: string
  kind: SocketKind
  x: number
  y: number
  w: number
  h: number
  stub: StubDir
}

const SHORT: Record<string, string> = {
  ems_cell: 'Cellular antenna', ems_wifi: 'WiFi/BT antenna', rsd: 'Remote Shutdown', ags: 'Generator AGS', rss: 'RSS',
  bms: 'BMS COMM', wifi: 'WiFi Port', parallel_a: 'Parallel A', parallel_b: 'Parallel B',
}
const sock = (id: string, label: string, group: string, kind: SocketKind, x: number, y: number, w: number, h: number, stub: StubDir): Socket => ({ id, label, ...(SHORT[id] ? { short: SHORT[id] } : {}), group, kind, x, y, w, h, stub })

const pv: Socket[] = []
for (let i = 0; i < 4; i++) {
  pv.push(sock(`pv${i + 1}p`, `PV${i + 1}+`, 'PV inputs', 'terminal', 440 + i * 80, 380, 72, 40, 'down'))
  pv.push(sock(`pv${i + 1}n`, `PV${i + 1}-`, 'PV inputs', 'terminal', 440 + (i + 4) * 80, 380, 72, 40, 'down'))
}
const ac = (prefix: string, group: string, x0: number): Socket[] =>
  ['L1', 'L2', 'N'].map((n, i) => sock(`${prefix}_${n.toLowerCase()}`, n, group, 'terminal', x0 + i * 72, 540, 66, 44, 'down'))

export const SOCKETS: Socket[] = [
  sock('bat_p', 'BAT+', 'Low voltage DC', 'busbar', 170, 110, 100, 44, 'up'),
  sock('bat_n', 'BAT-', 'Low voltage DC', 'busbar', 280, 110, 100, 44, 'up'),
  sock('ems_bat', 'Battery port', 'EMS-C', 'rj45', 175, 345, 200, 36, 'left'),
  sock('ems_eth', 'Ethernet port', 'EMS-C', 'rj45', 175, 390, 200, 36, 'left'),
  sock('ems_cell', 'Cellular antenna port', 'EMS-C', 'antenna', 175, 435, 200, 36, 'left'),
  sock('ems_wifi', 'WiFi/Bluetooth antenna port', 'EMS-C', 'antenna', 175, 480, 200, 36, 'left'),
  sock('parallel_a', 'Parallel A (CAN)', 'Control board', 'rj45', 460, 110, 80, 50, 'up'),
  sock('parallel_b', 'Parallel B (CAN)', 'Control board', 'rj45', 550, 110, 80, 50, 'up'),
  sock('meter', 'Meter Port', 'Control board', 'rj45', 640, 110, 80, 50, 'up'),
  sock('rsd', 'Remote Shutdown (DRY1)', 'Control board', 'plug', 760, 110, 90, 50, 'up'),
  sock('ags', 'Generator (AGS)', 'Control board', 'plug', 860, 110, 100, 50, 'up'),
  sock('rss', 'Rapid Solar Shutdown (RSS)', 'Control board', 'plug', 970, 110, 90, 50, 'up'),
  sock('bms', 'BMS COMM (CAN/RS485)', 'Control board', 'rj45', 460, 235, 80, 45, 'down'),
  sock('wifi', 'WiFi Port (RS485)', 'Control board', 'rj45', 550, 235, 80, 45, 'down'),
  sock('ct', 'CT1 & CT2', 'Control board', 'rj45', 640, 235, 80, 45, 'down'),
  ...pv,
  ...ac('grid', 'Grid input', 440),
  ...ac('gen', 'Generator', 680),
  ...ac('load', 'Load output', 920),
]

export const socketById = (id: string): Socket => {
  const s = SOCKETS.find((x) => x.id === id)
  if (!s) throw new Error(`unknown socket ${id}`)
  return s
}

export type PartKind = 'battery' | 'pv' | 'ac' | 'ethernet' | 'plug' | 'antenna'

export interface Part {
  id: string
  label: string
  /** Short text on the cable tag in the diagram. */
  tag: string
  kind: PartKind
  /** Sockets where this part is correct. */
  correct: string[]
  /** Must be wired for a working Rev 4 system (single inverter). */
  required: boolean
  why: string
  sources: SourceRef[]
}

const batt = (id: string, label: string, sign: string, target: string): Part => ({
  id, label, tag: label, kind: 'battery', correct: [target], required: true,
  why: `${sign} The wire box cover diagram labels the low voltage DC busbars BAT+ and BAT-.`,
  sources: [...DIAGRAM, TSM(63)],
})
const pvPart = (n: number, sign: '+' | '-'): Part => ({
  id: `p_pv${n}${sign === '+' ? 'p' : 'n'}`,
  label: `PV${n} string ${sign === '+' ? 'positive' : 'negative'}`,
  tag: `String ${n} ${sign}`,
  kind: 'pv',
  correct: [`pv${n}${sign === '+' ? 'p' : 'n'}`],
  required: false,
  why: `PV${n}+ and PV${n}- are the two terminals of PV input ${n}. The positive string wire goes on PV${n}+ and the negative on PV${n}-.`,
  sources: [...DIAGRAM, TSM(63)],
})
const acPart = (prefix: 'grid' | 'gen' | 'load', n: 'L1' | 'L2' | 'N', name: string): Part => ({
  id: `p_${prefix}_${n.toLowerCase()}`,
  label: `${name} ${n}`,
  tag: `${name} ${n}`,
  kind: 'ac',
  correct: [`${prefix}_${n.toLowerCase()}`],
  required: prefix !== 'gen',
  why: `${name} ${n} lands on the ${prefix === 'grid' ? 'GRID INPUT' : prefix === 'gen' ? 'GENERATOR' : 'LOAD OUTPUT'} ${n} terminal on the wire box cover diagram. Split phase reads 120 V line to neutral and 240 V line to line.`,
  sources: [...DIAGRAM, TSM(34)],
})

export const PARTS: Part[] = [
  batt('p_bat_p', 'Battery +', 'Battery positive goes to the positive busbar.', 'bat_p'),
  batt('p_bat_n', 'Battery -', 'Battery negative goes to the negative busbar.', 'bat_n'),
  ...[1, 2, 3, 4].flatMap((n) => [pvPart(n, '+'), pvPart(n, '-')]),
  acPart('grid', 'L1', 'Grid'), acPart('grid', 'L2', 'Grid'), acPart('grid', 'N', 'Grid'),
  acPart('load', 'L1', 'Load'), acPart('load', 'L2', 'Load'), acPart('load', 'N', 'Load'),
  acPart('gen', 'L1', 'Generator'), acPart('gen', 'L2', 'Generator'), acPart('gen', 'N', 'Generator'),
  {
    id: 'p_emsc_cable', label: 'EMS-C to inverter cable', tag: 'Cable from EMS-C', kind: 'ethernet', correct: ['wifi'], required: true,
    why: 'On Rev 4 the EMS-C connects to the inverter\'s WiFi Port (back middle of the board).',
    sources: [EMSC(8), src('video')],
  },
  {
    id: 'p_bms_cable', label: 'Battery 1 BMS cable', tag: 'BMS cable from battery 1', kind: 'ethernet', correct: ['bms'], required: true,
    why: 'Battery BMS cables go to the inverter BMS COMM port (back left). Battery 1 connects to the BMS port and the other batteries daisy chain from it.',
    sources: [EMSC(8), src('video')],
  },
  {
    id: 'p_ct_cable', label: 'CT cable (both CTs in one plug)', tag: 'CT cable', kind: 'ethernet', correct: ['ct'], required: true,
    why: 'On Rev 4 both CTs are combined in one plug that goes in the CT1 & CT2 port. Pins 3 and 6 are the L1 CT and pins 1 and 2 are the L2 CT.',
    sources: [TSM(9)],
  },
  {
    id: 'p_parallel_cable', label: 'Parallel cable to a second inverter', tag: 'Cable to inverter 2', kind: 'ethernet', correct: ['parallel_a', 'parallel_b'], required: false,
    why: 'The parallel ports (CAN) link inverters in a parallel system. Which port goes to which inverter is not in the documents read.',
    sources: [TSM(73), src('manual', 39)],
  },
  {
    id: 'p_addressing_cable', label: 'Battery addressing cable (commissioning only)', tag: 'Addressing cable to battery', kind: 'ethernet', correct: ['ems_bat'], required: false,
    why: 'The EMS-C battery port is used only during commissioning to address each battery. The addressing cable must be removed afterward.',
    sources: [EMSC(8), src('video')],
  },
  {
    id: 'p_router_cable', label: 'Router Ethernet cable', tag: 'Cable from router', kind: 'ethernet', correct: ['ems_eth'], required: false,
    why: 'The most reliable connection is an Ethernet cable from the router to the EMS-C Ethernet port.',
    sources: [TSM(61)],
  },
  {
    id: 'p_antenna_cell', label: 'Cellular antenna', tag: 'Cellular antenna', kind: 'antenna', correct: ['ems_cell'], required: true,
    why: 'The antenna labeled cellular goes to the cellular port.',
    sources: [TSM(60), src('video')],
  },
  {
    id: 'p_antenna_wifi', label: 'WiFi/Bluetooth antenna', tag: 'WiFi/Bluetooth antenna', kind: 'antenna', correct: ['ems_wifi'], required: true,
    why: 'The antenna labeled WiFi/Bluetooth goes to the WiFi port.',
    sources: [TSM(60), src('video')],
  },
  {
    id: 'p_rsd_loop', label: 'Remote shutdown loop or switch', tag: 'Remote shutdown loop', kind: 'plug', correct: ['rsd'], required: true,
    why: 'The remote shutdown port comes with a wire loop installed from the factory. The remote shutdown switch, the AC/DC button and the Complete System Shutdown button must all be closed for the system to run.',
    sources: [TSM(32, 34, 36, 39)],
  },
  {
    id: 'p_ags', label: 'Generator auto-start (AGS) cable', tag: 'Generator AGS cable', kind: 'plug', correct: ['ags'], required: false,
    why: 'The yellow GENERATOR (AGS) plug on the cover diagram is for the generator auto-start connection. Pin-by-pin wiring is not in the documents read.',
    sources: DIAGRAM,
  },
  {
    id: 'p_rss', label: 'Rapid shutdown transmitter cable', tag: 'RSS transmitter cable', kind: 'plug', correct: ['rss'], required: false,
    why: 'The orange RAPID SOLAR SHUTDOWN (RSS) plug (+12V_COM, GND_COM) supplies 12 V to the rapid shutdown transmitter port. On Rev 4 that 12 V comes through the top (AC/DC) button.',
    sources: [...DIAGRAM, TSM(39)],
  },
]

export const partById = (id: string): Part => {
  const p = PARTS.find((x) => x.id === id)
  if (!p) throw new Error(`unknown part ${id}`)
  return p
}

/** What happens for specific wrong placements. Key: `${partId}@${socketId}`. */
export const WRONG_NOTES: Record<string, { text: string; sources: SourceRef[] }> = {
  'p_ct_cable@meter': {
    text: 'The Meter Port is not used on Rev 4. With the CT cord in the meter port only the L2 CT reads power, it is connected to the L1 CT, and it reads backwards. The L1 CT shows no power.',
    sources: [TSM(9), AUTHOR],
  },
  'p_bms_cable@wifi': { text: 'The inverter cannot read the batteries, so you get alarm A2_11 (BMS Communication Failure). The inverter will not charge or discharge the batteries.', sources: [TSM(22, 79, 32)] },
  'p_emsc_cable@bms': { text: 'The communicator cannot talk to the inverter, so you get alarm E1_1 (Inverter Communication Fault), and the inverter now sees the EMS-C on the battery port.', sources: [TSM(91, 92, 22)] },
  'p_emsc_cable@ct': { text: 'The CT port is not the communicator port. The communicator cannot reach the inverter: E1_1 (Inverter Communication Fault).', sources: [TSM(91, 92, 9)] },
  'p_bms_cable@meter': { text: 'The Meter Port is not used on Rev 4. The inverter will not see the batteries: A2_11 (BMS Communication Failure).', sources: [TSM(22, 79), AUTHOR] },
  'p_bat_p@bat_n': { text: 'Reversed battery polarity. The battery terminals are not protected from reverse polarity. Reverse polarity with a 51.2 V battery will forward bias the IGBT body diodes and probably destroy something. The A2_10 alarm is a place-holder, so do not count on it to warn you.', sources: [TSM(53, 78)] },
  'p_bat_n@bat_p': { text: 'Reversed battery polarity. The battery terminals are not protected from reverse polarity. Reverse polarity with a 51.2 V battery will forward bias the IGBT body diodes and probably destroy something. The A2_10 alarm is a place-holder, so do not count on it to warn you.', sources: [TSM(53, 78)] },
  'p_antenna_cell@ems_wifi': { text: 'The antennas are swapped. A wrong antenna gives poor reception.', sources: [TSM(60)] },
  'p_antenna_wifi@ems_cell': { text: 'The antennas are swapped. A wrong antenna gives poor reception.', sources: [TSM(60)] },
}

export const PV_REVERSED_NOTE = {
  text: 'Reversed PV polarity is a common cause of no solar power. If the voltage from PV+ to PV- reads about -1 V, the PV lines are reversed (a reverse polarity forward biases a diode in the MPPT input).',
  sources: [TSM(63)],
}
export const GRID_PHASE_NOTE = {
  text: 'Grid L1 and L2 swapped. In a parallel system every inverter must read the correct phase on L1 and L2 before connecting. If it does not, connecting would be a direct L1 to L2 short, so you get alarm A2_20 (Grid Port Wiring Error) that stays until the inverter is completely shut down.',
  sources: [TSM(34, 85)],
}
export const LOAD_PHASE_NOTE = {
  text: 'Load L1 and L2 swapped. In a parallel system the inverter checks that the load voltage from the parent reads in the correct phase at the child inverters. If it does not, the load power is shut off and you get alarm A2_19 (Load Port Wiring Error). It needs a power cycle to clear.',
  sources: [TSM(34, 84, 85)],
}

export interface BoardInfo {
  id: string
  title: string
  /** Position of the clickable card in the diagram (not a socket). */
  x: number
  y: number
  w: number
  h: number
  facts: { text: string; sources: SourceRef[] }[]
  todo?: string
}

export const BOARDS: BoardInfo[] = [
  {
    id: 'control', title: 'Control board', x: 440, y: 90, w: 680, h: 210,
    facts: [
      { text: 'The USB-C port is at the top left of the control board.', sources: [AUTHOR] },
      { text: 'Port labels (photo and cover diagram): Parallel A (CAN) over BMS COMM (CAN/RS485), Parallel B (CAN) over WiFi Port (RS485), and the Meter Port (front) over CT1 & CT2 (back). The board label for the front right port says NOT USED.', sources: [AUTHOR] },
      { text: 'The Meter Port is unused on Rev 4. On Rev 3 it carries inverter communication.', sources: [AUTHOR, EMSC(9)] },
      { text: 'The parallel ports carry CAN. The default communicator baud rate is 9600 bps.', sources: [TSM(73, 91, 92)] },
      { text: 'The colored plugs on the cover diagram are Remote Shutdown (blue), Generator AGS (yellow) and Rapid Solar Shutdown RSS (orange).', sources: [AUTHOR] },
      { text: 'The remote shutdown port comes with a wire loop installed from the factory. The remote shutdown switch is in series with the AC/DC button.', sources: [TSM(32, 36, 39)] },
    ],
  },
  {
    id: 'wcm', title: 'WCM (wireless communication module)', x: 160, y: 200, w: 230, h: 70,
    facts: [
      { text: 'The small green board at the top left of the Rev 4 training unit is the WCM. This unit was upgraded to an EMS-C and the WCM is not used.', sources: [AUTHOR] },
      { text: 'The WCM ships on Revs 1-3 and some Rev 4. Only one communication module (WCM or EMS-C) is used per system, and it stays in the parent inverter.', sources: [AUTHOR, EMSC(13)] },
    ],
    todo: 'WCM wiring on Rev 4 is described in the installation manual, which is not in this repo. Not graded here.',
  },
  {
    id: 'emsc', title: 'EMS-C (energy management communicator)', x: 160, y: 300, w: 230, h: 230,
    facts: [
      { text: 'The EMS-C lights are STATUS, CELLULAR, BLUETOOTH and POWER (photo). Solid blue means connected, solid red disconnected, 1 second yellow blink connecting, solid yellow updating, and no lights means not commissioned.', sources: [AUTHOR, EMSC(6)] },
      { text: 'The EMS-C is powered by the 12 V RSS supply. When the AC power button or the remote shutdown switch turns off AC power on the inverter, the EMS-C loses power.', sources: [EMSC(8), TSM(39)] },
      { text: 'On Rev 4 the EMS-C connects to the inverter WiFi port. Its battery port is used only during commissioning to address each battery.', sources: [EMSC(8)] },
      { text: 'Antennas: cellular goes to the cellular port, WiFi/Bluetooth to the WiFi port. A wrong antenna gives poor reception.', sources: [TSM(60)] },
      { text: 'Without Wi-Fi or Ethernet the EMS-C tries cellular but only uploads alarms.', sources: [TSM(58, 75)] },
    ],
  },
  {
    id: 'busbars', title: 'Low voltage DC busbars (BAT+ and BAT-)', x: 160, y: 90, w: 230, h: 90,
    facts: [
      { text: 'The battery cables bolt into the inverter and plug into the battery.', sources: [AUTHOR] },
      { text: 'The battery terminals are not protected from reverse polarity.', sources: [TSM(53)] },
    ],
  },
]

export interface WireScenario {
  id: string
  title: string
  /** What the customer or the technician sees. */
  symptom: string
  /** Part ids this scenario moves. Used to avoid combining overlapping scenarios. */
  parts: string[]
  /** What goes wrong and how to fix it. */
  fix: string
  sources: SourceRef[]
}

export const SCENARIO_TEXT: Record<string, Omit<WireScenario, 'parts' | 'id'>> = {
  'ct-meter': {
    title: 'CT cable in the wrong port',
    symptom: 'The grid power on the graph looks wrong: only one line shows power and it reads backwards. The L1 CT shows no power.',
    fix: 'Move the CT cable from the Meter Port to CT1 & CT2.',
    sources: [TSM(9)],
  },
  'comms-swap': {
    title: 'Communication cables swapped',
    symptom: 'Alarm A2_11 (BMS Communication Failure) and the EMS-C cannot reach the inverter (E1_1).',
    fix: 'The BMS cable goes to BMS COMM and the EMS-C cable goes to the WiFi Port.',
    sources: [TSM(22, 79, 91, 92)],
  },
  'pv-reversed': {
    title: 'PV string connected backwards',
    symptom: 'One string produces no power. With the meter, PV+ to PV- reads about -1 V.',
    fix: 'Swap the positive and negative string wires on that PV input.',
    sources: [TSM(63)],
  },
  'battery-reversed': {
    title: 'Battery cables reversed (found before power-up)',
    symptom: 'You are checking the wiring before closing the battery breaker. The battery cables look swapped.',
    fix: 'Put the positive cable on BAT+ and the negative cable on BAT- before connecting any power. Reverse polarity will probably destroy something.',
    sources: [TSM(53, 78)],
  },
  'rsd-open': {
    title: 'Remote shutdown plug is empty',
    symptom: 'Both power buttons are on, but the load port has no power and the EMS-C has no power. The remote shutdown plug reads 5 V.',
    fix: 'The remote shutdown circuit must be closed. Plug the factory wire loop (or a closed switch) back into the remote shutdown port.',
    sources: [TSM(32, 34, 36, 39)],
  },
  'grid-swap': {
    title: 'Grid L1 and L2 swapped (parallel system)',
    symptom: 'Alarm A2_20 (Grid Port Wiring Error). The inverters will not connect to the grid.',
    fix: 'Power everything off and put grid L1 on the L1 terminal and grid L2 on L2.',
    sources: [TSM(34, 85)],
  },
  'load-swap': {
    title: 'Load L1 and L2 swapped (parallel system)',
    symptom: 'Alarm A2_19 (Load Port Wiring Error). The load port power shuts off.',
    fix: 'Put load L1 on the L1 terminal and load L2 on L2, then power cycle to clear the alarm.',
    sources: [TSM(34, 84, 85)],
  },
  'antennas-swapped': {
    title: 'Antennas on the wrong ports',
    symptom: 'The customer reports poor Wi-Fi and cellular reception on the EMS-C.',
    fix: 'The cellular antenna goes on the cellular port and the WiFi/Bluetooth antenna on the WiFi port.',
    sources: [TSM(60)],
  },
  'addressing-cable-left': {
    title: 'Addressing cable left in, BMS cable not moved',
    symptom: 'Alarm A2_11 (BMS Communication Failure). The EMS-C battery port still has a cable in it.',
    fix: 'Remove the addressing cable from the EMS-C battery port and plug battery 1 into the BMS COMM port.',
    sources: [EMSC(8), src('video'), TSM(22, 79)],
  },
}

export const SCENARIO_IDS = Object.keys(SCENARIO_TEXT)
