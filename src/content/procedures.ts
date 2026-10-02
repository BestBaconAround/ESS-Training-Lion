import { official, src, web } from './helpers'
import type { RevisionTag, SourceRef } from './types'
import type { TopicImage } from './topics'

// Procedures the author asked for. Each item is built only from the documents. Steps carry sources and revisions.
// Anything the documents do not give is a visible `todo`, never a guess.

export interface ProcedureStep {
  text: string
  sources: SourceRef[]
  revisions: RevisionTag
}

export type ProcedureLink =
  | { type: 'entry'; id: string; label: string }
  | { type: 'lesson'; moduleId: string; lessonId: string; label: string }
  | { type: 'module'; moduleId: string; label: string }
  | { type: 'page'; to: string; label: string }

export type ProcedureStatus = 'ready' | 'partial' | 'todo' | 'blocked'

export interface Procedure {
  /** Stable. Never rename or reuse. */
  id: string
  group: string
  title: string
  /** One or two lines: what this is and what is covered. */
  summary: string
  steps?: ProcedureStep[]
  /** Photos and manual pages that show what the steps refer to. Alt text and caption say only what is visible. */
  images?: TopicImage[]
  links?: ProcedureLink[]
  /** Visible gaps: what is still needed, and from whom. */
  todo?: string[]
  /** Set when the item cannot be built as a static page. */
  blocked?: string
}

/** ready = content and nothing missing; partial = content with gaps; todo = nothing yet; blocked = cannot be done as asked. */
export function statusOf(p: Procedure): ProcedureStatus {
  if (p.blocked) return 'blocked'
  const hasContent = (p.steps?.length ?? 0) > 0 || (p.links?.length ?? 0) > 0
  if (!hasContent) return 'todo'
  return p.todo && p.todo.length > 0 ? 'partial' : 'ready'
}

const TSM = (...pages: number[]) => src('tsm', ...pages)
const SET = (...pages: number[]) => src('settings', ...pages)
const EMSC = (...pages: number[]) => src('emsc', ...pages)
const AUTHOR = src('author')
const TIGO_MAN = official('TS4-A with TAP and CCA Installation Manual, Rev 2.3, 10/1/2025, PN 002-00129-00 (Tigo Energy)', 'https://cdn.prod.website-files.com/5fad551d7419c7a0e9e4aba4/698b65573e1e53f5d116c80f_002-00129-00%202.3%20IO%26M%20TS4A%20with%20TAP%20and%20CCA%2020251001%20-%20EN.pdf')
const VIDEO = src('video')

const s = (text: string, sources: SourceRef[], revisions: RevisionTag = 'all'): ProcedureStep => ({ text, sources, revisions })

export const PROCEDURE_GROUPS = [
  'Wi-Fi and communication',
  'Settings and the web app',
  'Installation and wiring',
  'Relays and meter tests',
  'Battery',
  'Solar',
  'Generator and AC solar',
  'Service',
  'Learning',
  'Also in the manuals',
] as const

