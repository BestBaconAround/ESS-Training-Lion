import type { SourceRef } from '../types'
import type { PanelTemplate, PanelWorld } from './panelTypes'

const src = (source: SourceRef['source'], ...pages: number[]): SourceRef => ({ source, ...(pages.length ? { pages } : {}) })
const MANUAL = src('manual', 10)
const AUTHOR = src('author')

const GRID_SUN: PanelWorld = { grid: true, solar: true, other: false }
const GRID_ONLY: PanelWorld = { grid: true, solar: false, other: false }

const NOT_SAFE =
  ' Fully off is still not safe to work on: disconnect all power sources, including the AC and DC terminals, and use lockout/tagout.'

/**
 * Scenario templates for the Module 2 inverter panel simulator.
 * Add new scenarios here; no UI change is needed.
 * Rev 1-3 comms/settings behavior is unknown (TODO), so no scenario asks about it.
 */
export const PANEL_TEMPLATES: PanelTemplate[] = [
  // ------------------------------------------------------------ set the switches
  {
    id: 'acdc-off-rev4',
    kind: 'set',
    family: 'rev4',
    symptoms: [
      'I pushed the AC/DC button out to test it, and now the lights in my house are off and I cannot reach my system in the app.',
      'The power in my house is out but the grid is fine. The AC/DC button is sticking out and the app will not connect.',
      'I was pressing the buttons on the inverter. Now my backed-up loads are off and the app will not connect.',
    ],
    prompt: 'Set the switches so the loads are back on and the app can reach the system.',
    start: { switches: { power: false } },
    worlds: [GRID_SUN, GRID_ONLY],
    goal: { loadsPowered: true, commsOnline: true },
    explanation:
      'AC/DC off means no PV is used and the inverter loads are powered off (manual p.10). On a Rev 4 EMS-C system, AC power off also turns off the 12V supply that powers the EMS-C, so comms go offline (EMS-C manual p.8). Push the AC/DC button back in.',
    sources: [MANUAL, src('emsc', 8), AUTHOR],
  },
  {
    id: 'pv-off-rev4',
    kind: 'set',
    family: 'rev4',
    symptoms: [
      'Everything in the house works, but my solar panels are not doing anything for the system.',
      'My battery is charging from the grid only. I get no solar at all, even in full sun.',
    ],
    prompt: 'Set the switches so the inverter accepts solar power.',
    start: { switches: { pv: false } },
    worlds: [GRID_SUN],
    goal: { pvAccepted: true },
    explanation: 'The PV Disconnect controls whether the inverter accepts solar power (manual p.10). It was off, so turn the rotary PV switch on.',
    sources: [MANUAL],
  },
  {
    id: 'pv-off-rev13',
    kind: 'set',
    family: 'rev1-3',
    symptoms: [
      'The system runs fine, but my solar panels are not producing anything for it.',
      'My house has power, but I get no solar at all, even in full sun.',
    ],
    prompt: 'Set the switches so the inverter accepts solar power.',
    start: { switches: { pv: false } },
    worlds: [GRID_SUN],
    goal: { pvAccepted: true },
    explanation: 'On Revs 1-3 the DC switch is the PV disconnect. It was off, so the inverter was not accepting solar power. Turn it on.',
    sources: [AUTHOR],
  },
  {
    id: 'fully-off-rev4',
    kind: 'set',
    family: 'rev4',
    symptoms: [
      'I need the whole system off to check my wiring. How do I turn the inverter completely off?',
      'I want the inverter completely off, with the lights off too. Which button does that?',
    ],
    prompt: 'Set the switches so the system is fully off.',
    start: { switches: {} },
    worlds: [GRID_SUN, GRID_ONLY],
    goal: { fullyOff: true },
    explanation:
      'Complete System Shutdown turns off all components of the inverter (manual p.10). It feeds the control board and the battery power to it, so with it off the front LED is off and you cannot communicate with the inverter (Technical Service Manual p.35). AC/DC alone only turns off the loads and PV.' +
      NOT_SAFE,
    sources: [MANUAL, src('tsm', 35)],
  },

  // ------------------------------------------------------------ choose the next step
  {
    id: 'blinking-green',
    kind: 'choose',
    symptoms: {
      rev4: ['The light on the front of my inverter is blinking green.', 'My inverter light is flashing green. Is something wrong?'],
      'rev1-3': ['The normal light on my inverter is flashing green.', 'My inverter has a green light that keeps blinking.'],
    },
    prompt: 'What does that tell you, and what do you do?',
    options: [
      {
        text: 'It is an alarm: have them check the Lion Energy app to see which alarm it is',
        correct: true,
        why: 'Blinking green is an alarm state. The app identifies the alarm.',
      },
      {
        text: 'It is a fault: the inverter has shut down to protect itself',
        correct: false,
        why: 'A fault is red. Blinking green is an alarm.',
      },
      { text: 'The system is off', correct: false, why: 'No lights means the system is off.' },
      {
        text: 'The system is healthy and there is nothing to check',
        correct: false,
        why: 'Solid green means no alarms. Blinking means an alarm, and some inverter functions might not be available.',
      },
    ],
    explanation:
      'Blinking green is an alarm. It can be as simple as the battery being lower than its target state of charge, and some functions may be unavailable. Check the Lion Energy app to identify the alarm. Alarms can clear automatically.',
    sources: [MANUAL],
  },
  {
    id: 'red-light',
    kind: 'choose',
    symptoms: {
      rev4: [
        'The light on my inverter is red and my house has no power.',
        'My inverter light looks orange and the power is out.',
      ],
      'rev1-3': ['The red fault light on my inverter is on and my house has no power.', 'The fault light on my inverter is lit and the power is out.'],
    },
    prompt: 'What does that tell you, and what do you do?',
    options: [
      {
        text: 'It is a fault: the inverter shut down to protect itself. Look up the fault code, and if it will not clear after restarting the system, contact Lion Energy',
        correct: true,
        why: 'Red is a fault state. If a fault does not clear or keeps coming back, the next step is to contact Lion Energy or the installer.',
      },
      {
        text: 'It is only an alarm that always clears on its own',
        correct: false,
        why: 'An alarm is blinking green, and alarms are not the same as faults. A fault shuts the inverter down.',
      },
      { text: 'Red just means the inverter is on', correct: false, why: 'Solid green means no alarms. Red is a fault.' },
      {
        text: 'Turn the PV switch off and the light will go away',
        correct: false,
        why: 'The PV switch only controls whether solar power is accepted. It does not clear a fault.',
      },
    ],
    explanation:
      'Red (or orange, depending on the LED and the viewer) is a fault, and the inverter shuts down to protect itself. Get the fault code from the app, follow its solutions, and restart the system. If the fault still shows, contact Lion Energy.',
    sources: [MANUAL, AUTHOR, src('san2_2', 35)],
  },
  {
    id: 'no-light-button-in',
    kind: 'choose',
    symptoms: {
      rev4: ['There is no light on my inverter at all, but both buttons are pushed in.', 'Nothing is lit on the front of my inverter. The buttons are in.'],
      'rev1-3': ['None of the lights on my inverter are on, but the power button is pushed in.', 'My inverter has no lights at all and the power button is in.'],
    },
    prompt: 'What is going on, and what do you do?',
    options: [
      {
        text: 'Something is wrong with the unit: possible internal damage, or a bad LED if fans and relays can be heard. Escalate',
        correct: true,
        why: 'The manual says to contact the installer if the light does not come on and the button is pushed in. In the field it can mean internal damage, or a bad LED if fan noise and relay clicks are heard.',
      },
      {
        text: 'The system is simply off',
        correct: false,
        why: 'Pushed in means on. With the buttons pushed in there should be a light.',
      },
      {
        text: 'The battery is below its target state of charge',
        correct: false,
        why: 'That is an alarm, shown as blinking green, not as no light.',
      },
      {
        text: 'Turn the PV switch off and on again',
        correct: false,
        why: 'The PV switch only controls whether solar power is accepted. It will not bring the light back.',
      },
    ],
    explanation:
      'If the light does not come on and the button is pushed in, contact the installer. TODO(author): the specialist next step and the escalation path.',
    sources: [MANUAL, AUTHOR],
  },

  // ------------------------------------------------------------ fault codes (generated from the table)
  {
    id: 'fault-code',
    kind: 'fault',
    symptoms: ['The app shows fault {code}.', 'I have {code} showing on my system.', 'My system says {code}. What does that mean?'],
    explanation: 'All fault and alarm codes apply to all Sanctuaries. If you are unable to clear the fault, restart the system. If the fault still shows, contact Lion Energy.',
    sources: [src('san2_2', 32, 33, 34, 35), AUTHOR],
  },
]
