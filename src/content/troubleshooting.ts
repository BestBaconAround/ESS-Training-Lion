import { FAULT_CODES, FAULT_FOOTNOTE } from './data/faults'
import { src } from './helpers'
import type { RevisionTag, SourceRef } from './types'

// Reference page for support calls. Every step carries a source and a revision tag; anything not in a source is a TODO.

export type TroubleshootingArea = 'general' | 'battery' | 'inverter' | 'power'

export const AREA_LABELS: Record<TroubleshootingArea, string> = {
  general: 'First call',
  battery: 'Battery',
  inverter: 'Inverter',
  power: 'Power',
}

export interface TroubleshootingStep {
  text: string
  sources: SourceRef[]
  revisions: RevisionTag
}

export interface TroubleshootingEntry {
  /** Stable. Never rename or reuse. */
  id: string
  area: TroubleshootingArea
  title: string
  /** What the customer might say. */
  customerSays?: string
  /** What the code means, for fault-code entries. */
  description?: string
  faultCode?: string
  steps: TroubleshootingStep[]
  /** False when the items are a checklist, not a sequence. Default true. */
  ordered?: boolean
  /** Lessons that teach the background. */
  related?: { moduleId: string; lessonId: string }[]
  /** Visible gaps. Never guess. */
  todo?: string[]
}

const AUTHOR = src('author')
const NOTES = src('notes')
const TSM = (...pages: number[]) => src('tsm', ...pages)
const SETTINGS = (...pages: number[]) => src('settings', ...pages)
const step = (text: string, sources: SourceRef[], revisions: RevisionTag = 'all'): TroubleshootingStep => ({ text, sources, revisions })

/** Where support goes when a problem cannot be fixed on the call. */
export const ESCALATION = {
  text: 'ESS Support: (435) 244-3352, Monday-Friday 8:00 AM-5:00 PM Mountain Time. Troubleshooting resources: info.lionenergy.com and lionenergy.com/pages/installers.',
  sources: [src('emsc', 16)],
  rule: FAULT_FOOTNOTE,
  ruleSources: [src('san2_2', 35)],
}

/** Navigation only: which area a fault code is listed under. Every code must appear exactly once. */
export const FAULT_AREA: Record<string, TroubleshootingArea> = {
  A1_0: 'power',
  A1_1: 'power',
  A1_2: 'battery',
  A1_3: 'battery',
  A1_4: 'battery',
  A1_5: 'battery',
  A1_6: 'power',
  A1_7: 'power',
  A1_8: 'power',
  A1_9: 'power',
  A1_10: 'power',
  A1_11: 'inverter',
  A1_12: 'inverter',
  A1_13: 'inverter',
  A1_14: 'power',
  A1_15: 'power',
  A1_22: 'inverter',
  A1_23: 'inverter',
  A2_0: 'battery',
  A2_1: 'inverter',
  A2_2: 'inverter',
  A2_3: 'inverter',
  A2_4: 'inverter',
  A2_5: 'inverter',
  A2_6: 'battery',
  A2_7: 'battery',
  A2_8: 'battery',
  A2_9: 'inverter',
  A2_10: 'battery',
  A2_11: 'battery',
  A2_12: 'power',
  A2_13: 'power',
  A2_14: 'power',
  A2_15: 'power',
  A2_16: 'battery',
  A2_17: 'battery',
  A2_18: 'inverter',
  A2_19: 'power',
  A2_20: 'power',
  A2_21: 'power',
  B1_1: 'battery',
  B1_2: 'battery',
  B1_3: 'battery',
  B1_4: 'battery',
  B1_5: 'battery',
  B1_7: 'battery',
  B1_8: 'battery',
  B1_9: 'battery',
  B1_10: 'battery',
  B1_11: 'battery',
  B1_12: 'battery',
  B1_13: 'battery',
  B1_14: 'battery',
  B1_15: 'battery',
  B1_16: 'battery',
  B1_17: 'battery',
  B1_18: 'battery',
  B1_19: 'battery',
  B1_20: 'battery',
  B1_21: 'battery',
  B1_22: 'battery',
  B1_23: 'battery',
  B1_24: 'battery',
  B1_25: 'battery',
  B4_24: 'battery',
  B4_25: 'battery',
  B4_26: 'battery',
  B4_27: 'battery',
  E1_1: 'inverter',
  E3_2: 'inverter',
  E3_3: 'inverter',
  F1_0: 'inverter',
  F1_1: 'inverter',
  F1_2: 'inverter',
  F1_3: 'inverter',
  F1_4: 'inverter',
  F1_5: 'power',
  F1_6: 'power',
  F1_7: 'power',
  F1_8: 'power',
  F1_9: 'power',
  F1_10: 'inverter',
  F1_11: 'inverter',
  F1_12: 'power',
  F1_13: 'inverter',
  F1_14: 'inverter',
  F1_15: 'inverter',
  F1_21: 'inverter',
}