export const PROCEDURES: Procedure[] = [
  // ------------------------------------------------------------------ Wi-Fi and communication
  {
    id: 'p-wifi',
    group: 'Wi-Fi and communication',
    title: 'Change the Wi-Fi: homeowner and technician',
    summary: 'Both people need to be within Bluetooth range of the Sanctuary.',
    steps: [
      s('Homeowner: "Change Internet" is one of the three things a homeowner can change. It changes the Wi-Fi name (SSID) and password. Use a laptop with Bluetooth and follow the on-screen prompts: smart.lionenergy.com, the product page, settings, change internet.', [SET(11), TSM(61)]),
      s('Homeowner on a phone: the Apple version of the Lion Smart app can change the Wi-Fi. The Android version cannot yet. A mobile browser does not work on every device.', [TSM(60, 61)]),
      s('Technician: in the Lion Technician app (Apple or Android) use Select Service > "Change or Reconnect Network".', [TSM(61)]),
      s('The most reliable connection is an Ethernet cable from the router to the EMS-C Ethernet port.', [TSM(61)]),
    ],
    links: [{ type: 'entry', id: 'ts-change-wifi', label: 'Change the Wi-Fi network or password (troubleshooting entry)' }],
  },
  {
    id: 'p-replace-wcm',
    images: [
      { src: 'images/wcm.webp', alt: 'The small green WCM board at the top left of the wiring compartment of the Rev 4 training unit.', caption: 'The WCM board (this unit was upgraded to an EMS-C and the WCM is not used).', sources: [src('author')] },
      { src: 'images/ems-c-in-inverter.png', alt: 'An EMS-C mounted in an inverter.', caption: 'An EMS-C in an inverter (author training unit).', sources: [src('author')] },
    ],
    group: 'Wi-Fi and communication',
    title: 'Replace a WCM with an EMS-C',
    summary: 'What the documents say about the swap. The hands-on steps are still needed.',
    steps: [
      s('Revs 1-3 shipped with a WCM and can be retrofitted with an EMS-C. Rev 4 has the EMS-C as standard (some Rev 4 shipped with a WCM).', [EMSC(13)]),
      s('Replacing a WCM or an EMS-C does not require recommissioning. Only one communicator is used per system and it stays in the parent inverter.', [EMSC(16), EMSC(13), AUTHOR]),
      s('Wiring by revision. Revs 1 and 2: the EMS-C inverter port goes to the RJ-45 dongle near the battery terminals. Rev 3: the EMS-C inverter port goes to the meter port (front right) with a specially wired Ethernet cable. Rev 4: the EMS-C goes to the inverter WiFi port.', [EMSC(8, 9, 10)]),
      s('The Rev 3 cable is a special flat cable from the meter port to the communicator. A standard Ethernet cable will not work. If it was lost, one end is T-568B and the other end follows the table in the Technical Service Manual.', [TSM(59, 60)], ['rev3']),
      s('The EMS-C is powered from the inverter 12V supply, which turns off with AC power.', [EMSC(8), TSM(58)]),
      s('Connect the antennas: the one labeled cellular goes to the cellular port and the one labeled WiFi/Bluetooth goes to the WiFi port.', [TSM(60)]),
      s('After it is connected to the Wi-Fi, the EMS-C light should be solid blue.', [EMSC(6)]),
    ],
    todo: [
      'The step-by-step for physically removing the WCM and fitting the EMS-C on Revs 1-3 (which port gives the EMS-C its 12V on those revisions, and what the Technician app asks for after a swap). Not in the documents read so far.',
    ],
  },
  {
    id: 'p-comms-map',
    images: [
      { src: 'images/rev4-board-ports.webp', alt: 'Rev 4 control board ports with labels: Parallel A and BMS COMM, Parallel B and WIFI PORT, NOT USED and CT1 and CT2.', caption: 'Rev 4 board ports (author training unit).', sources: [src('author')] },
    ],
    group: 'Wi-Fi and communication',
    title: 'Troubleshoot communication: inverters, batteries, WCM and EMS-C',
    summary: 'Four links can fail. Find which one, then use its alarm and steps.',
    steps: [
      s('Inverter to battery (Sanctuary 2): all batteries must be on the same RS-485 bus and connected to the inverter BMS port. Each battery has its own address counting up from 1. The alarm is A2_11 (BMS Communication Failure). It is the most common alarm: deal with it first.', [TSM(22, 79)]),
      s('Check each battery in the Technician app: Select Service > Read Battery Address. If a battery does not answer, check its terminal voltage, then the BMS cables with an Ethernet cable tester (RJ45 pin 6 = GND, 7 = A, 8 = B).', [TSM(22, 80)]),
      s('Inverter to inverter (parallel): the parallel ports carry CAN. The alarm is A1_11 (Parallel CAN Communication Fault). Check the cables with a tester, that all inverters run the same firmware, and that nobody commissioned a child inverter separately.', [TSM(73)]),
      s('Communicator to inverter: the alarm is E1_1 (Inverter Communication Fault). Check that every inverter is on with the front LED on or flashing, check the cables for your revision, and power-cycle the communicator. The default baud rate is 9600 bps.', [TSM(91, 92)]),
      s('Communicator to the internet: Wi-Fi or Ethernet. Without either, the EMS-C tries cellular but only uploads alarms. A1_23 means the cellular data for the month is used up.', [TSM(58, 75)]),
      s('A power cycle of the inverter helps if the BMS communication failure has lasted a long time.', [TSM(22)]),
    ],
    links: [
      { type: 'entry', id: 'ts-fault-a2_11', label: 'A2_11 BMS Communication Failure' },
      { type: 'entry', id: 'ts-fault-a1_11', label: 'A1_11 Parallel CAN Communication Fault' },
      { type: 'entry', id: 'ts-fault-e1_1', label: 'E1_1 Inverter Communication Fault' },
      { type: 'entry', id: 'ts-app-offline', label: 'The customer cannot reach the system in the app' },
    ],
  },
  {
    id: 'p-emsc-connectivity',
    images: [
      { src: 'images/ems-c-in-inverter.png', alt: 'An EMS-C mounted in an inverter.', caption: 'An EMS-C in an inverter (author training unit).', sources: [src('author')] },
    ],
    group: 'Wi-Fi and communication',
    title: 'Troubleshoot EMS-C connectivity',
    summary: 'The app cannot see the system, or the EMS-C will not stay connected.',
    links: [
      { type: 'entry', id: 'ts-app-offline', label: 'The customer cannot reach the system in the app' },
      { type: 'entry', id: 'ts-change-wifi', label: 'Change the Wi-Fi network or password' },
      { type: 'entry', id: 'ts-fault-e3_3', label: 'E3_3 Device Main Power Lost (12v)' },
      { type: 'entry', id: 'ts-fault-a1_22', label: 'A1_22 EMS-C Backup Battery Disconnected' },
    ],
  },
  {
    id: 'p-graph-black',
    group: 'Wi-Fi and communication',
    title: 'Fix a graph that is black but the Wi-Fi icon is blue',
    summary: 'No source yet.',
    todo: [
      'The author\'s steps and what causes it. Hints from the documents only, not an answer: on cellular the homeowner sees only a blue Wi-Fi icon and no system information (author), and E1_1 means the communicator cannot talk to an inverter (Technical Service Manual p.91).',
    ],
  },
  {
    id: 'p-how-comms-work',
    group: 'Wi-Fi and communication',
    title: 'How the WCM and the EMS-C work',
    summary: 'What each one is and does.',
    steps: [
      s('A Sanctuary system uses either a WCM or an EMS-C, not both. The communicator is used to commission the system and to upload data to the cloud, where it can be viewed in an app or a browser. It also connects to a laptop or phone by Bluetooth for commissioning or monitoring.', [TSM(57)]),
      s('The WCM (wireless communication module) was introduced with Sanctuary 2. The first WCM did Bluetooth, Wi-Fi and RS-485. WCM 2.0 added an Ethernet port. The WCM is powered by the inverter through the communication cable (pin 1 is 5 V).', [TSM(57)]),
      s('The EMS-C keeps everything the WCM does and adds more memory, a cellular modem, a backup battery, a battery RS-485/CAN port, another RS-485 bus, another CAN bus, a USB port, digital I/O and a power switch. It is powered by the inverter through the 12V port.', [TSM(58)]),
      s('The EMS-C connects to the internet by Wi-Fi or Ethernet. If neither is available it tries cellular, but only uploads alarms. Lion Energy can still reach it over cellular for troubleshooting.', [TSM(58)]),
      s('The EMS-C battery port and the inverter port are separate RS-485 buses. On Sanctuary 2 the battery port is only used to address batteries during commissioning.', [TSM(58), EMSC(8)]),
      s('The EMS-C sets the inverter clock from internet time every minute.', [SET(12)]),
      s('The EMS-C has a built-in cellular data plan with 50 MB, which is very bare-bones data. On cellular the homeowner sees only a blue Wi-Fi icon and no system information.', [AUTHOR]),
    ],
  },
  {
    id: 'p-update-firmware',
    group: 'Wi-Fi and communication',
    title: 'Update an inverter, an EMS-C or a WCM',
    summary: 'Updates run from the web app or the Technician app. Some cautions come from the alarm table.',
    steps: [
      s('Update firmware from the web app: Menu > settings (not advanced). The system must be online, because settings changes go through the communicator.', [TSM(12), SET(10)]),
      s('During commissioning the Technician app checks for and installs EMS-C updates, then updates the inverter firmware (a couple of minutes).', [VIDEO, TSM(11)]),
      s('Settings and firmware updates work only while the EMS-C has power. With AC/DC off on Rev 4, the EMS-C is off.', [AUTHOR, EMSC(8)], ['rev4']),
      s('Do not push a firmware update while the EMS-C is running on its backup battery (E3_3). Do not update over cellular: it takes hours. Confirm 12V power first, then update if it is not on the latest version.', [TSM(92, 93)]),
      s('All inverters in a parallel system should be on the same firmware version.', [TSM(73)]),
      s('If two inverters share one modbus address when an update is attempted, the update fails badly enough that the firmware has to be flashed directly to the board.', [TSM(56)]),
      s('If the inverter will not boot or respond after an update, see "Failed firmware update".', [TSM(55, 56)]),
    ],
    links: [{ type: 'entry', id: 'ts-failed-firmware', label: 'Failed firmware update: the inverter will not boot or respond' }],
    todo: ['How to update a WCM (not in the documents read so far) and the exact tap-by-tap steps in the Technician app.'],
  },

  // ------------------------------------------------------------------ Settings and the web app
  {
    id: 'p-tou',
    group: 'Settings and the web app',
    title: 'Adjust time of use (TOU) without breaking it',
    summary: 'Six slots that must not overlap.',
    steps: [
      s('Time of Use is on when it is enabled. With it enabled the inverter follows the TOU slots, changing its behavior by time of day. It is useful if the utility has peak billing hours.', [SET(21, 22)]),
      s('There are six time slots. Each slot must follow the one before it and must not overlap it. If start and end times overlap, TOU will not work correctly or is effectively disabled.', [SET(21, 22)]),
      s('Use all six slots: the first slot starts at 12:00 AM and the last slot (slot 6) ends at 11:59 PM, so the whole day is covered.', [SET(22), AUTHOR]),
      s('Each slot has four settings that apply while the inverter clock is between the slot start and end: discharge power (watts of battery power available to cover loads while on-grid), state of charge (the minimum target SoC for the battery), grid charge, and generator charge.', [SET(22)]),
      s('The state of charge is the minimum target. Solar can still charge the battery to 100% in that slot. If the battery is below the slot SoC the inverter charges it from the grid when grid charging is enabled for the slot.', [SET(22)]),
      s('If the customer has AC solar outside the Sanctuary, consider leaving grid charge enabled even in the peak billing slot, so the battery can charge from the other solar instead of it all being sold.', [SET(22, 23)]),
      s('The "Generator Charge" setting enables sell-first mode during the slot on new firmware. On old firmware it enabled generator charging.', [SET(23)]),
      s('The Battery Reserve Percentage setting writes the same percentage into all six slots. If the customer wants a different reserve per slot, do not use it: change the slots in Advanced Settings instead.', [SET(12)]),
      s('The correct time and time zone matter. The EMS-C sets the clock every minute, so check the time zone first if the times look wrong.', [SET(12, 41)]),
    ],
    links: [
      { type: 'entry', id: 'ts-time-wrong', label: 'Time is wrong, or time-of-use runs at the wrong times' },
      { type: 'entry', id: 'ts-operating-modes', label: 'Operating mode and battery reserve' },
    ],
  },
  {
    id: 'p-share-access',
    group: 'Settings and the web app',
    title: 'Share access and remove access',
    summary: 'Sharing is in the web app. Removing is not in the documents yet.',
    steps: [
      s('Invite the customer to view the product: web app Menu > share access.', [TSM(12)]),
      s('Shared access is by email, and it is one of the items that can be changed in "Edit info" without recommissioning. The other items are customer name, address, phone and password, installer, third-party owner, servicing company, on or off grid, PV total watts and PV location.', [SET(11)]),
      s('Change user name or address, grid status (on or off grid) or the installing technician: web app Menu > Edit info.', [TSM(12)]),
      s('The homeowner and anyone the product was shared with can change only the internet, the operating mode and the battery reserve percentage.', [SET(11)]),
      s('Delete a product from the web app: Menu > Edit info (permission required).', [TSM(12)]),
    ],
    todo: ['How to remove someone\'s shared access (not in the documents read so far).'],
  },
  {
    id: 'p-web-app',
    group: 'Settings and the web app',
    title: 'Use the smart web app',
    summary: 'Where things are, from the documents.',
    steps: [
      s('The settings page is smart.lionenergy.com > product > settings. The Settings Guide lists the settings in the same order as the page. The Lion Energy ESS support team can see all settings. Installers see installer-level settings.', [SET(10)]),
      s('Advanced settings sit on the Advanced page: basic settings, battery, system work mode, grid, generator, solar and advanced, plus command requests.', [SET(2, 10)]),
      s('The compare tool shows each inverter\'s grid voltage for L1 and L2, and checks whether each inverter sends power to the load ports. Use the compare function to check the battery voltage on the inverter against the batteries.', [TSM(13, 68)]),
      s('Component pages show each battery and whether charging and discharging are enabled, plus the battery data (cell voltages, temperatures).', [TSM(25, 26)]),
      s('The PV voltage history for each string and the solar to ground leakage can be graphed.', [TSM(72, 74)]),
      s('The alarm history shows the alarms and their times, so the clock and time zone must be right.', [SET(12)]),
      s('Menu items: Edit info, share access and settings. Delete a product also lives under Edit info.', [TSM(12)]),
    ],
    todo: ['A guided tour of each screen with pictures. A screenshot of each page is needed.'],
  },
  {
    id: 'p-explain-graph',
    group: 'Settings and the web app',
    title: 'Explain the graph data to a homeowner',
    summary: 'The documents give the sign convention and a few definitions.',
    steps: [
      s('On the grid power line, negative means grid power is being used (purchased). Positive means the system is selling power back to the grid.', [TSM(14)]),
      s('Consumption is the power used by loads in the home. Essential or backup loads are the circuits the Sanctuary powers.', [TSM(97, 98)]),
      s('With "Home Load" enabled the load kWh includes the main panel loads. Disabled, only the loads on the inverter load port are reported.', [SET(35, 36)]),
      s('If the CTs are above the main panel, the system can see the whole home load. Loads upstream of the CTs cannot use battery power on demand while on-grid.', [TSM(9), SET(33)]),
      s('A 90% depth of discharge means the battery is at 10% state of charge.', [SET(14)]),
    ],
    todo: ['How to read each line on the graph, what a normal day looks like, and the author\'s way of explaining it to a homeowner. Needs the author and screenshots.'],
  },
  {
    id: 'p-optimize-battery',
    group: 'Settings and the web app',
    title: 'Optimize battery use from a screenshot of the customer\'s graph',
    summary: 'This needs AI, and this site has no server.',
    blocked:
      'Reading a screenshot and giving advice needs an AI model. This site is a static page with no server and no API key (CLAUDE.md), so it cannot do that safely. Options: a small server or proxy that holds the key (the repo is public, so a key can never be stored in the app), or Claude in a session reading screenshots you paste in. The rules it would follow (reserve percentage, TOU slots, operating mode) are in the "Adjust time of use" and "Operating mode and battery reserve" items.',
    links: [
      { type: 'entry', id: 'ts-operating-modes', label: 'Operating mode and battery reserve' },
    ],
  },

  // ------------------------------------------------------------------ Installation and wiring
  {
    id: 'p-install',
    images: [
      { src: 'images/rev4-wiring-compartment.webp', alt: 'Inside the wiring compartment of a Rev 4 inverter.', caption: 'Rev 4 wiring compartment (author training unit).', sources: [src('author')] },
      { src: 'images/wire-box-cables.webp', alt: 'Cables entering the wire box.', caption: 'Wire box cables (author training unit).', sources: [src('author')] },
    ],
    group: 'Installation and wiring',
    title: 'Install a Sanctuary',
    summary: 'The installation guides are the source. Modules 3, 5, 6 and 7 are planned for it.',
    links: [
      { type: 'module', moduleId: 'dc-wiring-batteries', label: 'Module 4: DC Wiring and Batteries (built)' },
      { type: 'page', to: '/', label: 'Dashboard: Modules 3, 5, 6, 7 are coming soon with outlines' },
    ],
    todo: ['The full install walk-through (location, mounting, AC wiring, CTs, generator, power-up) from the installation guides. Modules 3, 5, 6 and 7 are the place for it.'],
  },
  {
    id: 'p-parallel-battery-cables',
    images: [
      { src: 'images/rev2-p14-lv-dc-multiple-inverters.webp', alt: 'Rev 2 installation guide page 14: low voltage DC wiring with multiple inverters.', caption: 'Rev 2 guide, p.14: multiple inverters.', sources: [src('san2_2', 14)] },
      { src: 'images/rev3-p20-lv-dc-multiple-inverters.webp', alt: 'Rev 3 installation guide page 20: low voltage DC wiring with multiple inverters.', caption: 'Rev 3 guide, p.20: multiple inverters.', sources: [src('san2_3', 20)] },
    ],
    group: 'Installation and wiring',
    title: 'Install battery cables to parallel batteries with two or more inverters',
    summary: 'Covered in Module 4, with the differences for each revision.',
    links: [
      { type: 'lesson', moduleId: 'dc-wiring-batteries', lessonId: 'm4-paralleling', label: 'Lesson: paralleling batteries' },
      { type: 'lesson', moduleId: 'dc-wiring-batteries', lessonId: 'm4-wiring', label: 'Lesson: wiring the batteries' },
      { type: 'lesson', moduleId: 'dc-wiring-batteries', lessonId: 'm4-diagram', label: 'Lesson: the wiring diagram' },
      { type: 'lesson', moduleId: 'dc-wiring-batteries', lessonId: 'm4-revs13-wiring', label: 'Lesson: Revs 1-3 wiring' },
    ],
    steps: [
      s('Parallel inverters must all connect to the same parallel battery bank. The battery banks cannot be separated.', [TSM(8)]),
      s('Any time the loads of two or more inverters are connected in parallel the system is commissioned as a parallel system. If the load ports do not connect together, commission them as separate systems.', [TSM(8)]),
    ],
  },
  {
    id: 'p-battery-cables',
    images: [
      { src: 'images/training-wall.png', alt: 'Two inverters mounted above stacked batteries on a training wall.', caption: 'Training wall: two inverters on batteries (author).', sources: [src('author')] },
    ],
    group: 'Installation and wiring',
    title: 'What size the battery cables are',
    summary: 'One size is in the documents.',
    steps: [
      s('The installation tool list names welding cable, red and black, 1/0 AWG, with spare eyelet ends: 1/0 AWG with a 3/8 inch hole and 1/0 AWG with a 5/16 inch hole.', [TSM(19)]),
      s('Rev 2: a 225A T-fuse on the positive cable between the busbars is recommended and is not provided.', [src('san2_2', 14)], ['rev2']),
    ],
    todo: ['Confirm the cable size and the longest run the installation guides allow, and which end gets which eyelet size.'],
  },
  {
    id: 'p-add-to-system',
    group: 'Installation and wiring',
    title: 'Add onto a system: more batteries or inverters',
    summary: 'From the commissioning table in the Technical Service Manual.',
    steps: [
      s('Add a battery (more than it was commissioned with): recommission.', [TSM(12)]),
      s('Permanently remove a battery: recommission, or go to component > delete, or call ESS support.', [TSM(12)]),
      s('Add or replace an inverter: recommission or call ESS support. Remove an inverter: recommission or call ESS support.', [TSM(12)]),
      s('Recommissioning creates a separate, new product in the system and resets most settings to default, erasing custom configurations. Some settings, such as CT L1 reverse, are not reset. Recommissioning may need ESS support.', [TSM(11)]),
      s('Do not use recommissioning as a troubleshooting process. Unless the problem was the number of inverters or batteries, it is very unlikely to help.', [TSM(11), EMSC(16)]),
      s('The new battery should be within 0.5 V of the batteries already in use before it is paralleled.', [src('manual', 20), TSM(25)]),
    ],
    todo: ['The hands-on order for adding a battery to a running system, from the author or the installation guides.'],
  },
  {
    id: 'p-wiring-code',
    group: 'Installation and wiring',
    title: 'Wire up the electricity correctly and by code for the Sanctuary',
    summary: 'No code-level steps yet.',
    links: [{ type: 'page', to: '/codes', label: 'Codes page (California, Utah, Texas)' }],
    todo: [
      'The wiring steps from the installation guides, and the code requirements the author wants taught. The documents only say each jurisdiction decides which NEC version applies, and that the installer must set the inverter to meet the AHJ (Technical Service Manual p.98, Settings Guide p.10).',
    ],
  },
  {
    id: 'p-grid-load-side',
    group: 'Installation and wiring',
    title: 'Handle and set up the electricity on the grid side and the load side',
    summary: 'Pieces from the Technical Service Manual.',
    steps: [
      s('The load port must never have an external connection to the grid. A transfer (bypass) switch lets the backup loads panel connect to either the grid or the inverter load ports, never both. Lion Energy recommends one so the loads can run on the grid while the Sanctuary is serviced.', [TSM(32)]),
      s('Breaker-interlock bypasses and bypasses made of breakers in separate panels are not allowed. Separate-panel bypasses are prohibited by Lion Energy because the load ports can connect to the grid if the bypass is on while the inverters share a load panel.', [TSM(13)]),
      s('Grid type is set at commissioning: 1 = 120/240 V split phase (standard residential), 2 = US 208 V three phase, 3 = Mexico 127/220, 0 = single phase (not used). It normally should not be changed.', [SET(23)]),
      s('In a parallel system make sure all load combiner breakers and every inverter grid breaker are on, with consistent phasing on both sides.', [TSM(34)]),
      s('The CTs must at least include the current going to the inverter grid port, and the inverter compares the CT current phase with the grid voltage to find the direction.', [TSM(9)]),
    ],
    todo: ['The panel-level wiring steps and diagrams from the installation guides (Modules 5 and 6).'],
  },
  {
    id: 'p-fix-port-wiring',
    images: [
      { src: 'images/rev4-wire-box-cover-diagram.webp', alt: 'The Rev 4 diagram inside the wire box cover.', caption: 'Rev 4 diagram inside the wire box cover, labeled Sanctuary Installation Guide Rev 4.', sources: [src('author')] },
    ],
    group: 'Installation and wiring',
    title: 'Fix incorrect port wiring on the grid and the load',
    summary: 'The alarms tell you which side, then check phasing.',
    steps: [
      s('Load port wiring error in a parallel system: alarm A2_19 (also called EPS protect wiring error). Before turning load power on, the inverter checks that the load voltage from the parent can be read at the child inverters in the correct phase. Check that each inverter\'s load breaker is on in the load combiner panel. It needs a power cycle to clear.', [TSM(84, 85)]),
      s('Grid port wiring error in a parallel system: alarm A2_20. Before connecting to the grid all parallel inverters must read the correct phase on L1 and L2. Check the phasing on the grid ports.', [TSM(85)]),
      s('If any inverter is not consistent in both grid side and load side phases, connecting would cause a direct L1 to L2 short. The wiring alarm stays until the inverter is completely shut down, so power the inverters off and correct the wiring first.', [TSM(34)]),
      s('Three-phase: alarm A2_14 (Grid Phase Error). The line 1 phase should be leading the line 2 phase for each inverter. Power off and correct the wiring before turning the inverter back on.', [TSM(82)]),
      s('An inverter short circuit (F1_3) can be caused by line 1 and line 2 wiring or configuration errors. Check the wiring against the installation manual before powering back on.', [TSM(93, 94)]),
      s('The "Phase Wiring Detection Control" setting enables this check. When the inverters power on, the parent sends voltage to the load port. If a child does not see it or it is out of phase, the inverters shut the load power off and set the load wiring error alarm.', [SET(26)]),
      s('Check the grid type: split phase should read 120 V line to neutral and 240 V line to line. About 208 V line to line with 120 V on each leg is three-phase.', [TSM(34)]),
    ],
    links: [{ type: 'entry', id: 'ts-wont-connect-grid', label: 'The inverter will not connect to the grid' }],
  },
  {
    id: 'p-fix-cts',
    images: [
      { src: 'images/rev4-board-ports.webp', alt: 'Rev 4 control board ports, including the CT1 and CT2 port.', caption: 'Rev 4 board ports: CT1 and CT2 are labeled on the back (author training unit).', sources: [src('author')] },
    ],
    group: 'Installation and wiring',
    title: 'Fix CTs',
    summary: 'Placement, direction, pins and size.',
    links: [{ type: 'entry', id: 'ts-ct-check', label: 'CT check (grid CT problems)' }],
    steps: [
      s('Arrow direction: the arrow should point away from the inverter. If the CTs are on opposite lines, or face the other way, the current reads backwards. A1_12 does not detect improper CT installation, so do not rely on it.', [TSM(9, 74)]),
      s('The support-level settings "CT L1 Reverse" and "CT L1/L2 Swap" have the same effect as flipping the CT arrow or swapping the CTs. "CT L1 Reverse" is not reset by recommissioning.', [SET(35), TSM(11)]),
      s('In a parallel system with CTs at each inverter, disable "Common Grid CT". With it enabled, all inverters use the CT values read by the master inverter.', [TSM(14), SET(33)]),
    ],
    todo: ['A photo of the CT wires spliced to Cat5 and a step-by-step for re-seating a CT.'],
  },
  {
    id: 'p-power-button',
    images: [
      { src: 'images/rev4-left-side-controls.webp', alt: 'Left side of a Rev 4 inverter showing the PV Disconnect rotary switch, the AC/DC button, the Complete System Shutdown button and the antennas.', caption: 'Rev 4 left side: PV Disconnect, AC/DC and Complete System Shutdown (author training unit).', sources: [src('author')] },
    ],
    group: 'Installation and wiring',
    title: 'Fix a bad power button',
    summary: 'The meter tests are done. The replacement steps are not.',
    links: [{ type: 'entry', id: 'ts-power-button-test', label: 'Power button will not turn the inverter on (meter tests)' }],
    steps: [
      s('Before replacing either switch, turn off all power to the inverter: grid, solar and battery.', [TSM(34)]),
      s('On Sanctuary 3 the top button is reached by removing the top panel (the one with the Lion logo and LEDs), and there is a cable between the front panel and the control board. Each button holds three momentary switches.', [TSM(37, 38)]),
    ],
    todo: ['How to replace the buttons on a Sanctuary 2 Rev 4, and the Rev 1-3 power button. The manual shows pictures for Sanctuary 3.'],
  },

  // ------------------------------------------------------------------ Relays and meter tests
  {
    id: 'p-relay-diagnose',
    group: 'Relays and meter tests',
    title: 'Diagnose bad grid and load relays',
    summary: 'Start with the alarms, then test.',
    steps: [
      s('Grid relay alarm F1_7: turn off the grid breaker that feeds the inverter. Measure the grid port voltage L1 to N and L2 to N while the load port is live: it should be zero. 120 V on either line to N while disconnected from the grid means the grid relay is stuck closed.', [TSM(95)]),
      s('If either load line reads 0 V while connected to the grid (the status must be "On Grid"), the grid relay has a bad contact or is open.', [TSM(95)]),
      s('A2_9 (Relay open): if the status is on-grid and one load line gets no power, a relay may be bad. If both load lines get no power, the grid relays may not be closing. On Revs 1-3 this can be old firmware, since one set of grid relays is controlled by the DSP and the other by the ARM.', [TSM(78)]),
      s('A2_18 (Main Load Relay Status) is raised when the load relay should be closed but reads open. F1_8 is an EPS relay fault and F1_12 is a bypass relay fault. For both, power-cycle and contact ESS support if it persists.', [TSM(84, 95, 96)]),
      s('A1_15 (inverter over-current) can be caused by a grid relay stuck closed, and a relay can stick because of over-current.', [TSM(75)]),
      s('A failed IGBT often conducts enough current to make a relay stick closed.', [TSM(51)]),
      s('If the alarm happens when the grid goes down and the inverter restarts five minutes later, the grid relay delay setting may need adjusting (it is 4 ms by default).', [TSM(75), SET(41)]),
    ],
    links: [{ type: 'entry', id: 'ts-fault-f1_7', label: 'F1_7 Grid Relay Fault' }],
  },
  {
    id: 'p-continuity',
    group: 'Relays and meter tests',
    title: 'Run a continuity test on the grid and load relays (Sanctuary 2)',
    summary: 'With the inverter off, each relay should be an open circuit.',
    steps: [
      s('Check volts before you check continuity.', [TSM(45)]),
      s('Remove the lower cover of the inverter. The load relays are on the I/O board: the line 1 load relay is on the left and the line 2 load relay on the right.', [TSM(45)]),
      s('Load relay: measure between the two terminals above each relay. The load relays are off when the inverter is off. If there is continuity between them when it is off, the contacts are welded together (a short circuit).', [TSM(45)]),
      s('Grid relay, line 1: check for zero volts and continuity between the internal bus above the line 1 load relay ("LOAD1 relay in") and the line 1 grid port. Line 2: measure between "LOAD2 relay in" and the grid L2 port. With the grid breakers off you should get an open circuit.', [TSM(45, 46)]),
      s('Rev 4 has the grid and generator ports in a different order on the DIN rail than Rev 3.', [TSM(45)], ['rev4']),
      s('EPS relays: remove the top cover and test between the INV1- and INV2- lines and the terminals above the load relays. When off, INV1- to "LOAD1 relay in" should be open, INV2- to "LOAD2 relay in" should be open, and INVN- to LOAD N or GEN N should be open.', [TSM(47)]),
      s('Generator relays: test between the generator port and the terminals above the load relays. When off, GEN L1 to "LOAD1 relay in" and GEN L2 to "LOAD2 relay in" should be open.', [TSM(48)]),
    ],
    todo: ['The manual\'s photos of the test points (pp.45-47) are not copied in yet.'],
  },

  // ------------------------------------------------------------------ Battery
  {
    id: 'p-battery-recover',
    group: 'Battery',
    title: 'Wake up a battery that will not connect',
    summary: 'Covered by a troubleshooting entry and Module 4.',
    links: [
      { type: 'entry', id: 'ts-battery-wont-address', label: 'A battery will not address, or reads 0 V' },
      { type: 'lesson', moduleId: 'dc-wiring-batteries', lessonId: 'm4-dead-battery', label: 'Lesson: a battery that will not wake up' },
    ],
  },
  {
    id: 'p-drifted-cell',
    group: 'Battery',
    title: 'Recover a drifted cell on a battery',
    summary: 'What the Technical Service Manual gives for one low or out-of-balance cell.',
    steps: [
      s('If a cell voltage is too low it can be charged with a DC power supply set to no more than 3.65 V open circuit. Most 60V supplies can deliver 5 A.', [TSM(26)]),
      s('Do not overcharge one cell. If one cell is charged too high, it can reduce the amp-hours of the pack because that cell becomes the highest and stops the rest from charging at 3.65 V.', [TSM(26)]),
      s('Connect the supply positive to the cell positive and the supply negative to the cell negative. When the cell matches the rest of the pack, see whether the BMS wakes up when charging from the battery terminals on top.', [TSM(26, 27)]),
      s('A maximum-to-minimum cell difference over 700 mV (1000 mV on some batteries) may disable both charging and discharging.', [TSM(26)]),
      s('If any cell is below 1400 mV the battery needs to be replaced (B1_2).', [TSM(86)]),
      s('If all cells measure near 3.3 V but the whole pack reads about 49 V, it does not add up: check the cell busbars for broken welds (B1_10).', [TSM(88)]),
      s('Check the voltage tap wires for loose connections (B1_10) and the temperature sensor connections (B1_12; a good sensor reads roughly 5k to 20k ohms).', [TSM(87, 88)]),
    ],
    links: [{ type: 'entry', id: 'ts-fault-b1_17', label: 'B1_17 BMS - Cell Unbalance' }],
    todo: [
      'What the author means by a "drifted" cell: cell imbalance, or the state-of-charge drift that the communicator can reset (Settings Guide p.39, support-level settings). The author\'s own procedure is needed.',
    ],
  },
  {
    id: 'p-mosfet-test',
    group: 'Battery',
    title: 'Test the BMS MOSFETs',
    summary: 'When the battery breaker keeps tripping or the MOSFETs overheat.',
    steps: [
      s('Turn off the battery\'s circuit breaker.', [TSM(27)]),
      s('Unplug the cell temperature sensor plug from the BMS. The battery then reads -50 C on both cell temperature sensors, which disables charging and discharging.', [TSM(27)]),
      s('Set the meter to diode check and measure across the BMS power terminals: one probe on the BMS side of the circuit breaker and the other on the negative cell terminal at the top of the cells. The meter should read "OL". Swap the probes and it should read "OL" again.', [TSM(27)]),
      s('If it reads a forward-biased diode voltage drop in either direction, a MOSFET is damaged and the BMS needs to be replaced.', [TSM(27)]),
      s('Plug the cell temperature sensors back in. Turn the battery breaker back on if the test passes.', [TSM(27)]),
    ],
  },

  // ------------------------------------------------------------------ Solar
  {
    id: 'p-gfci',
    group: 'Solar',
    title: 'Diagnose a GFCI alert for solar',
    summary: 'A1_10 and F1_9, with the field notes and the ground-current method.',
    links: [
      { type: 'entry', id: 'ts-gfci-solar', label: 'Grounded solar: GFCI alert' },
      { type: 'entry', id: 'ts-fault-a1_10', label: 'A1_10 Leakage Current (GFCI Fault)' },
      { type: 'lesson', moduleId: 'dc-wiring-batteries', lessonId: 'm4-leakage', label: 'Lesson: the PV-to-ground leakage test' },
    ],
  },
  {
    id: 'p-string-down',
    images: [
      { src: 'images/rev2-p16-hv-dc-pv-wiring.webp', alt: 'Rev 2 guide page 16: high voltage DC PV wiring.', caption: 'Rev 2 guide, p.16: PV wiring.', sources: [src('san2_2', 16)] },
      { src: 'images/rev3-p22-hv-dc-pv-wiring.webp', alt: 'Rev 3 guide page 22: high voltage DC PV wiring.', caption: 'Rev 3 guide, p.22: PV wiring.', sources: [src('san2_3', 22)] },
    ],
    group: 'Solar',
    title: 'Fix a solar string that is no longer producing',
    summary: 'A checklist built from the alarm table and the solar sections.',
    steps: [
      s('Check the PV Disconnect (the DC switch on Revs 1-3). It controls whether the inverter accepts solar.', [src('manual', 10), AUTHOR]),
      s('The MPPT needs at least 120 V DC to start and must never see more than 500 V open circuit. In cold weather the string voltage rises. Check the PV voltage history for each string in the web app: if any string went over 500 V (A1_14, A2_21), shorten the string.', [TSM(61, 74, 85)]),
      s('Polarity: about -1 V from PV1+ to PV1- means the PV lines are reversed.', [TSM(63)]),
      s('Ground leakage: the inverter shuts down when ground current is detected, often during or after rain. Check panels for cracked glass, condensation or water spots. Rev 4 and Sanctuary 3 have fuses on the MPPT inputs, and a large leakage can blow one.', [TSM(63, 72)]),
      s('Arc fault (A2_15): the arc detector sits above the PV connections. It shuts solar down to prevent fire and does not clear by itself. Check PV panels and wiring for damaged connectors, then restart.', [TSM(82)]),
      s('PV miswiring (A2_12): a PV- terminal connected to ground. Never turn on the DC solar switch with a solar to ground short.', [TSM(81)]),
      s('Low PV insulation impedance (F1_5): check the panels and wiring for leakage to ground.', [TSM(94)]),
      s('Rapid shutdown: the Sanctuary has no RSD transmitters. If the panels have MLPE, the right transmitter must be installed or the MLPE shuts the panels off.', [TSM(64)]),
      s('Check the Solar Input Type setting. "Independent" is normal. Dual MPPT is only for one string connected to both MPPT1 and 2 and another to both MPPT3 and 4.', [SET(32)]),
      s('Grid over-voltage reduces how much the inverter may sell back, and if sell-back is disabled solar drops to what the loads need after the battery is full.', [TSM(65)]),
    ],
    links: [{ type: 'entry', id: 'ts-no-solar', label: 'Solar is not being used' }],
    todo: ['The author\'s own order of checks for a string that stopped producing.'],
  },
  {
    id: 'p-tigo',
    group: 'Solar',
    title: 'How Tigo solar optimizers and CCAs work',
    summary: 'From Tigo\'s installation manual (read in full) plus Tigo support articles reported by Claude.ai research. Not Lion material.',
    steps: [
      s('A Tigo TS4 is module-level power electronics (MLPE), one per panel. TS4-A-M monitors, TS4-A-S monitors and provides rapid shutdown, and TS4-A-O monitors, provides rapid shutdown and optimizes. They use the Tigo Access Point (TAP) and the Cloud Connect Advanced (CCA) to talk to inverters and the cloud. TS4-A-O units used only to optimize do not need a TAP or CCA.', [TIGO_MAN]),
      s('The TAP talks wirelessly to the TS4s and connects to the CCA with a 4-wire cable such as shielded RS-485. One TAP handles up to 300 TS4s and one CCA up to seven TAPs and 900 TS4s. A TAP reaches TS4s within 10 m (33 ft) directly, and up to 35 m (115 ft) through relays.', [TIGO_MAN]),
      s('Rapid shutdown: the CCA must be on the same AC branch circuit as the inverter it controls, and the initiator must turn off power to the CCA. Reported by Tigo support: the TAP sends a keep-alive, and when the CCA loses power it stops and the TS4s shut down (output under 80 V within 30 seconds). For TS4-X and TS4-A 725W units an inverter-integrated transmitter may keep the signal going, so "CCA off" does not always mean "array off".', [TIGO_MAN, web('Intro to Tigo TS4-A-O/S/M (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/211807027-Intro-to-Tigo-TS4-A-O-S-M-Monitoring-Group'), web('Multi Factor Rapid Shutdown Overview (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/44983309634195')]),
      s('Before working on a TS4: turn off the CCA and the inverter (or use the rapid shutdown initiator), wait 30 seconds, and disconnect the TS4 output cables before the input cables. Always assume TS4 units are on. Do not connect or disconnect them under load.', [TIGO_MAN]),
      s('When connecting a TS4, connect the shorter input leads to the PV module first, then the longer output cable to the next TS4. Doing it the other way can damage the TS4.', [TIGO_MAN]),
      s('The CCA light: solid green is OK, solid yellow is a warning (scanning incomplete or no connection to the Tigo server), solid red is an error (cannot find all TS4s or cannot reach the Tigo server), blinking red/yellow is automatic PV-Off.', [TIGO_MAN]),
      s('If the CCA does not see the TAP: in the EI app run CCA Configuration > Settings > TAP TEST. Measure 24 VDC at the CCA Gateway/TAP terminal (under 12 V means power off, remove the TAP connector, power on, wait 2 minutes, re-measure). Check wire colors at both ends and put one 120 ohm resistor on the last TAP. This is reported by Claude.ai research and not opened here.', [web('CCA - TAP Test (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/360059913673-CCA-TAP-Test')]),
      s('If TS4s do not appear: discovery normally takes under 60 minutes on a home system. Wait 2 hours after sunrise before calling. Check that the TAP count matches what was entered, the modules are in the sun, and the serial numbers in Layout are right. After a TS4 replacement, update the new serial number in the EI Portal. This is reported by Claude.ai research and not opened here.', [web('System Discovery (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/1500002619981')]),
      s('Commissioning is done in the Tigo Energy Intelligence (EI) mobile app or at ei.tigoenergy.com.', [TIGO_MAN]),
      s('On the Sanctuary side: the Sanctuary has no rapid shutdown transmitter, optimizers and rapid shutdown devices are both MLPE, and the "PV Optimizer" setting is harmless when left enabled with no optimizers.', [TSM(64, 98), SET(37)]),
    ],
    todo: [
      'The Tigo support articles could not be opened from here (error 403). Open the linked pages before teaching the steps marked "reported by Claude.ai research".',
      'How a Tigo system is wired next to a Sanctuary (where the CCA gets its power, and what happens to the keep-alive when the Sanctuary is off-grid). Needs the author.',
    ],
  },

  // ------------------------------------------------------------------ Generator and AC solar
  {
    id: 'p-generator-setup',
    group: 'Generator and AC solar',
    title: 'Set up a generator',
    summary: 'The settings, from the Settings Guide and the Technical Service Manual.',
    steps: [
      s('The Sanctuary will not accept generator power while it is connected to the grid. When it uses the generator, the generator connects internally to the load port, and voltage and frequency come from the generator. In a parallel system the generator must be connected to each inverter.', [TSM(66)]),
      s('Generator Input: enabled allows generator use while the grid is down. Disabled, the inverter will not use any generator power.', [SET(27)]),
      s('Auto Start: enabled sends the two-wire start signal to the generator when conditions are met, and the inverter only accepts generator power when it is calling for it. Disabled, the generator must be started manually and the inverter accepts its power when off-grid.', [SET(30)]),
      s('Start Percent: when off-grid and the battery SoC falls to this level, the inverter starts the generator (auto-start). Stop Percent: when the battery reaches it, the inverter stops the generator. Other stop conditions can stop it sooner.', [SET(27)]),
      s('Generator Power: the maximum continuous power the inverter may draw. Set it a little below the generator\'s maximum continuous rating, not the advertised peak rating.', [SET(28)]),
      s('Battery Charge Current: a starting point is about half of the generator\'s continuous rating. For an 8000 W generator that is 4000 W / 51.8 V, about 77 A. A lower Generator Power takes precedence. Solar does not add to the charge current while the generator is on.', [SET(27)]),
      s('Charge from Generator: Lion Energy recommends enabling it. It is more efficient to charge from the generator than to run it at low power for a long time.', [SET(29)]),
      s('Generator Warmup Time (default 60 s) is the delay between starting the generator and the inverter connecting. Operating Time is the longest continuous run. Cooling Time is how long before it may auto-start again.', [SET(27, 28)]),
      s('The inverter accepts generator power when the generator voltage and frequency are inside the window set in the settings. Outside it, it disconnects or will not connect.', [TSM(66)]),
      s('Generator as Grid Input is for off-grid installs. The generator connects to the grid port, the generator port is not used, and the inverter can dark-start from the generator. The grid port also supports more current.', [SET(30), TSM(66, 67)]),
      s('The AC Port setting chooses whether the generator port is used for AC solar or for the generator.', [SET(30)]),
    ],
    todo: ['The generator wiring and the two-wire start connection from the installation guides, and the author\'s setup order.'],
  },
  {
    id: 'p-generator-trouble',
    group: 'Generator and AC solar',
    title: 'Troubleshoot a generator that no longer starts from the inverter or turns off',
    summary: 'From the generator section and the generator settings.',
    steps: [
      s('Generator will not start with auto-start: measure the voltage on the two-wire start wires. If it reads 0 V, either the inverter\'s generator relay is on or the generator is not ready to run.', [TSM(66)]),
      s('Unplug the two-wire start wires from the inverter and measure continuity on the Sanctuary\'s dry-contact relay. Also measure the voltage on the start wires from the generator. If it reads 0 V, the generator is not ready to run.', [TSM(66)]),
      s('Generator keeps running after the inverter turns the start signal off: check the voltage on the two-wire start terminals, then unplug the start wire from the inverter. If that shuts the generator off, the TVS diode may be leaking enough current to signal a start. The TVS diode was removed in later Sanctuary 2 Rev 4 and Sanctuary 3 inverters.', [TSM(66)]),
      s('Generator turns off on its own: the Generator Stop Duty Cycle Percentage turns it off if the load stays below that fraction of the generator rating for the Stop Buffer Time (default 5 minutes). It stays off for the Start Buffer Time (default 30 minutes). This avoids running a generator at low power.', [SET(28, 29)]),
      s('Other reasons it stops: the Stop Percent was reached, the maximum Operating Time was reached, Charge Priority SOC with solar present, or the generator voltage or frequency left the allowed window.', [SET(27, 28)]),
      s('The inverter ignores a generator that was started manually after auto-start until the inverter calls for it. While the generator is connected, the status reads on-grid.', [AUTHOR]),
      s('A1_8 with a generator: check the generator frequency settings or reduce the battery charge current from the generator.', [TSM(71)]),
      s('The inverter will not accept generator power while it is connected to the grid.', [TSM(66)]),
    ],
    links: [{ type: 'entry', id: 'ts-generator-manual', label: 'Generator started manually after auto-start' }],
  },
  {
    id: 'p-acsolar',
    group: 'Generator and AC solar',
    title: 'Set up AC solar',
    summary: 'AC solar connects to the generator port.',
    steps: [
      s('The Sanctuary can accept another solar inverter\'s 240 V AC output at the generator port. That solar inverter must be grid-following (it can connect to the grid). Off-grid inverters cannot be used. The utility\'s DER settings should already be programmed into the AC solar inverter.', [TSM(65)]),
      s('If the generator port measures 240 V AC it is ready to accept AC solar. If the AC solar inverter is not sending power, the problem is on its side. Its DER settings usually include a five-minute delay after it connects to the grid, on top of the Sanctuary\'s own connect time.', [TSM(65)]),
      s('Set the AC Port setting to "generator port". The configuration with AC solar connected to the load port is not supported.', [SET(30)]),
      s('AC Coupled Solar Battery Charge Disable SoC (default 85%): when off-grid on AC solar, the inverter turns the generator port off at this level so the solar does not push power the full battery cannot take, and turns it on again 10% lower.', [SET(30, 31)]),
      s('The inverter reduces AC solar power by raising the frequency. AC Coupled Solar Response Coefficient (default 60) is how quickly it adjusts (lower is faster). AC Coupled Solar Trip Frequency (default 65 Hz) is where it turns the generator port off.', [SET(31)]),
      s('"Power Frequency Response" needs to be enabled for AC solar. It is a Lion Energy access-level setting, so it is set by support.', [SET(33, 34)]),
      s('The inverter can only limit sell-back from DC solar and the battery. It cannot limit AC solar sell-back, and disabling grid selling does not disable AC solar on the generator port.', [SET(21, 25)]),
      s('Time of use: if grid charging is disabled in a slot, the Sanctuary will not charge from the grid or from other solar connected to the home. Leave grid charge enabled to charge from AC solar.', [SET(22, 23)]),
      s('Sanctuary 2 Revs 1 and 2 have no internal CT on the generator port, so AC solar power is not tracked. Later revisions track it.', [TSM(65)], ['rev1', 'rev2']),
    ],
    todo: ['The AC solar wiring and the author\'s setup order.'],
  },

  // ------------------------------------------------------------------ Service
  {
    id: 'p-rma',
    group: 'Service',
    title: 'What to do if an inverter fails, and how to RMA it',
    summary: 'No source yet for the RMA process.',
    steps: [
      s('Installers are encouraged to contact ESS support when they need more help troubleshooting. ESS Support: (435) 244-3352, Monday to Friday, 8:00 AM to 5:00 PM Mountain Time.', [TSM(100), EMSC(16)]),
      s('If any IGBT fails the diode and continuity tests, the inverter needs to be replaced.', [TSM(51)]),
    ],
    todo: ['The RMA steps: what to collect, who approves it, the forms and the shipping. Needs the author or the Confluence page.'],
  },

  // ------------------------------------------------------------------ Learning
  {
    id: 'p-how-sanctuary',
    images: [
      { src: 'images/training-wall.png', alt: 'Two inverters mounted above stacked batteries on a training wall.', caption: 'Training wall (author).', sources: [src('author')] },
      { src: 'images/rev4-front-lights.webp', alt: 'Front of a Rev 4 inverter showing the Lion logo panel and the lights window.', caption: 'Rev 4 front: the lights are in the small window below the Lion logo.', sources: [src('author')] },
    ],
    group: 'Learning',
    title: 'How the Sanctuary works',
    summary: 'The architecture, from the Technical Service Manual.',
    steps: [
      s('The main parts of the inverter are a controller, a bidirectional inverter, a bidirectional DC-DC converter, MPPT converters and relays.', [TSM(17)]),
      s('Off-grid, the inverter works in grid-forming mode: it sets the output voltage and frequency, and the AC output power is set by the loads.', [TSM(17)]),
      s('Connected to the grid, it works in grid-following mode: the grid sets the voltage and frequency and the inverter either adds power to the grid or draws power from it. It also runs in grid-following mode when connected to a generator.', [TSM(17)]),
      s('In normal operation the load port turns on from battery power before the Sanctuary connects to the grid.', [TSM(10)]),
      s('The two processors: the DSP handles the waveforms and switching the IGBTs. The ARM handles the relays, power switch, USB, RS-485 and the front panel LEDs.', [TSM(55)]),
      s('Normal mode (the default) is "Limit Grid Consumption" (also called SBU, solar-battery-utility): solar covers loads first, extra solar charges the battery, then battery power is used down to the target SoC, then the grid.', [SET(20)]),
      s('The CTs sit apart from the inverter so it can see loads between the CTs and its grid port and supply non-backed-up loads, which lowers the utility bill.', [TSM(9)]),
      s('Each Sanctuary 2 battery is sixteen 3.2 V LiFePO4 cells in series, 51.2 V nominal, with a BMS that watches cell voltage, current and temperature and can disable charging or discharging.', [TSM(20), TSM(97)]),
    ],
  },
  {
    id: 'p-multimeter',
    group: 'Learning',
    title: 'How a multimeter works',
    summary: 'No source yet.',
    todo: [
      'A source for a multimeter lesson: reading volts and amps, continuity, diode check and clamp meters. The Technical Service Manual only uses them in tests (clamp-on AC and DC meter on the tool list, diode check in the IGBT and MOSFET tests, "check volts before continuity").',
    ],
  },
  {
    id: 'p-registers',
    group: 'Learning',
    title: 'What registers are, and how to use them for troubleshooting',
    summary: 'Needs a decision before anything is published.',
    todo: [
      'Decision needed: the repo and the site are public. Earlier you asked that register addresses and register-read procedures stay out (internal). A general explanation (a register is a numbered setting or reading the inverter exposes over RS-485 or USB, and the communicator reads and writes them) can go in. Tell Claude whether that is enough, or whether register-level content may be published.',
      'Then the source: the Settings Guide and the Technical Service Manual describe settings by name and range, not by address.',
    ],
  },
  {
    id: 'p-alerts-lesson',
    group: 'Learning',
    title: 'Lesson: remembering the alerts and the basic registers',
    summary: 'How the alert codes are grouped, from the table.',
    steps: [
      s('In general, an alarm means the system has limited capability, and a fault means the system shut down to protect itself. If it does not clear after the cause is fixed, power-cycle the inverter(s).', [TSM(67)]),
      s('Reading the table: A1_ and A2_ are the main alarms (battery, grid, solar and inverter), B1_ and B4_ are battery (BMS) alarms, E1_ and E3_ are the communicator (EMS-C or WCM), and F1_ are faults. This grouping is read from the table.', [TSM(67, 85, 91, 93)]),
      s('A2_11 (BMS Communication Failure) is the most common alarm. If it is showing, work on it first: it could clear other alarms.', [TSM(79)]),
      s('The grid alarms A1_6 to A1_9 appear every time the inverter reconnects to the grid, because it waits for the grid voltage and frequency to be inside the reconnect window.', [TSM(70, 71, 72)]),
      s('A2_12, A2_19 and F1_13 need a power cycle to clear. A grid port or load port wiring error alarm also needs one.', [TSM(71, 81, 84, 96)]),
    ],
    links: [{ type: 'page', to: '/reference', label: 'Reference page: every code with its steps' }],
    todo: ['The author\'s list of the alerts seen most often, and the registers part (see the registers item).'],
  },
  {
    id: 'p-page-electricity',
    group: 'Learning',
    title: 'Everything about electricity that is relevant to ESS',
    summary: 'Its own page: the Lion glossary plus basic theory from the web.',
    links: [{ type: 'page', to: '/electricity', label: 'Electricity page' }],
    todo: ['A source for the electrical theory the author wants covered (see the page for the list).'],
  },
  {
    id: 'p-page-codes',
    group: 'Learning',
    title: 'Codes for California, Utah and Texas that matter for the Sanctuary and solar',
    summary: 'Its own page, with links to the official sites.',
    links: [{ type: 'page', to: '/codes', label: 'Codes page' }],
    todo: ['The specific code requirements for each state, from the author or Confluence.'],
  },
  {
    id: 'p-page-solar',
    group: 'Learning',
    title: 'Everything about solar panels',
    summary: 'Its own page, built from the manuals so far.',
    links: [{ type: 'page', to: '/solar', label: 'Solar panels page' }],
    todo: ['A source for panel theory the author wants covered (see the page for the list).'],
  },
  {
    id: 'p-page-competitors',
    group: 'Learning',
    title: 'Competitors\' solar systems',
    summary: 'Its own page. Nothing in the sources yet.',
    links: [{ type: 'page', to: '/competitors', label: 'Competitors page' }],
    todo: ['Everything. Competitor information has to come from the author or Confluence, not from general knowledge.'],
  },

  // ------------------------------------------------------------------ Also in the manuals
  {
    id: 'p-power-on-off',
    group: 'Also in the manuals',
    title: 'Power on and completely shut down the Sanctuary (Rev 4)',
    summary: 'Not on your list, but it is in the Technical Service Manual.',
    steps: [
      s('Power on, step 1: turn the batteries on. On Sanctuary 2, plug in the power cables on each battery within 20 seconds of the previous battery. Then on each battery unplug one power cable for 10 seconds and plug it back in. This re-enables any battery that disabled itself on an over-current alarm.', [TSM(10)]),
      s('Step 2: turn on Complete System Shutdown so the button is recessed. Step 3: turn the PV switch clockwise to horizontal (on). Step 4: turn on the circuit breaker that feeds the grid port. Step 5: slide the EMS-C power switch up. Step 6: turn on AC/DC so the button is recessed.', [TSM(10)], ['rev4']),
      s('Completely shut down, on each inverter: PV switch off (counter-clockwise to vertical), AC/DC off (button out, flush), EMS-C power switch down, Complete System Shutdown off (button out), grid port breaker off. If a manual transfer switch is installed, first move it to the grid position.', [TSM(10)], ['rev4']),
      s('If the Sanctuary will be off for more than a month, charge each battery to at least 50% first. To de-energize the inverter battery port on Sanctuary 2, unplug the positive or negative battery cable from each battery.', [TSM(10)]),
    ],
  },
  {
    id: 'p-post-commissioning',
    group: 'Also in the manuals',
    title: 'Post-commissioning checklist',
    summary: 'What the installer checks after commissioning.',
    steps: [
      s('Alarm check: are any alarms reported? Are the green lights on the front panels solid? A flashing green LED means an active alarm or standby (button off). Check the web app.', [TSM(13)]),
      s('Is the communicator connected to the homeowner\'s Wi-Fi and not to a mobile hotspot? Is data uploading and visible on smart.lionenergy.com?', [TSM(13)]),
      s('Is grid power on for every inverter? Use the compare tool to check each inverter\'s grid voltage for L1 and L2.', [TSM(13)]),
      s('Is load power on for every inverter? Turn on loads, at least 1000 W per inverter if possible, and use the compare tool to check each inverter sends power to the load ports.', [TSM(13)]),
      s('Verify there is no way for the customer to connect grid power to the load ports by breakers or switches. Bypass configurations made of separate-panel breakers are prohibited.', [TSM(13)]),
      s('Make sure all batteries conduct power. If not, check the battery breakers. If solar is not charging or loads are not discharging the batteries, temporarily use emergency mode to charge from the grid and check that all batteries charge.', [TSM(13)]),
      s('Solar: every string can produce more than 120 V in daylight, and the cold-weather Voc calculation shows no string over 500 V open circuit.', [TSM(13)]),
      s('CT check: are the CTs configured correctly? With CTs at each inverter in a parallel system, disable "Common Grid CT". On the graph, negative grid power is purchased and positive is sold back.', [TSM(13, 14)]),
      s('Time-of-use setup if the customer has peak billing hours, and shared access with the customer\'s email.', [TSM(14)]),
    ],
  },
  {
    id: 'p-commission',
    images: [
      { src: 'images/rev4-board-ports.webp', alt: 'Rev 4 control board ports: Parallel A and BMS COMM, Parallel B and WIFI PORT.', caption: 'Rev 4 board ports used during commissioning (author training unit).', sources: [src('author')] },
    ],
    group: 'Also in the manuals',
    title: 'Commission a Rev 4 system with an EMS-C (video)',
    summary: 'The walk-through from the commissioning video.',
    steps: [
      s('Choose the total number of inverters and batteries. The app checks spacing, asks whether a WCM or an EMS-C is installed, and asks about split phase and "advanced".', [VIDEO]),
      s('Antennas: confirm they are installed and that the cellular and Bluetooth/Wi-Fi antennas match their labels. If there are connectivity problems, check these first.', [VIDEO]),
      s('Both power buttons must be on, not just one.', [VIDEO]),
      s('Power on the EMS-C with its switch (a blue light appears under "power"). The app finds it over Bluetooth, then you connect it to Wi-Fi with the password. This can take several tries. The app then installs EMS-C updates.', [VIDEO]),
      s('The EMS-C connects to the inverter WiFi port (back middle).', [VIDEO]),
      s('Address the batteries: plug the Ethernet cable from the EMS-C battery port into battery 1 and address it, then battery 2. Then move the EMS-C cable to the BMS COM port and run another Ethernet cable from battery 1 to battery 2. Check that the addressing cable is removed, battery 1 is on the BMS port and all batteries are linked.', [VIDEO]),
      s('Power sources: grid, AC solar and generator as the customer has them, breaker size (ask the installer), sell back to grid, the SoC at which AC solar stops charging, emergency mode, the CT rating read from the CTs themselves, and the battery reserve (30% is typically recommended, a customer preference).', [VIDEO, AUTHOR]),
      s('Confirm the product, enter customer info and the installer name. CTs are checked by hand when the installers arrive.', [VIDEO]),
    ],
    todo: ['Timestamps and screenshots from the video, and the same flow for Revs 1-3 with a WCM.'],
  },
  {
    id: 'p-igbt-test',
    group: 'Also in the manuals',
    title: 'Check the IGBTs before applying power (Sanctuary 2)',
    summary: 'If an IGBT fails, the inverter needs to be replaced.',
    steps: [
      s('If an IGBT fails it often conducts enough current to make a relay stick closed, and the soft-start resistors and wiring may be damaged. Run these checks before applying power if you suspect a damaged IGBT. If any IGBT fails, the inverter needs to be replaced.', [TSM(51)]),
      s('All sources of power must be disconnected from the inverter for these tests.', [TSM(53, 54)]),
      s('Battery IGBT: with the battery disconnected and the terminal near 0 V, use the meter diode function between Batt+ and Batt-. In both directions it rises slowly to about 0.8 to 1 V and holds, which takes a couple of minutes. A 10 V supply on the battery terminals should draw under a milliamp once the capacitors charge.', [TSM(53)]),
      s('MPPT IGBT: with the meter positive on BUS1- or BUS2- and the negative on each BOOST+ terminal, it should read about 0.35 to 0.5 V. Reverse the meter and it should slowly charge the capacitors up to OL.', [TSM(53, 54)]),
      s('MPPT diodes: diode check between each BOOST+ and BUS+. Positive on BOOST+ reads about 0.37 V and negative reads OL.', [TSM(54)]),
      s('Inverter IGBTs: between INV2- and INVN-, and between INV1- and INVN-, check both ways. It should rise slowly to OL with no diode voltage either way.', [TSM(54)]),
    ],
    todo: ['The manual\'s photos of the test points (pp.51-52).'],
  },
  {
    id: 'p-loads-off',
    group: 'Also in the manuals',
    title: 'Load power is off',
    summary: 'The usual reasons, in the Technical Service Manual.',
    links: [{ type: 'entry', id: 'ts-loads-off', label: 'The loads are off (troubleshooting entry)' }],
    steps: [
      s('If the backup panel stays unpowered during a grid outage, check the bypass (transfer) switch position. It may need to be on the inverter position.', [TSM(32)]),
      s('Off-grid, the inverter shuts the load port off at 10% battery. It keeps the control board on so the rapid shutdown transmitter gets 12V and solar can charge. Load power returns at 20%.', [TSM(32)]),
      s('A remote shutdown switch is in series with the AC/DC button. If either is open, the load port shuts off and the 12V to the rapid shutdown transmitter turns off.', [TSM(32)]),
      s('Off-grid with a BMS communication failure, the Sanctuary will not charge the batteries or run the AC inverter from them, so the load port has no power.', [TSM(32)]),
    ],
  },
]
