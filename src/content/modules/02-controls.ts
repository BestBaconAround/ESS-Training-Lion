import type { Module } from '../types'
import { fact, image, question, src, todo, trueFalse } from '../helpers'

const MANUAL_CONTROLS = src('manual', 10)
const AUTHOR = src('author')

const mod: Module = {
  id: 'inverter-controls',
  number: 2,
  title: 'Inverter Controls and Indicators',
  summary: 'The switches, lights and shutdown behavior a customer will describe on a support call.',
  status: 'ready',
  outline: [
    { text: 'PV Disconnect, AC/DC Power, and Complete System Shutdown', sources: [MANUAL_CONTROLS] },
    { text: 'What the LED lights mean (solid green, blinking green, red, off)', sources: [MANUAL_CONTROLS] },
    { text: 'Shutdown, outside power sources, and the app', sources: [AUTHOR, src('emsc', 8)] },
    { text: 'Alarms vs faults, fault codes, and power cycling', sources: [MANUAL_CONTROLS, src('san2_2', 32, 33, 34, 35), AUTHOR] },
    { text: 'Revision differences in controls and lights', sources: [AUTHOR] },
  ],

  lessons: [
    // ---------------------------------------------------------------- 1
    {
      id: 'm2-controls',
      title: 'The controls on the inverter',
      summary: 'Which switch does what, and how Rev 4 differs from Revs 1-3.',
      blocks: [
        {
          type: 'text',
          text: 'Customers often say "I turned something off" without knowing which control they touched. Learn what each control does so you can tell what state the system is really in.',
        },
        image(
          'images/training-wall.png',
          [591, 437],
          'A training wall with two inverters, each mounted above a battery, and two more batteries between them, with electrical panels on either side. The top panel of each inverter carries the Lion logo.',
          'A training wall: two inverters, each mounted above a battery, with two more batteries between them. The front of each inverter is the black panel with the Lion logo. On Rev 4 the buttons and the PV switch are on the left side of the inverter, visible in this photo.',
        ),
        {
          type: 'facts',
          title: 'Rev 4 controls',
          items: [
            fact('PV Disconnect controls whether the inverter accepts solar power or not.', [MANUAL_CONTROLS], ['rev4']),
            fact(
              'AC/DC Power: when on, the inverter functions normally. When off, no PV power is used and the inverter loads are powered off.',
              [MANUAL_CONTROLS],
              ['rev4'],
            ),
            fact('Complete System Shutdown turns off all components of the inverter.', [MANUAL_CONTROLS], ['rev4']),
            fact(
              'The top button is AC/DC and the bottom button is Complete System Shutdown. The rotary PV switch is above the two buttons. All three are on the left side of the inverter.',
              [AUTHOR],
              ['rev4'],
            ),
            fact('The buttons latch: pushed in is on, pushed out is off.', [AUTHOR]),
          ],
        },
        image(
          'images/rev4-left-side-controls.webp',
          [849, 797],
          'The left side of a Rev 4 inverter: warning labels and fan grilles at the top, then a red rotary switch labeled PV Disconnect with OFF and ON positions, a red round button labeled AC/DC ON/OFF, and a green round button labeled Complete System Shutdown. Two antennas are mounted below the buttons.',
          'The left side of a Rev 4 inverter. From the top: fan grilles, the PV Disconnect rotary switch (OFF/ON), the red AC/DC ON/OFF button, and the green Complete System Shutdown button. The two antennas are below the buttons.',
        ),
        {
          type: 'facts',
          title: 'Revs 1-3 controls',
          items: [
            fact('The power button controls the on and off state.', [AUTHOR], ['rev1', 'rev2', 'rev3']),
            fact('The DC switch is the PV disconnect. "DC" stands for DC voltage.', [AUTHOR], ['rev1', 'rev2', 'rev3']),
            fact(
              'A Revs 1-3 inverter looks like a Rev 4 inverter, but without the second button and the second antenna. The controls are in the same place, on the left side of the inverter.',
              [AUTHOR],
              ['rev1', 'rev2', 'rev3'],
            ),
          ],
        },
        {
          type: 'revisionDiff',
          title: 'Controls by revision',
          rows: [
            {
              label: 'On/off',
              values: {
                rev1: 'Power button',
                rev2: 'Power button',
                rev3: 'Power button',
                rev4: 'AC/DC button (top) and Complete System Shutdown button (bottom)',
              },
              sources: [AUTHOR],
            },
            {
              label: 'PV disconnect',
              values: {
                rev1: 'DC switch',
                rev2: 'DC switch',
                rev3: 'DC switch',
                rev4: 'Rotary PV switch above the buttons',
              },
              sources: [AUTHOR, src('san2_3', 9)],
            },
            {
              label: 'Where the controls are',
              values: {
                rev1: 'Left side of the inverter',
                rev2: 'Left side of the inverter',
                rev3: 'Left side of the inverter',
                rev4: 'Left side of the inverter',
              },
              sources: [AUTHOR],
            },
            {
              label: 'Antennas',
              values: {
                rev1: 'One (no second antenna)',
                rev2: 'One (no second antenna)',
                rev3: 'One (no second antenna)',
                rev4: 'Two: cellular and Bluetooth/Wi-Fi',
              },
              sources: [AUTHOR, src('video')],
            },
          ],
        },
        {
          type: 'call',
          customer: 'I pushed the AC/DC button out to test it and now I cannot reach my system in the app.',
          answer:
            'With AC/DC off, the loads are powered off. On an EMS-C system the EMS-C is powered by the inverter\'s 12V supply, which turns off with AC power, so it loses power and comms go offline. Have them push the AC/DC button back in.',
          sources: [MANUAL_CONTROLS, src('emsc', 8), AUTHOR],
          revisions: ['rev4'],
        },
        todo('Revs 1-3: confirm whether the WCM keeps communicating with the power button off.'),
        todo('Add a photo of a Revs 1-3 inverter showing its single power button and DC switch.'),
      ],
    },

    // ---------------------------------------------------------------- 2
    {
      id: 'm2-lights',
      title: 'What the lights mean',
      summary: 'Solid green, blinking green, red, and no light, on Rev 4 and Revs 1-3.',
      blocks: [
        {
          type: 'facts',
          title: 'Rev 4 lights (manual p.10)',
          items: [
            fact('Solid green: the system has no alarms.', [MANUAL_CONTROLS], ['rev4']),
            fact(
              'Blinking green: alarm state. An alarm can be as simple as the battery being lower than the target state of charge. An alarm means some inverter functions might not be available.',
              [MANUAL_CONTROLS],
              ['rev4'],
            ),
            fact(
              'Red: fault state. The inverter shuts down to protect itself if a fault is detected. If a fault does not clear or comes back repeatedly, contact your installer.',
              [MANUAL_CONTROLS],
              ['rev4'],
            ),
            fact('No lights: the system is off.', [MANUAL_CONTROLS], ['rev4']),
            fact(
              'The lights are a normal light and a fault light, in a small window on the front of the inverter below the Lion logo.',
              [AUTHOR],
              ['rev4'],
            ),
          ],
        },
        image(
          'images/rev4-front-lights.webp',
          [663, 786],
          'The front of a Rev 4 inverter: a black panel with the Lion logo and, below the logo, a small rectangular window that holds the normal and fault lights. A wiring compartment with a clear cover is below the panel.',
          'The front of a Rev 4 inverter. The small window below the Lion logo holds the normal and fault lights. The clear-covered wiring compartment is underneath.',
        ),
        {
          type: 'facts',
          title: 'Revs 1-3: the same two lights',
          items: [
            fact('The normal light is solid green when there are no alarms, and flashing green when there is an alert.', [AUTHOR], ['rev1', 'rev2', 'rev3']),
            fact('A flashing green normal light means an active alarm or standby with the AC power button off. Check the app for alarms, and check whether the AC/DC button is pushed in.', [src('tsm', 13, 19, 35)], ['rev4']),
            fact('The fault light is red when there is a fault.', [AUTHOR], ['rev1', 'rev2', 'rev3']),
            fact('Both lights are on the face of the inverter, like Rev 4.', [AUTHOR], ['rev1', 'rev2', 'rev3']),
            fact('The lights behave the same as Rev 4: no lights means the system is off.', [AUTHOR], ['rev1', 'rev2', 'rev3']),
          ],
        },
        {
          type: 'callout',
          tone: 'note',
          text: 'The red light can look orange, depending on the type of LED and the person looking at it. Treat orange or red as a fault.',
          sources: [AUTHOR],
          revisions: 'all',
        },
        {
          type: 'facts',
          title: 'Alarms and faults',
          items: [
            fact('Alarms can clear automatically and may occur when the system is not yet fully commissioned.', [MANUAL_CONTROLS]),
            fact('Some alarms or faults need intervention, such as a power cycle, before the system works again.', [MANUAL_CONTROLS]),
            fact('If a light is blinking, check the Lion Energy app to identify the alarm. If the alarm indicates a problem, contact your installer.', [MANUAL_CONTROLS]),
          ],
        },
        {
          type: 'call',
          customer: 'The light on my inverter is blinking green.',
          answer:
            'That is an alarm, not a fault. It can be as simple as the battery being below its target state of charge. Have them check the Lion Energy app for the alarm. Some functions may be unavailable until it clears.',
          sources: [MANUAL_CONTROLS],
          revisions: 'all',
        },
        {
          type: 'call',
          customer: 'My inverter has a red light and the power is out.',
          answer:
            'Red is a fault: the inverter shut itself down to protect itself. Get the fault code from the app and look it up. If the fault does not clear or keeps coming back, escalate.',
          sources: [MANUAL_CONTROLS, src('san2_2', 35)],
          revisions: 'all',
        },
        {
          type: 'call',
          customer: 'There is no light at all, but the buttons are pushed in.',
          answer:
            'Pushed in means on, so the unit should be lit. The manual says to contact the installer. In the field this can mean internal damage to the inverter. If you can hear fan noise and relay clicks, the LED itself may be bad.',
          sources: [MANUAL_CONTROLS, AUTHOR],
          revisions: 'all',
        },
        todo('What the specialist does next for "no light, buttons pushed in", and the escalation path (the manual only says "contact your installer").'),
      ],
    },

    // ---------------------------------------------------------------- 3
    {
      id: 'm2-shutdown',
      title: 'Shutdown, outside power, and the app',
      summary: 'What each off control does, which one turns everything off, and what the app can still see.',
      blocks: [
        {
          type: 'facts',
          title: 'Complete System Shutdown',
          items: [
            fact(
              'Turning Complete System Shutdown off turns off all components of the inverter. It feeds the control board and the battery power to it, so the front LED goes off and you cannot communicate with the inverter, whatever outside power is connected. AC/DC is different: it only turns off the loads and PV.',
              [MANUAL_CONTROLS, src('tsm', 35)],
              ['rev4'],
            ),
            fact(
              'If a switch behind the Complete System Shutdown button fails, the LED does not turn on and you cannot communicate with the inverter. A failed button causes these problems.',
              [src('tsm', 35)],
              ['rev4'],
            ),
            fact(
              'The inverter can draw on the grid, solar (PV, while the PV Disconnect is on), AC solar, a generator, or wind (very, very rare).',
              [AUTHOR],
            ),
            fact(
              'The battery cables are bolted to the inverter and plugged into the battery. By design they can stay plugged in while the inverter shuts down.',
              [AUTHOR],
            ),
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Turning the unit off does not make it safe to work on. Disconnect all power sources, including the AC and DC terminals, before maintenance, and use lockout/tagout.',
          sources: [src('manual', 2), src('san2_2', 2)],
          revisions: 'all',
        },
        {
          type: 'facts',
          title: 'The EMS-C and the app on Rev 4',
          items: [
            fact(
              'On Sanctuary 2 models the EMS-C is powered by the same 12V supply as the rapid shutdown transmitter. When the AC power button or the remote shutdown switch turns off AC power, that 12V supply turns off, and the EMS-C loses power.',
              [src('emsc', 8)],
              ['rev4'],
            ),
            fact('Settings and firmware can be updated as long as the EMS-C has power.', [AUTHOR], ['rev4']),
            fact(
              'Both statements are true: the inverter controller stays on with AC/DC off (the green LED flashes and you can still communicate with the inverter), but the EMS-C loses its 12V and goes offline, so nothing reaches the app. On Rev 4 the 12V for the EMS-C and the rapid shutdown transmitter comes through the top (AC/DC) button.',
              [MANUAL_CONTROLS, src('emsc', 8), src('tsm', 35, 39), AUTHOR],
              ['rev4'],
            ),
          ],
        },
        image(
          'images/ems-c-in-inverter.png',
          [338, 440],
          'An EMS-C: a black module with status lights, Ethernet ports and a two-wire green power connector, mounted inside the inverter wiring compartment next to a red battery cable.',
          'An EMS-C mounted inside the inverter wiring compartment. Its four lights are labeled STATUS, CELLULAR, BLUETOOTH and POWER, and it is powered by a two-wire connection (see the EMS-C manual p.13).',
          ['rev4'],
          [src('author'), src('emsc', 6, 8, 13)],
        ),
        {
          type: 'facts',
          title: 'WCM and EMS-C',
          items: [
            fact(
              'The WCM (wireless communication module) is on Revs 1-3 and some Rev 4. The EMS-C replaced it and does the same job, plus a built-in cellular data plan (50 MB) that sends very basic data.',
              [AUTHOR, src('emsc', 13)],
            ),
            fact('When a system is on cellular, the homeowner sees only a blue Wi-Fi icon and no system information.', [AUTHOR]),
            fact('A WCM that still works should be kept when it is replaced with an EMS-C.', [src('emsc', 12)]),
            fact(
              'A system uses only one communication module (WCM or EMS-C), and it stays in the parent inverter. With several inverters, a single EMS-C goes in the designated parent inverter.',
              [AUTHOR, src('emsc', 13)],
            ),
          ],
        },
        image(
          'images/wcm.webp',
          [230, 430],
          'The WCM: a small green circuit board with a QR code on its radio module, two small buttons along the top, and RS485 and ETH ports at the bottom.',
          'The WCM: a small green circuit board with a QR code, two buttons along the top, and RS485 and ETH ports at the bottom. This Rev 4 training unit was upgraded to an EMS-C, so its WCM (top left of the wiring compartment, above the EMS-C) is not used.',
          ['rev4'],
          [src('author', ), src('emsc', 12, 13)],
        ),
        {
          type: 'facts',
          title: 'Remote shutdown switch',
          items: [
            fact('The remote shutdown switch must use the normally closed position for the inverters to run.', [src('manual', 29)]),
            fact(
              'Opening the circuit (pressing the remote shutdown switch) or turning the power button off turns the inverters off, including the 12V rapid shutdown supply.',
              [src('manual', 28, 29)],
            ),
          ],
        },
        {
          type: 'call',
          customer: 'I pushed the Complete System Shutdown button out but all my lights are still on.',
          answer:
            'With the button really out, the inverter has no power to its control board and the front LED is off. Check that the button is out and which inverter it is, and ask whether a transfer (bypass) switch is in the grid position, which powers the backup loads from the grid instead of the inverter. Turning it off is not the same as safe to work on.',
          sources: [MANUAL_CONTROLS, src('tsm', 32, 35)],
          revisions: ['rev4'],
        },
        todo('What else to check when a customer says the system keeps working after Complete System Shutdown is out (the bypass-switch idea comes from the Technical Service Manual p.32; confirm).'),
        todo('Revs 1-3: confirm what the power button does (the Technical Service Manual p.13 calls a flashing green light standby with the button off) and whether the WCM keeps comms with it off.'),
      ],
    },

    // ---------------------------------------------------------------- 4
    {
      id: 'm2-faults',
      title: 'Fault codes and power cycling',
      summary: 'Reading a fault code, the standard fixes, and how to power cycle an inverter.',
      blocks: [
        {
          type: 'facts',
          title: 'Fault codes',
          items: [
            fact('The Technical Service Manual (9/30/2026) lists 88 alarm, fault and status codes (A1, A2, B1, B4, E1, E3 and F1). Each has a name, a description and troubleshooting. The older Installation Guide table listed only 24 (A1_0 to A1_15 and A2_8 to A2_15) and is out of date for some codes.', [src('tsm', 67, 96), src('san2_2', 32, 33, 34, 35)]),
            fact('In general, an alarm means the system has limited capability, and a fault means the system has shut down to protect itself.', [src('tsm', 67)]),
            fact('All fault and alarm codes apply to all Sanctuaries.', [AUTHOR]),
            fact('If an alarm or fault does not clear after the cause has been fixed, power-cycle the inverter(s). For persistent alarms, contact the Lion Energy ESS Support team.', [src('tsm', 67)]),
          ],
        },
        {
          type: 'call',
          customer: 'The app shows A1_2 and my battery says disconnected.',
          answer:
            'A1_2 is Battery Disconnected. Check the battery terminals and the battery cables to the inverter, and compare the battery voltage on the inverter against the batteries. If the inverter is around 11 V, try the battery wake-up function. If it is connected, the fault persists and the voltage is in range, power cycle the inverter.',
          sources: [src('tsm', 67, 68), src('san2_2', 32)],
          revisions: 'all',
        },
        {
          type: 'call',
          customer: 'My install just finished and the app shows A1_12.',
          answer:
            'A1_12 is named Grid CT is Reversed, but do not rely on it: the Technical Service Manual says the alarm does not detect improper CT installation. Check the CTs yourself. The arrow should point away from the inverter.',
          sources: [src('tsm', 74)],
          revisions: 'all',
        },
        {
          type: 'call',
          customer: 'The installer just hooked up the batteries and I have A2_10.',
          answer:
            'A2_10 is named Battery is Reverse Polarity, but the Technical Service Manual calls it a place-holder: the inverter has no reverse polarity protection on the battery terminal. Check that battery positive goes to the positive terminal and negative to the negative terminal.',
          sources: [src('tsm', 78)],
          revisions: 'all',
        },
        {
          type: 'facts',
          title: 'Power cycling (Rev 4)',
          items: [
            fact('1. Turn off the grid breaker. (Find it first: the technician has to locate it.)', [AUTHOR], ['rev4']),
            fact('2. Turn off the PV switch.', [AUTHOR], ['rev4']),
            fact('3. Push out the AC/DC button.', [AUTHOR], ['rev4']),
            fact('4. Push out the Complete System Shutdown button.', [AUTHOR], ['rev4']),
            fact('5. Wait about 30 seconds, until the relays click and the normal light on the face of the inverter turns off.', [AUTHOR, src('tsm', 56)], ['rev4']),
            fact('6. Repeat in reverse order.', [AUTHOR], ['rev4']),
            fact('It takes about two minutes for the inverter to fully power back on.', [AUTHOR], ['rev4']),
            fact(
              'Then check the EMS-C. Its status light should change to solid, meaning it is connected to the internet. That can take a minute or two longer.',
              [AUTHOR, src('emsc', 6)],
              ['rev4'],
            ),
          ],
        },
        todo('Power cycle steps for Revs 1-3 (single power button and DC switch).'),
      ],
    },
  ],

  quiz: {
    passMark: 0.8,
    questions: [
      question({
        id: 'm2-q-pv-disconnect',
        lessonId: 'm2-controls',
        prompt: 'What does the PV Disconnect control?',
        correct: ['Whether the inverter accepts solar power'],
        wrong: ['Whether the loads are powered', 'Whether the controller can communicate', 'Whether the battery charges from the grid'],
        explanation: 'PV Disconnect controls whether the inverter accepts solar power or not. Loads are controlled by AC/DC Power.',
        sources: [MANUAL_CONTROLS],
        revisions: ['rev4'],
      }),
      question({
        id: 'm2-q-acdc-off',
        lessonId: 'm2-controls',
        prompt: 'On a Rev 4 inverter, what happens when AC/DC is turned off?',
        correct: ['No PV power is used and the inverter loads are powered off'],
        wrong: ['Nothing changes', 'Only the battery is disconnected', 'Every component of the inverter turns off'],
        explanation:
          'AC/DC off means no PV power is used and the loads are powered off. Turning off all components is what Complete System Shutdown does.',
        sources: [MANUAL_CONTROLS],
        revisions: ['rev4'],
      }),
      question({
        id: 'm2-q-dc-switch',
        lessonId: 'm2-controls',
        prompt: 'On Revs 1-3, what is the "DC switch"?',
        correct: ['The PV disconnect'],
        wrong: ['The battery breaker', 'The remote shutdown switch', 'The generator start switch'],
        explanation: 'The DC switch is the PV disconnect. "DC" is for DC voltage. The power button handles on and off.',
        sources: [AUTHOR],
        revisions: ['rev1', 'rev2', 'rev3'],
      }),
      question({
        id: 'm2-q-solid-green',
        lessonId: 'm2-lights',
        prompt: 'The light is solid green. What does that mean?',
        correct: ['The system has no alarms'],
        wrong: ['The battery is fully charged', 'The system is in a fault state', 'The system is off'],
        explanation: 'Solid green means no alarms. It does not tell you the battery state of charge.',
        sources: [MANUAL_CONTROLS],
      }),
      question({
        id: 'm2-q-blinking-green',
        lessonId: 'm2-lights',
        prompt: 'A customer says the light is blinking green. What is the best next step?',
        correct: ['It is an alarm: have them check the Lion Energy app to identify it'],
        wrong: [
          'It is a fault: tell them the inverter has shut down to protect itself',
          'Tell them the system is off',
          'Have them replace the inverter',
        ],
        explanation:
          'Blinking green is an alarm, which can be as simple as the battery being below its target state of charge. The app shows which alarm it is. Red, not blinking green, is the fault.',
        sources: [MANUAL_CONTROLS],
      }),
      question({
        id: 'm2-q-red',
        lessonId: 'm2-lights',
        prompt: 'The light is red (or looks orange). What does that mean?',
        correct: ['A fault: the inverter shuts down to protect itself'],
        wrong: ['An alarm that can be ignored', 'The system is off', 'The battery is charging normally'],
        explanation:
          'Red is a fault state and the inverter shuts down to protect itself. The LED can look orange to some people, so treat orange or red as a fault.',
        sources: [MANUAL_CONTROLS, AUTHOR],
      }),
      trueFalse({
        id: 'm2-q-alarms-clear',
        lessonId: 'm2-lights',
        prompt: 'Alarms can clear on their own and can occur before commissioning is complete.',
        answer: true,
        explanation: 'Alarms can be cleared automatically and may occur when the system is not yet fully commissioned. Some alarms and faults do need a power cycle.',
        sources: [MANUAL_CONTROLS],
      }),
      question({
        id: 'm2-q-no-light',
        lessonId: 'm2-lights',
        prompt: 'A customer says there is no light, but the buttons are pushed in. What does that suggest?',
        correct: ['A problem with the unit: possible internal damage, or a bad LED if fans and relays can be heard'],
        wrong: [
          'The system is simply off',
          'The battery is below its target state of charge',
          'Solar is not being accepted',
        ],
        explanation:
          'Pushed in means on, so there should be a light. The manual says to contact the installer. Per the author, it could be internal damage, or the LED could be bad if fan noise and relay clicks are heard.',
        sources: [MANUAL_CONTROLS, AUTHOR],
      }),
      question({
        id: 'm2-q-shutdown-off',
        lessonId: 'm2-shutdown',
        prompt: 'What does turning Complete System Shutdown off do on a Rev 4?',
        correct: ['It turns off all components of the inverter: the control board is off, the LED is off, and you cannot communicate with it'],
        wrong: ['It only turns off the loads and PV, like AC/DC', 'It turns off only the EMS-C', 'Nothing while the grid is on'],
        explanation:
          'Complete System Shutdown turns off all components of the inverter (manual p.10). The control board and battery power run through that button, so with it off the LED is off and the inverter cannot be reached (Technical Service Manual p.35). AC/DC only turns off the loads and PV.',
        sources: [MANUAL_CONTROLS, src('tsm', 35)],
        revisions: ['rev4'],
      }),
      question({
        id: 'm2-q-external-sources',
        lessonId: 'm2-shutdown',
        prompt: 'Which of these are external power sources? Select all that apply.',
        correct: ['Grid', 'Generator', 'AC solar', 'Solar (PV) with the PV Disconnect on'],
        wrong: ['The battery', 'Solar (PV) with the PV Disconnect off'],
        explanation:
          'Grid, solar, AC solar, generator, and (very rarely) wind are external sources. PV only counts while the PV Disconnect is on. The battery is not an external source.',
        sources: [AUTHOR],
      }),
      question({
        id: 'm2-q-emsc-acdc',
        lessonId: 'm2-shutdown',
        prompt: 'On a Rev 4 system with an EMS-C, what happens to comms when AC/DC is turned off?',
        correct: ['The EMS-C loses its 12V supply and goes offline'],
        wrong: ['Comms stay up, because the controller is always powered', 'The EMS-C switches to its own battery permanently', 'Nothing: comms depend only on Wi-Fi'],
        explanation:
          'The EMS-C is powered by the inverter\'s 12V supply, which turns off when AC power is turned off. Its integrated backup battery is only mentioned for keeping it on while parallel inverters are power-cycled during commissioning. Settings and firmware updates work only while the EMS-C has power.',
        sources: [src('emsc', 5, 8), AUTHOR],
        revisions: ['rev4'],
      }),
      trueFalse({
        id: 'm2-q-one-comm-module',
        lessonId: 'm2-shutdown',
        prompt: 'In a system with several inverters, every inverter has its own communication module (WCM or EMS-C).',
        answer: false,
        explanation:
          'A system uses only one communication module, and it stays in the parent inverter. With several inverters, a single EMS-C goes in the designated parent inverter.',
        sources: [AUTHOR, src('emsc', 13)],
      }),
      question({
        id: 'm2-q-remote-shutdown',
        lessonId: 'm2-shutdown',
        prompt: 'How must a remote shutdown switch be wired for the inverters to run?',
        correct: ['Normally closed; opening the circuit shuts the inverters off'],
        wrong: ['Normally open; closing the circuit shuts the inverters off', 'It does not matter', 'It must be wired to the generator start'],
        explanation:
          'The switch should use the normally closed position so the inverters can run. Opening the circuit shuts them off, including the 12V rapid shutdown supply.',
        sources: [src('manual', 28, 29)],
      }),
      question({
        id: 'm2-q-fault-a1-2',
        lessonId: 'm2-faults',
        prompt: 'A customer sees fault A1_2. What is it, and what do you check first?',
        correct: ['Battery Disconnected: check that the battery terminals and cables to the inverter are connected'],
        wrong: ['Grid CT is Reversed: flip the CT', 'Battery is Reverse Polarity: swap the battery cables', 'Grid Low Voltage: check the grid input type'],
        explanation:
          'A1_2 is Battery Disconnected. Ensure the battery terminals and cables are connected, compare the battery voltage on the inverter against the batteries (about 11 V means try the battery wake-up function), and power cycle if it is connected and in range but the fault persists.',
        sources: [src('tsm', 67, 68), src('san2_2', 32)],
      }),
      question({
        id: 'm2-q-fault-a1-12',
        lessonId: 'm2-faults',
        prompt: 'Fault A1_12 appears right after an installation. What should you know about it?',
        correct: ['It is named Grid CT is Reversed, but it does not reliably detect improper CT installation, so check the CTs yourself'],
        wrong: ['The battery is disconnected', 'The inverters in a parallel system cannot communicate', 'The battery is too cold'],
        explanation: 'A1_12 is named Grid CT is Reversed, but the Technical Service Manual says not to rely on it: it does not detect improper CT installation. Check that the CT arrow points away from the inverter, and see the CT manual.',
        sources: [src('tsm', 74)],
      }),
      question({
        id: 'm2-q-power-cycle-first',
        lessonId: 'm2-faults',
        prompt: 'What is the first step when power cycling a Rev 4 inverter?',
        correct: ['Turn off the grid breaker'],
        wrong: ['Push out the Complete System Shutdown button', 'Turn the PV switch on', 'Push in the AC/DC button'],
        explanation:
          'Order: grid breaker off, PV switch off, AC/DC out, Complete System Shutdown out, wait about 30 seconds until the relays click and the light is off, then repeat in reverse order.',
        sources: [AUTHOR, src('tsm', 56)],
        revisions: ['rev4'],
      }),
      question({
        id: 'm2-q-power-cycle-verify',
        lessonId: 'm2-faults',
        prompt: 'After a power cycle, how do you confirm an EMS-C system is back online?',
        correct: ['The EMS-C status light turns solid, meaning it is connected to the internet'],
        wrong: ['The EMS-C light turns off', 'The inverter beeps three times', 'The grid breaker trips'],
        explanation: 'The inverter takes about two minutes to power back on. Then the EMS-C status light should become solid, which can take another minute or two.',
        sources: [AUTHOR, src('emsc', 6)],
        revisions: ['rev4'],
      }),
    ],
  },

  sim: {
    id: 'inverter-panel',
    kind: 'inverter-panel',
    title: 'Interactive inverter panel',
    intro: 'Flip the switches and watch the status. Then diagnose customer symptoms.',
  },
}

export default mod