const guided: TroubleshootingEntry[] = [
  // ------------------------------------------------------------------ first call
  {
    id: 'ts-first-call',
    area: 'general',
    title: 'First call approach',
    ordered: false,
    steps: [
      step('Is the concern intermittent or consistent?', [NOTES]),
      step('Grab the system name and view the graph and alerts.', [NOTES]),
      step('The alert or fault is what to focus your plan of attack on.', [NOTES]),
      step('What is the reason for the call, and what is the concern?', [NOTES]),
      step('Check that all batteries are working.', [NOTES]),
      step('Are they certified to work on Lion Energy Sanctuary systems, or are they the homeowner\'s?', [NOTES]),
      step('Check solar and make sure all strings are producing.', [NOTES]),
    ],
    todo: ['Confirm the order, and whether "they" in the certified-or-homeowner question means the batteries or the caller.'],
  },
  {
    id: 'ts-remote-precheck',
    area: 'general',
    title: 'Precheck before troubleshooting a system remotely',
    ordered: false,
    steps: [
      step('Look at the alerts and the alert history.', [NOTES]),
      step('Look at the battery voltages on every inverter.', [NOTES]),
      step('Look at all the solar strings.', [NOTES]),
      step('Plot battery SOC, state, and cell minimum and maximum.', [NOTES]),
      step('Make sure both inverters are on the correct firmware.', [NOTES]),
    ],
    todo: ['Confirm this list is grouped correctly in the original notes.'],
  },

  // ------------------------------------------------------------------ battery
  {
    id: 'ts-battery-wont-address',
    area: 'battery',
    title: 'A battery will not address, or reads 0 V',
    customerSays: 'The app will not find my battery, and the installer says it reads zero volts.',
    steps: [
      step('In the Lion Technician app use Select Service > Read Battery Address on each battery. Each battery needs its own address, counting up from 1 with no gaps.', [TSM(22, 79, 80)]),
      step('Measure the terminals through the small hole in the center. Do not put probes down the side of the terminal: the outer part is connected to the case and the probes can short the battery.', [TSM(22)]),
      step('A reading of 0 V usually means the battery circuit breaker is off. The Sanctuary 2 BMS turns it off and goes to minimum power mode when the battery was discharged below 0% and any cell dropped below 2300 mV.', [TSM(21)]),
      step('Remove the battery front cover (4mm Allen screws; earlier units used #2 Phillips) and turn the breaker on. The small window on the breaker is red when it is on and green when it is off.', [TSM(24)]),
      step('Set the charge current to 20A (Inverter Max Charge Current on one inverter, System Charge Current on parallel inverters) and put the system in battery priority mode (Emergency Mode). Unplug one power cable from each of the other batteries, then plug in the low battery so it charges by itself.', [TSM(24)]),
      step('If it does not charge, send the "activate battery" command, or use a 60V/5A variable power supply set to 54V/5A connected to the inverter battery terminals. Follow standard electrical safety for this voltage.', [TSM(24), AUTHOR]),
      step('If the terminal voltage is less than 40V, try charging it manually with 5A. If no charging current is accepted, check the battery circuit breaker and try 5A again.', [TSM(80)]),
      step('If the terminals are above 50V, try a different BMS cable and check the cables with an Ethernet cable tester. RJ45 pin 6 = GND, 7 = A, 8 = B.', [TSM(80), AUTHOR]),
      step('Once the lowest cell is over 3.0V, put the charge current back (usually 140A). Bring the other batteries back in when the voltage is within 0.5V of each one, then change from emergency mode back to normal mode.', [TSM(25)]),
      step('If it still will not address, restart the commissioning process and power cycle the system. This is only for a system that never finished its first commissioning.', [AUTHOR, src('emsc', 16)]),
    ],
    related: [{ moduleId: 'dc-wiring-batteries', lessonId: 'm4-dead-battery' }],
  },
  {
    id: 'ts-battery-spread',
    area: 'battery',
    title: 'Batteries read different voltages before paralleling',
    customerSays: 'One battery reads 54.1 V and the other reads 52.9 V.',
    steps: [
      step('Batteries should be within 0.5V of each other before they are connected in parallel. Otherwise excessively high current may flow between them.', [src('manual', 20), src('san2_3', 17)]),
      step('Above 53.5 V resting at room temperature a battery is probably above 98% charged. It can be quickly discharged to 53.5 V by running the inverter on battery power as its only source.', [src('manual', 20)]),
      step('Below 51.2 V resting at room temperature a battery is probably under 7% charged. Charge it to within 0.5V of the other batteries before connecting in parallel.', [src('manual', 20)]),
      step('Use the paralleling procedure: only negatives connected, then plug in the positive of the lowest battery first, and add the next lowest once it is within 0.5V.', [src('manual', 20)]),
      step('In the field a spread larger than 0.5V is usually not a big problem, but 0.5V is the recommendation.', [AUTHOR]),
    ],
    related: [
      { moduleId: 'dc-wiring-batteries', lessonId: 'm4-battery-check' },
      { moduleId: 'dc-wiring-batteries', lessonId: 'm4-paralleling' },
    ],
  },
  {
    id: 'ts-battery-out-of-range',
    area: 'battery',
    title: 'A battery reads outside 51-55.6 V before wiring',
    steps: [
      step('The acceptable range before wiring is 51 to 55.6 VDC. (The manual says 45-55.6, which is a typo.)', [src('manual', 21), AUTHOR]),
      step('Below 51 V: see "A battery will not address, or reads 0 V".', [AUTHOR]),
      step('Outside the range: contact LionESS support at (435) 244-3352.', [src('manual', 21), src('emsc', 16)]),
    ],
    related: [{ moduleId: 'dc-wiring-batteries', lessonId: 'm4-battery-check' }],
  },
  {
    id: 'ts-inverter-terminals-low',
    area: 'battery',
    title: 'The inverter battery terminals read below 40 V while paralleling',
    steps: [
      step('Use the battery awaken function in the web app. After a minute the voltage should rise above 50V.', [src('manual', 20)]),
      step('Then plug in the positive cable of the lowest-voltage battery.', [src('manual', 20)]),
      step('Battery awaken only works on a commissioned system.', [AUTHOR]),
    ],
    related: [{ moduleId: 'dc-wiring-batteries', lessonId: 'm4-paralleling' }],
  },

  // ------------------------------------------------------------------ inverter
  {
    id: 'ts-no-light',
    area: 'inverter',
    title: 'No light on the inverter, but the buttons are pushed in',
    customerSays: 'There is no light at all, and the buttons are in.',
    steps: [
      step('Pushed in means on, so a light should be showing.', [AUTHOR]),
      step('Listen for fan noise and relay clicks. If you hear them, the LED itself may be bad.', [AUTHOR]),
      step('If you hear nothing, it could mean internal damage to the inverter.', [AUTHOR]),
      step('The manual says to contact the installer for assistance.', [src('manual', 10)]),
      step('Check that the inverter has input power (battery, grid or solar). On Sanctuary 2 the Complete System Shutdown button has switches that feed the control board. If one of those fails, the front panel LED does not come on and you cannot communicate with the inverter.', [TSM(35)], ['rev4']),
      step('The button switches can be tested with a meter. See "Power button will not turn the inverter on".', [TSM(34, 42)], ['rev4']),
    ],
    related: [{ moduleId: 'inverter-controls', lessonId: 'm2-lights' }],
    todo: ['What the specialist does next, and the escalation path.'],
  },
  {
    id: 'ts-red-light',
    area: 'inverter',
    title: 'Red (or orange) light: a fault',
    customerSays: 'My inverter light is red and the power is out.',
    steps: [
      step('Red is a fault state. The inverter shuts down to protect itself. The light can look orange, depending on the LED and the viewer.', [src('manual', 10), AUTHOR]),
      step('Get the fault code and use the fault code entries below.', [src('san2_2', 32, 33, 34, 35)]),
      step('If a fault does not clear or comes back repeatedly, contact your installer.', [src('manual', 10)]),
      step('If you are unable to clear the fault, restart the system. If it still shows, contact Lion Energy.', [src('san2_2', 35)]),
    ],
    related: [{ moduleId: 'inverter-controls', lessonId: 'm2-faults' }],
  },
  {
    id: 'ts-blinking-green',
    area: 'inverter',
    title: 'Blinking green light: an alarm',
    customerSays: 'The light on my inverter is blinking green.',
    steps: [
      step('Blinking green is an alarm, not a fault. It can be as simple as the battery being below its target state of charge. Some inverter functions might not be available.', [src('manual', 10)]),
      step('Check the Lion Energy app to identify the alarm.', [src('manual', 10)]),
      step('A flashing green LED also shows when the inverter is in standby with the AC power button off, not only for an alarm. On Rev 4, check whether the AC/DC button is pushed in.', [TSM(13, 35)], ['rev4']),
      step('Alarms can clear automatically and may occur before the system is fully commissioned. Some alarms need a power cycle.', [src('manual', 10)]),
      step('If the alarm indicates a problem, contact your installer.', [src('manual', 10)]),
    ],
    related: [{ moduleId: 'inverter-controls', lessonId: 'm2-lights' }],
  },
  {
    id: 'ts-app-offline',
    area: 'inverter',
    title: 'The customer cannot reach the system in the app',
    customerSays: 'I cannot see my system in the app.',
    steps: [
      step('Check that the AC/DC button is pushed in. With AC/DC off, the 12V supply that powers the EMS-C turns off and comms go offline.', [src('emsc', 8), AUTHOR], ['rev4']),
      step('Read the EMS-C status light. No lights: not commissioned. Blinking yellow: connecting. Solid yellow: updating. Solid blue: connected. Fast blinking blue: uploading or downloading data. Solid red: disconnected, or the EMS-C has faulted.', [src('emsc', 6)], ['rev4']),
      step('On cellular, the homeowner sees only a blue Wi-Fi icon and no system information.', [AUTHOR], ['rev4']),
      step('If there are connectivity problems, check that the antennas are installed, that the cellular and Bluetooth/Wi-Fi antennas are on the matching ports, and that the antenna wires inside are connected.', [src('video')], ['rev4']),
      step('Power cycle the inverter. Then check that the EMS-C status light turns solid. That can take a minute or two after the inverter is back.', [AUTHOR], ['rev4']),
      step('Power cycle the communicator.', [NOTES]),
      step('Check whether the communicator can connect to a hotspot or a different internet connection.', [NOTES]),
      step('Make sure the Bluetooth connection is established.', [NOTES]),
      step('Check inverter communication with the communicator.', [NOTES]),
    ],
    related: [
      { moduleId: 'inverter-controls', lessonId: 'm2-shutdown' },
      { moduleId: 'inverter-controls', lessonId: 'm2-faults' },
    ],
    todo: ['Revs 1-3 (WCM): app connection steps and whether the WCM keeps comms with the power button off.'],
  },
  {
    id: 'ts-change-wifi',
    area: 'inverter',
    title: 'Change the Wi-Fi network or password',
    customerSays: 'I got a new router, or changed my Wi-Fi password, and the system is offline.',
    steps: [
      step('You have to be within Bluetooth range of the Sanctuary. The Wi-Fi network name (SSID) and password cannot be changed from a distance.', [TSM(60)]),
      step('Laptop with Bluetooth (always works): open a browser and go to smart.lionenergy.com. Open the customer\'s product page, then go to settings > change internet, and follow the on-screen prompts.', [TSM(61), SETTINGS(11)]),
      step('Lion Technician app (installers with technician access, Apple or Android): Select Service > "Change or Reconnect Network".', [TSM(61)]),
      step('Lion Smart app: the Apple version can change the Wi-Fi. The Android version cannot yet.', [TSM(61)]),
      step('Mobile browser: this does not work on every device. If it does not work, try another method.', [TSM(60, 61)]),
      step('Most reliable: connect an Ethernet cable from the customer\'s router to the EMS-C\'s Ethernet port.', [TSM(61)]),
      step('Check that the communicator is joined to the homeowner\'s Wi-Fi and not to a mobile hotspot, and that data shows on smart.lionenergy.com.', [TSM(13)]),
      step('If the EMS-C cannot connect, check the antennas: the antenna labeled cellular goes to the cellular port and the antenna labeled WiFi/Bluetooth goes to the WiFi port. A wrong antenna gives poor reception.', [TSM(60)]),
      step('Then read the EMS-C light. Solid blue means connected. Solid red means disconnected.', [src('emsc', 6)]),
    ],
    related: [{ moduleId: 'inverter-controls', lessonId: 'm2-shutdown' }],
    todo: ['Revs 1-3 (WCM): confirm the same methods apply and what the WCM status light shows.'],
  },
  {
    id: 'ts-power-cycle',
    area: 'inverter',
    title: 'How to power cycle a Rev 4 inverter',
    steps: [
      step('Turn off the grid breaker. (Find it first.)', [AUTHOR], ['rev4']),
      step('Turn off the PV switch.', [AUTHOR], ['rev4']),
      step('Push out the AC/DC button.', [AUTHOR], ['rev4']),
      step('Push out the Complete System Shutdown button.', [AUTHOR], ['rev4']),
      step('If a generator is equipped, make sure it is off too.', [TSM(56)]),
      step('On Sanctuary 2 Rev 1 you also need to unplug all batteries.', [TSM(56)], ['rev1']),
      step('Wait about 30 seconds, until the relays click and the normal light on the face of the inverter turns off.', [AUTHOR, TSM(56)], ['rev4']),
      step('Repeat in reverse order.', [AUTHOR], ['rev4']),
      step('It takes about two minutes for the inverter to fully power back on. Then check that the EMS-C status light turns solid.', [AUTHOR], ['rev4']),
    ],
    related: [{ moduleId: 'inverter-controls', lessonId: 'm2-faults' }],
    todo: ['Power cycle steps for Revs 1-3 in the author\'s own order (single power button and DC switch). The Technical Service Manual (p.56) gives the generic steps: PV switch off, grid off, power buttons off.'],
  },

  // ------------------------------------------------------------------ power
  {
    id: 'ts-loads-off',
    area: 'power',
    title: 'The customer\'s loads have no power',
    customerSays: 'The lights in my house are off.',
    steps: [
      step('Look at the inverter light. Red means a fault and the inverter shut down to protect itself: use the fault code entries.', [src('manual', 10)]),
      step('On Rev 4, check the AC/DC button. With AC/DC off, the inverter loads are powered off and no PV power is used.', [src('manual', 10)], ['rev4']),
      step('Check whether the remote shutdown switch was pressed. Opening its circuit turns the inverters off.', [src('manual', 28, 29)]),
      step('If the system is overloaded, see the Over-Load fault codes and reduce the load.', [src('san2_2', 32, 35)]),
    ],
    related: [{ moduleId: 'inverter-controls', lessonId: 'm2-controls' }],
  },
  {
    id: 'ts-shutdown-still-on',
    area: 'power',
    title: 'Complete System Shutdown (or the power button) and what stays on',
    customerSays: 'I pushed the shutdown button but everything is still running.',
    steps: [
      step('On Rev 4, Complete System Shutdown turns off all components of the inverter. The control board and battery power run through that button, so with it truly out the front LED is off and you cannot communicate with the inverter.', [src('manual', 10), TSM(35)], ['rev4']),
      step('If the system still runs, check that the button is really out and that it is the right inverter. Ask whether a transfer (bypass) switch is in the grid position: that powers the backup loads from the grid instead of the inverter.', [TSM(32)]),
      step('If the LED will not come on and you cannot communicate with the inverter even though the button is in, a switch behind the Complete System Shutdown button may have failed. See "Power button will not turn the inverter on (meter tests)".', [TSM(35)], ['rev4']),
      step('A flashing green light with the AC power button off is standby. On Revs 1-3 the power button is the only button.', [TSM(13)]),
      step('Turning the unit off does not make it safe to work on. Disconnect all power sources, including the AC and DC terminals, and use lockout/tagout.', [src('manual', 2), src('san2_2', 2)]),
    ],
    related: [{ moduleId: 'inverter-controls', lessonId: 'm2-shutdown' }],
    todo: ['What to check for a customer whose system keeps working after the button is out, beyond the transfer switch and a failed button.'],
  },
  {
    id: 'ts-no-solar',
    area: 'power',
    title: 'Solar is not being used',
    customerSays: 'My solar panels are not doing anything for the system.',
    steps: [
      step('Check the PV Disconnect. It controls whether the inverter accepts solar power. (On Revs 1-3 the DC switch is the PV disconnect.)', [src('manual', 10), AUTHOR]),
      step('With AC/DC off (Rev 4), no PV power is used.', [src('manual', 10)], ['rev4']),
      step('The PV Insulation Detection setting is installer level and its default is disabled. It gets turned on when the inverter is updated, or after commissioning. When it is enabled, the first check runs 2 minutes after the inverter turns on. On-grid it repeats every 24 hours with about 30 seconds in internal bypass (loads stay on the grid). Off-grid only the first check runs.', [SETTINGS(35), AUTHOR]),
      step('At first power-up the inverter runs a PV insulation check. If the front LED turns orange or red, it failed: there is a path from PV(+) or PV(-) to ground. Do not proceed until the PV wiring is fixed.', [src('manual', 42), AUTHOR], ['rev4']),
      step('For leakage, run the PV-to-GND test: PV Disconnect off, voltage and continuity from PV(-) to GND, then from PV(+) to GND. With MLPE the test may miss leakage if rapid shutdown is not turning the panels on.', [src('manual', 27), AUTHOR], ['rev4']),
      step('Fault A2_15 (ARC Fault Detected): check the solar wiring for correct connections.', [src('san2_2', 35)]),
    ],
    related: [
      { moduleId: 'dc-wiring-batteries', lessonId: 'm4-leakage' },
      { moduleId: 'inverter-controls', lessonId: 'm2-controls' },
    ],
  },
  {
    id: 'ts-remote-shutdown',
    area: 'power',
    title: 'The system shut off after the remote shutdown switch was pressed',
    steps: [
      step('The remote shutdown switch must use the normally closed position for the inverters to run. Pressing it opens the circuit and turns the inverters off, including the 12V rapid shutdown supply.', [src('manual', 28, 29)]),
      step('The 12V supply also powers the EMS-C on Rev 4, so the EMS-C loses power.', [src('emsc', 8)], ['rev4']),
      step('To use the system without a remote shutdown switch, the connector keeps its black wire loop. To fit a switch, remove the loop.', [src('manual', 29)]),
      step('The remote shutdown switch is in series with the AC/DC power button. If either is open, the load port shuts off and the 12V to the rapid shutdown transmitter turns off.', [TSM(32)]),
      step('In a parallel system, if any inverter AC/DC button is off or any remote shutdown switch is off, all inverters turn off.', [TSM(32)]),
      step('The remote shutdown switch, the AC/DC button and the Complete System Shutdown button must all be closed for the system to run. If the remote shutdown terminal reads 5 V DC, the switch is open. Installers sometimes wire a normally open (NO) switch, or pick the wrong terminal on a switch that has both NO and NC.', [TSM(34)]),
    ],
    related: [{ moduleId: 'dc-wiring-batteries', lessonId: 'm4-diagram' }],
  },
  {
    id: 'ts-ct-check',
    area: 'inverter',
    title: 'CT check (grid CT problems)',
    steps: [
      step('On a Rev 4, the L1 CT is on pins 3 and 6 and the L2 CT is on pins 1 and 2.', [NOTES], ['rev4']),
      step('The CT arrows must point away from the main panel and toward the grid power source.', [src('manual', 34)]),
      step('In a system with several inverters, only the parent inverter has the CTs.', [src('manual', 34)]),
      step('Read the rating on the CTs themselves (the commissioning example showed 200A / 100mA).', [src('video')]),
      step('Two CT sizes have shipped. 90A / 90mA (1000:1 ratio) is used on Sanctuary 2 Rev 1 and Rev 2 hardware. 200A / 100mA (2000:1 ratio) is used on Rev 3, Rev 4 and Sanctuary 3. The Current Transducer Ratio setting has to match the CTs that are installed.', [SETTINGS(31, 32)]),
      step('Fault A1_12 (Grid CT is Reversed) exists, but do not rely on it: it does not detect improper CT installation. Check that the CTs are installed correctly, with the arrow pointing away from the inverter.', [TSM(74)]),
      step('The CTs must at least include the current going to the inverter grid port. Loads upstream of the CTs cannot use power on demand from the battery while on-grid. If the CTs are on the opposite lines, or face the wrong way, the current reads backwards.', [TSM(9)]),
      step('On Rev 4 and Sanctuary 3 both CTs share one plug. Pins 3 and 6 are the L1 CT (3 = N, 6 = P) and pins 1 and 2 are the L2 CT (1 = N, 2 = P). If the CT plug is put in the meter port instead, only the L2 CT reads power, and it reads backwards as if it were the L1 CT. Use the CT port shown on the diagram inside the wiring panel cover.', [TSM(9)], ['rev4']),
    ],
    related: [{ moduleId: 'inverter-controls', lessonId: 'm2-faults' }],
    todo: ['A photo of the CT wires spliced to Cat5 is still to be added.'],
  },

  // ------------------------------------------------------------------ more power
  {
    id: 'ts-pv-reverse',
    area: 'power',
    title: 'PV reverse warning: solar drops to 0 V in daylight',
    steps: [
      step('Check the polarity at the MPPT port.', [NOTES]),
      step('If the solar voltage drops to 0 V during solar hours, the PV is reversed.', [NOTES]),
      step('Plot the solar voltages to see it.', [NOTES]),
      step('With a meter: if the voltage from PV1+ to PV1- reads about -1 V, the PV lines are reversed. The -1 V appears because reverse polarity forward-biases a diode in the MPPT input circuit.', [TSM(63)]),
    ],
    related: [{ moduleId: 'dc-wiring-batteries', lessonId: 'm4-pv' }],
  },
  {
    id: 'ts-gfci-solar',
    area: 'power',
    title: 'Grounded solar: GFCI alert',
    steps: [
      step('Possible cause: water or corrosion damage.', [NOTES]),
      step('Possible cause: a short circuit in the system.', [NOTES]),
      step('Possible cause: worn-out insulation on the wire.', [NOTES]),
      step('Individual solar panels can cause this issue.', [NOTES]),
      step('Fault A1_10 (Leakage Current, GFCI Fault) is a ground fault. Check that neutral and ground bonding follow NEC, check the neutral wiring, and make sure the load output panel is not bonded.', [src('san2_2', 33)]),
      step('If water gets inside a solar panel it can create a leakage path to ground, often during or after rain. Check panels for cracked glass, condensation or water spots inside, and physical damage. Sanctuary 2 Rev 4 and Sanctuary 3 have fuses on the MPPT inputs, and the inverter shuts down when ground current is detected.', [TSM(63)]),
      step('To measure ground current, use a clamp-on DC ammeter with 1 mA resolution. Clamp the positive and negative leads of one string together: the string current cancels and what remains is the ground leakage. Do this on each string. The problem may not reappear until it rains again.', [TSM(64)]),
      step('How the inverter decides: with Leakage Current Detection enabled (the default), normal PV-to-ground leakage reads around 10 mA or less. A jump of 30 mA, or a slow rise past 300 mA, raises the GFCI over alarm (A1_10). With the setting disabled, the inverter does not shut down for ground-fault leakage.', [SETTINGS(35)]),
    ],
    ordered: false,
    related: [{ moduleId: 'dc-wiring-batteries', lessonId: 'm4-leakage' }],
  },
  {
    id: 'ts-grid-overvoltage',
    area: 'power',
    title: 'Grid over-voltage alert',
    steps: [
      step('Plot the grid voltages.', [NOTES]),
      step('Enable HVRT.', [NOTES]),
      step('Raise the grid allowable voltage setting. The default is 105%. Adjust it to 107% for a high grid voltage.', [NOTES]),
      step('That 105% is the default maximum grid reconnect voltage (126 V on a 120 V leg). If the grid is consistently more than 5% high (above 126 V on either leg), the setting needs to be adjusted, as long as the AHJ does not require it to be 105%.', [TSM(33)]),
      step('Fault A1_7 (Grid Over-Voltage): ensure the grid input voltage is within range, and check the grid input type on the inverter (default is US).', [src('san2_2', 33)]),
    ],
  },
  {
    id: 'ts-sellback-stuck',
    area: 'power',
    title: 'Grid sell-back does not resume when it is enabled',
    customerSays: 'Sell-back is turned on but the system is not selling.',
    steps: [
      step('The Frequency-Watt function can get stuck. Disable Power Frequency Response, then re-enable it.', [NOTES]),
      step('Make sure the overfrequency recovery deadband is set to 1. At the default of 100, the grid frequency has to recover to 0.1 Hz below the frequency where sell-back is disabled. At 1, it only has to recover 0.001 Hz.', [NOTES]),
    ],
  },
  {
    id: 'ts-generator-manual',
    area: 'power',
    title: 'Generator started manually after auto-start',
    steps: [
      step('When a generator has auto-start and is then started manually, the inverter ignores the generator until the inverter calls for it.', [NOTES]),
      step('While the generator is connected, the inverter status reads on-grid.', [NOTES]),
    ],
  },
  {
    id: 'ts-wont-connect-grid',
    area: 'power',
    title: 'The inverter will not connect to the grid',
    customerSays: 'The system stays off-grid after the power came back.',
    steps: [
      step('Check the alerts first. They should say why it is not connecting. Before reconnecting, the inverter shows a grid low frequency alarm and a grid low voltage alarm. If the status reads "off-grid PL", it is doing load-to-grid phase lock and about to connect.', [TSM(33)]),
      step('Grid voltage too high: default maximum reconnect voltage is 105% of normal (126 V). Try enabling HVRT. Settings above 126 V need to be adjusted (see "Grid over-voltage alert").', [TSM(33)]),
      step('Grid voltage too low: make sure voltage is present on all inverter grid ports, L1 and L2. The inverter waits five minutes (default) for the grid to stay between 91.7% and 105% of normal. Try enabling LVRT. If the grid consistently reads below 110 V, the settings need adjusting.', [TSM(33)]),
      step('Split phase: L1 and L2 to neutral should be 120 V and line to line 240 V. About 208 V line to line with 120 V on each leg is three-phase service. Parallel three-phase is supported only with three inverters.', [TSM(34)]),
      step('Grid frequency: above 60.1 Hz or below 59.5 Hz, the default settings do not allow connecting.', [TSM(34)]),
      step('Parallel systems: all load combiner breakers and all inverter grid breakers must be on, and phasing must be consistent on the grid and load sides. A wiring error alarm (EPS or grid) stays until the inverters are completely shut down.', [TSM(34)]),
      step('Check the power buttons and remote shutdown switches (see "The system shut off after the remote shutdown switch was pressed").', [TSM(34)]),
      step('Time delay: the default Grid Reconnection Delay is 300 s. The minimum workable setting is 33 s.', [TSM(34), SETTINGS(25)]),
      step('Check that the grid type is right (three-phase vs split phase).', [TSM(33)]),
    ],
    ordered: false,
  },
  {
    id: 'ts-power-button-test',
    area: 'inverter',
    title: 'Power button will not turn the inverter on (meter tests)',
    steps: [
      step('Before replacing either switch, turn off all power to the inverter: grid, solar and battery.', [TSM(34)]),
      step('If the inverter will not turn on and you verified it has input power (battery, grid or solar), the problem may be one of the two power buttons or the remote shutdown switch.', [TSM(35)]),
      step('The AC/DC On/Off button has two switches: one for AC power and one for the 12V rapid shutdown (RSD) power. The Complete System Shutdown button has three: AC power, a switch to the control board, and one that connects battery power to the control board.', [TSM(35)], ['rev4']),
      step('The AC power switches in the two buttons and the remote shutdown port are in series. All three must be on for the inverter AC power to turn on.', [TSM(35)], ['rev4']),
      step('If only an AC power switch is the problem, the controller turns on and you can communicate with the inverter, the front panel green LED flashes, and the power button status reads off. If the problem is in the switches behind the Complete System Shutdown button, the front LED does not turn on and you cannot communicate with the inverter.', [TSM(35)], ['rev4']),
      step('Before testing, make sure the inverter has power from at least one source and the front panel green LED is on or flashing.', [TSM(37)], ['rev4']),
      step('Measure the voltage on the power button connector (back-probe with needle probes on Rev 4). 5 V means one or both side buttons are off or not connecting. 0 V means check the remote shutdown port terminals. The remote shutdown port ships with a wire loop. If that terminal reads 5 V, the remote shutdown switch is open.', [TSM(35, 36)], ['rev4']),
      step('If the voltage goes to zero while the button is pressed all the way in but returns to 5 V when the buttons are left on, the button has a mechanical problem.', [TSM(37)], ['rev4']),
      step('12V for the EMS-C and RSD comes through the top button on Rev 4 (not on Sanctuary 3). With both buttons on you should read 12 V on the RSD port. If not, unplug the RSD connector and measure its pins. If still no 12 V, check the switch behind the top button: continuity across the two wires of the white plug when the top button is on, open when it is off.', [TSM(39, 41)], ['rev4']),
      step('If the control board will not turn on, unplug the two-wire cable CN13 (wires SB7 and SB8) from the control board. With the bottom button on there should be near zero ohms.', [TSM(41)], ['rev4']),
      step('Battery power switch: back-probe the third wire down on the right-side connector of the control board against the inverter positive battery terminal. With the bottom button on you should read close to zero volts.', [TSM(42)], ['rev4']),
    ],
    ordered: false,
    todo: ['The manual shows the Rev 4 connector labels and wire label pictures (pp.36, 43-44). The labels still need to be added as an image if the learner needs to find them.'],
  },
  {
    id: 'ts-failed-firmware',
    area: 'inverter',
    title: 'Failed firmware update: the inverter will not boot or respond',
    steps: [
      step('The DSP processor handles the waveforms and switching the IGBTs. The ARM processor handles the relays, power switch, USB, RS-485 and front panel LEDs.', [TSM(55)]),
      step('On the bottom side of the processor board there are three LEDs: DSP heartbeat (left), ARM heartbeat (middle), power (right edge). Both processor LEDs should flash and the power LED should be steady while the inverter is on. A processor whose LED is not flashing is not running.', [TSM(55)]),
      step('Signs: no status LEDs on the front panel when powered; an endless boot loop with relays clicking every few seconds; the DSP or ARM LED not flashing; USB not recognized; no RS-485 response (try restarting the communicator first).', [TSM(56)]),
      step('Power cycle: PV switch off, grid off, generator off if equipped, power buttons off. On Sanctuary 2 Rev 1 also unplug all batteries. Wait 30 s until the relays click and the front LEDs are off, then turn the inverter back on with the battery connected and retry the update on the processor that failed.', [TSM(56)]),
      step('If the ARM LED is still not flashing after the power cycle, it is locked up and firmware cannot be updated by USB or RS-485. A special programmer and firmware file are needed to flash it directly: call ESS support.', [TSM(56)]),
      step('If re-flashing the DSP fails, try the ARM (.axf file) by USB, then RS-485. If the ARM flash works, try the DSP (.out file) again by USB, then RS-485. If a firmware update starts and fails, power cycle again before going on. If the DSP still will not flash, it needs the special programmer.', [TSM(56, 57)]),
      step('If two inverters on the same communicator share a modbus address when an update is attempted, the update fails badly enough that firmware must be flashed directly to the board.', [TSM(56)]),
    ],
    ordered: false,
  },
  {
    id: 'ts-voc-calc',
    area: 'power',
    title: 'Will the string stay under 500 V in the cold? (Voc calculation)',
    customerSays: 'The installer wants to know how many panels fit on a string.',
    steps: [
      step('The MPPT operating voltage is 120 V to 500 V. It needs at least 120 V DC to start. The open-circuit voltage must never exceed 500 V; a significantly higher voltage may damage the inverter.', [TSM(61)]),
      step('From the panel datasheet take the open-circuit voltage in full sun (Voc) and the temperature coefficient of Voc. A negative coefficient means Voc rises as temperature falls.', [TSM(61, 62)]),
      step('Worked example from the manual: panel Voc 48.2 V, coefficient -0.29% per degree C, 10 panels in series. At 25 C that is 482 V. Margin to 500 V is 18 V, which is 3.73% of 482 V. 3.73% / 0.29% = 12.87 degrees C colder, so below about 12 C the string exceeds 500 V in full sun.', [TSM(62, 63)]),
      step('Same panel with 9 in series: 433.8 V. Margin 66.2 V = 15.26%. 15.26% / 0.29% = 52.6 degrees C colder, so it only exceeds 500 V below about -27.6 C.', [TSM(63)]),
      step('Post-commissioning check: make sure every string can make more than 120 V in daylight and that the cold-weather Voc calculation shows no string over 500 V at the coldest temperature for the climate.', [TSM(13)]),
    ],
    related: [{ moduleId: 'dc-wiring-batteries', lessonId: 'm4-pv' }],
  },
  {
    id: 'ts-operating-modes',
    area: 'power',
    title: 'Operating mode and battery reserve (what the homeowner can change)',
    customerSays: 'I want to keep my battery full for an outage. / My battery is not being used.',
    steps: [
      step('The homeowner (and anyone the product is shared with) can change only three things: the Wi-Fi (internet), the operating mode, and the battery reserve percentage. Everything else is installer or Lion Energy level.', [SETTINGS(10, 11)]),
      step('Settings changes go through the communicator (WCM or EMS-C), so the system must be online to change them.', [SETTINGS(10)]),
      step('Normal mode (default) minimizes power bought from the grid. It is "Limit Grid Consumption" with Battery Priority disabled.', [SETTINGS(11)]),
      step('Emergency mode keeps the battery full and ready for an outage. Solar cannot be stored or used from the battery while it is on. It is "Limit Grid Consumption" with Battery Priority enabled.', [SETTINGS(12)]),
      step('Battery Priority (installer level): when the grid is on, the grid charges the battery and holds it at 100% SoC. Lion Energy recommends not using it for more than a week at a time; leave it disabled except for short-term use.', [SETTINGS(37)]),
      step('Battery Sell Mode sells to the grid down to the battery reserve percentage, then only excess solar can be sold. It is rarely advantageous. If it is used, set Grid Sell Power Limit to the power to sell and use the time-of-use slots to say when and how much.', [SETTINGS(12)]),
      step('The Battery Reserve Percentage setting writes the same percentage into all six time-of-use slots. To have a different reserve per slot, do not change it; change the time-of-use settings in Advanced Settings instead.', [SETTINGS(12)]),
      step('30% battery reserve is typically recommended. It is customer preference.', [AUTHOR]),
    ],
    ordered: false,
  },
  {
    id: 'ts-time-wrong',
    area: 'inverter',
    title: 'Time is wrong, or time-of-use runs at the wrong times',
    customerSays: 'The battery is charging or discharging at the wrong time of day.',
    steps: [
      step('The correct time is needed for time-of-use settings to work at the right times, and for the right times to show in the alarm history.', [SETTINGS(12)]),
      step('The EMS-C sets the inverter clock from internet time every minute, so the Sync System Date/Time button is essentially obsolete.', [SETTINGS(12)]),
      step('For any time sync problem, check the time zone setting first. It is installer level and is set during commissioning.', [SETTINGS(12, 41)]),
      step('Then make sure the EMS-C can connect to the internet.', [SETTINGS(12)]),
      step('If the clock is right, check the time-of-use slots: there are six, they must be sequential and not overlap, slot 1 should start at 12:00 AM and slot 6 should end at 11:59 PM. Overlapping slots make time-of-use not work correctly or be effectively disabled.', [SETTINGS(21, 22)]),
    ],
  },
  {
    id: 'ts-battery-dod',
    area: 'battery',
    title: 'Low-battery alarms A1_3 and A1_4 and depth of discharge',
    customerSays: 'The system shut off the loads because the battery is low.',
    steps: [
      step('Depth of discharge (DoD) is how far the battery may be discharged. SoC = 100 - DoD, so at 90% DoD the battery is at 10% SoC.', [SETTINGS(14)]),
      step('On-Grid Depth of Discharge (installer, default 90): once SoC drops below 100 - on-grid DoD, the inverter stops using the battery and uses the grid. It can override time-of-use settings.', [SETTINGS(14)]),
      step('Off-Grid Depth of Discharge (installer, default 90): how far the battery can be discharged off-grid before load power is turned off.', [SETTINGS(14)]),
      step('Off-grid DoD should be at least as much as on-grid DoD. If on-grid DoD is set higher, the inverter treats it as a mistake and uses the higher value off-grid and the lower one on-grid.', [SETTINGS(14)]),
      step('When SoC drops below 100 - off-grid DoD, the inverter raises the low battery alarm (A1_4). If on-grid DoD is the same as or less than off-grid DoD, it also raises the battery under capacity alarm (A1_3).', [SETTINGS(14)]),
      step('Off-Grid Battery Restart Percent (installer, default 10): after the loads were turned off for low battery, the battery has to charge back up by this much before the loads come back. At the default settings the loads return at 20% SoC.', [SETTINGS(14)]),
      step('On-Grid Battery Restart Percent (installer, default 0): when SoC falls to the target, the inverter charges from solar up to this percent above the target, then allows discharging again.', [SETTINGS(13, 14)]),
      step('A1_3 in the fault table: if the inverter does not charge, use a power supply to charge the battery to at least 10% SoC.', [src('san2_2', 32)]),
    ],
    todo: ['The Settings Guide describes A1_3 two ways (p.14: raised together with A1_4 when on-grid DoD is the same or less than off-grid DoD; p.14: raised after A1_4 when on-grid DoD is higher). Confirm with the author which one the specialist should expect.'],
  },

]

const faultEntries: TroubleshootingEntry[] = FAULT_CODES.map((f) => ({
  id: `ts-fault-${f.code.toLowerCase()}`,
  area: FAULT_AREA[f.code],
  title: `${f.code}: ${f.name}`,
  faultCode: f.code,
  description: f.description,
  steps: f.solutions.length
    ? f.solutions.map((x) => (typeof x === 'string' ? step(x, f.sources) : step(x.text, x.sources ?? f.sources, x.revisions)))
    : [step('The Technical Service Manual lists no troubleshooting for this code.', f.sources)],
  todo: f.todo,
  related: [{ moduleId: 'inverter-controls', lessonId: 'm2-faults' }],
}))

export const TROUBLESHOOTING: TroubleshootingEntry[] = [...guided, ...faultEntries]
