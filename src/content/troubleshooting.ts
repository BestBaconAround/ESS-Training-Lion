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
  A1_10: 'inverter',
  A1_11: 'inverter',
  A1_12: 'inverter',
  A1_13: 'inverter',
  A1_14: 'inverter',
  A1_15: 'power',
  A2_8: 'battery',
  A2_9: 'battery',
  A2_10: 'battery',
  A2_11: 'battery',
  A2_12: 'battery',
  A2_13: 'power',
  A2_14: 'inverter',
  A2_15: 'inverter',
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
    title: 'A battery will not address, or reads 0 V, during commissioning',
    customerSays: 'The app will not find my battery, and the installer says it reads zero volts.',
    steps: [
      step('Check the voltage. If it is absent or below 51 V the BMS is asleep.', [AUTHOR]),
      step('Battery awaken is not available before commissioning, so the battery has to be charged.', [AUTHOR]),
      step('Remove the battery cover (16 screws, 4mm). Connect the alligator clips of the 60V variable DC power supply to the positive and negative terminals at the top of the battery, inside.', [AUTHOR]),
      step('Set the supply to 52 VDC at 5A (5A is what it can deliver). Stop charging at 51.5 VDC. Follow standard electrical safety for this voltage.', [AUTHOR]),
      step('Try to address the battery again.', [AUTHOR]),
      step('If it still will not address, swap the BMS cable for another Cat5/6 cable and try again.', [AUTHOR]),
      step('If that does not work, restart the commissioning process and power cycle the system. This is only for a system that never finished its first commissioning.', [AUTHOR, src('emsc', 16)]),
    ],
    related: [{ moduleId: 'dc-wiring-batteries', lessonId: 'm4-dead-battery' }],
    todo: ['What to do for a commissioned system with a battery below 51 V.'],
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
    id: 'ts-power-cycle',
    area: 'inverter',
    title: 'How to power cycle a Rev 4 inverter',
    steps: [
      step('Turn off the grid breaker. (Find it first.)', [AUTHOR], ['rev4']),
      step('Turn off the PV switch.', [AUTHOR], ['rev4']),
      step('Push out the AC/DC button.', [AUTHOR], ['rev4']),
      step('Push out the Complete System Shutdown button.', [AUTHOR], ['rev4']),
      step('Wait ten seconds, until the normal light on the face of the inverter turns off.', [AUTHOR], ['rev4']),
      step('Repeat in reverse order.', [AUTHOR], ['rev4']),
      step('It takes about two minutes for the inverter to fully power back on. Then check that the EMS-C status light turns solid.', [AUTHOR], ['rev4']),
    ],
    related: [{ moduleId: 'inverter-controls', lessonId: 'm2-faults' }],
    todo: ['Power cycle steps for Revs 1-3 (single power button and DC switch).'],
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
    title: 'Complete System Shutdown (or the power button) did not turn the system off',
    customerSays: 'I pushed the shutdown button but everything is still running.',
    steps: [
      step('Shutdown tries to turn the system off but does not fully follow through while an external power source is on. The system works as normal.', [AUTHOR]),
      step('External sources are grid, solar (while the PV Disconnect is on), AC solar, generator, and wind (very rare). The battery alone does not keep the inverter on.', [AUTHOR]),
      step('Turning the unit off does not make it safe to work on. Disconnect all power sources, including the AC and DC terminals, and use lockout/tagout.', [src('manual', 2), src('san2_2', 2)]),
    ],
    related: [{ moduleId: 'inverter-controls', lessonId: 'm2-shutdown' }],
  },
  {
    id: 'ts-no-solar',
    area: 'power',
    title: 'Solar is not being used',
    customerSays: 'My solar panels are not doing anything for the system.',
    steps: [
      step('Check the PV Disconnect. It controls whether the inverter accepts solar power. (On Revs 1-3 the DC switch is the PV disconnect.)', [src('manual', 10), AUTHOR]),
      step('With AC/DC off (Rev 4), no PV power is used.', [src('manual', 10)], ['rev4']),
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
      step('Fault A1_12 (Grid CT is Reversed) means the CTs were installed improperly: switch the CT direction.', [src('san2_2', 33)]),
    ],
    related: [{ moduleId: 'inverter-controls', lessonId: 'm2-faults' }],
    todo: ['Confirm which connector the CT pin numbers refer to. A photo of the CT wires spliced to Cat5 is still to be added.'],
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

]

const faultEntries: TroubleshootingEntry[] = FAULT_CODES.map((f) => ({
  id: `ts-fault-${f.code.toLowerCase()}`,
  area: FAULT_AREA[f.code],
  title: `${f.code}: ${f.name}`,
  faultCode: f.code,
  description: f.description,
  steps: f.solutions.map((text) => step(text, f.sources)),
  related: [{ moduleId: 'inverter-controls', lessonId: 'm2-faults' }],
}))

export const TROUBLESHOOTING: TroubleshootingEntry[] = [...guided, ...faultEntries]
