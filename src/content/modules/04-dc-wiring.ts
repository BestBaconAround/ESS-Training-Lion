import type { Module } from '../types'
import { fact, image, question, src, todo, trueFalse } from '../helpers'

const AUTHOR = src('author')

const mod: Module = {
  id: 'dc-wiring-batteries',
  number: 4,
  title: 'DC Wiring and Batteries',
  summary: 'Checking batteries, wiring them to the inverter, solar (PV) wiring, and the ground leakage test.',
  status: 'ready',
  outline: [
    { text: 'Battery voltage check before wiring', sources: [src('manual', 20)] },
    { text: 'Paralleling procedure and wiring order, BMS communication cable', sources: [src('manual', 20, 21, 22, 23, 24, 25)] },
    { text: 'A battery that will not wake up or address', sources: [AUTHOR] },
    { text: 'PV input: MPPTs, voltage and current limits, Dual MPPT mode, optimizers', sources: [src('manual', 26, 27)] },
    { text: 'PV must never be grounded, and the PV-to-ground leakage test', sources: [src('manual', 27)] },
    { text: 'Battery specifications and rapid shutdown power', sources: [src('manual', 28, 44)] },
  ],

  lessons: [
    // ---------------------------------------------------------------- 1
    {
      id: 'm4-battery-check',
      title: 'Checking the batteries before wiring',
      summary: 'The voltage rules, and what to do when a battery is out of range.',
      blocks: [
        {
          type: 'facts',
          title: 'The rules',
          items: [
            fact(
              'Before batteries are connected in parallel they should be within 0.5V of each other. If they are not, excessively high current may flow between the batteries when they are connected in parallel.',
              [src('manual', 20, 22), src('san2_3', 17)],
            ),
            fact(
              'The voltage of a battery should be between 51 and 55.6 VDC before wiring. If it is not, contact LionESS support at (435) 244-3352. (The manual says 45-55.6 VDC: that is a typo. Use 51-55.6.)',
              [src('manual', 21), src('emsc', 16), AUTHOR],
            ),
            fact(
              'Above 53.5V resting voltage at room temperature, a battery is probably above 98% charged. It can be quickly discharged down to 53.5V by running the inverter using battery power as its only power source.',
              [src('manual', 20)],
            ),
            fact(
              'Below 51.2V resting voltage at room temperature, a battery is probably below 7% charged. It should be charged up to within 0.5V of the other batteries before connecting them in parallel.',
              [src('manual', 20)],
            ),
            fact('The battery BMS goes to sleep below 51 VDC. That is why the acceptable range starts at 51.', [AUTHOR]),
            fact('Check the battery voltage before installing the battery on the wall, in case it is faulty.', [AUTHOR]),
          ],
        },
        {
          type: 'callout',
          tone: 'note',
          text: 'The 0.5V figure is the recommendation. In practice it is not a big deal if batteries differ by more: the battery cables are designed to be disconnected without touching the breaker, and most installers do not check battery voltage and there have been no issues. Teach the recommendation, then the field reality.',
          sources: [AUTHOR],
          revisions: 'all',
        },
        {
          type: 'call',
          customer: 'My installer measured 51.1V on one battery and about 53.0V on the other two.',
          answer:
            '51.1V is inside the 51-55.6V range, but it is below 51.2V, so that battery is probably under 7% charged. It should be charged up to within 0.5V of the others before it is paralleled. Use the paralleling procedure and plug in the lowest battery first.',
          sources: [src('manual', 20), AUTHOR],
          revisions: 'all',
        },
        {
          type: 'call',
          customer: 'One battery reads 54.1V and the other reads 52.9V. Is that OK?',
          answer:
            'That is 1.2V apart, outside the 0.5V recommendation. The 54.1V battery is above 53.5V, so it is probably over 98% charged and can be quickly discharged to 53.5V by running the inverter on battery only. Or follow the paralleling procedure and plug in the lowest battery first. In the field a spread like this is usually not a big problem.',
          sources: [src('manual', 20), AUTHOR],
          revisions: 'all',
        },
      ],
    },

    // ---------------------------------------------------------------- 2
    {
      id: 'm4-paralleling',
      title: 'Paralleling: lowest battery first',
      summary: 'The six-step procedure for bringing batteries onto the inverter.',
      blocks: [
        {
          type: 'facts',
          title: 'Procedure',
          items: [
            fact(
              '1. Start with only the negative power cable connected to each battery, with the positive cable on each battery unplugged. This may trigger a battery disconnected alarm.',
              [src('manual', 20)],
            ),
            fact(
              '2. Temporarily change settings. Single inverter: set "inverter max charge current" to no more than 140A. Parallel inverters: set "system charge current" to no more than 140A. If there is not enough solar power, set the inverters to battery priority mode so the batteries charge using grid power.',
              [src('manual', 20)],
            ),
            fact(
              '3. Check the voltage on the inverter battery terminals. If it is below 40V, use the battery awaken function in the web app. After a minute the voltage should rise above 50V. Then plug in the positive cable of the lowest-voltage battery.',
              [src('manual', 20)],
            ),
            fact(
              '4. After the lowest battery is charged up to within 0.5V of the next lowest battery, plug in the positive cable of the next lowest battery.',
              [src('manual', 20)],
            ),
            fact('5. Continue charging and repeat step 4 until all batteries are plugged in.', [src('manual', 20)]),
            fact(
              '6. Change the charge current back to its original setting, and turn battery priority mode off.',
              [src('manual', 20), AUTHOR],
            ),
          ],
        },
        {
          type: 'callout',
          tone: 'note',
          text: 'Battery priority mode is the setting name a technician sees. Homeowners do not have access to it. They see the same setting named "emergency mode". The manual (p.20) calls it "emergency mode" in step 6. Teach both names.',
          sources: [AUTHOR, src('manual', 20)],
          revisions: 'all',
        },
        {
          type: 'facts',
          title: 'Good to know',
          items: [
            fact(
              'Two things are hooked up in parallel: the parallel communication wire between inverters and the battery cables. Both are hooked up during commissioning when the Technician app directs it.',
              [AUTHOR],
            ),
            fact('Battery awaken only works on a system that has been commissioned.', [AUTHOR]),
            fact('The manual says the voltage-check steps "can be completed after commissioning the system."', [src('manual', 20)]),
          ],
        },
        todo('Confirm whether the battery-cable steps above happen during commissioning (as the Technician app directs) or after it, as manual p.20 says.'),
        {
          type: 'call',
          customer: 'Which battery do I plug in first?',
          answer:
            'The positive cable of the battery with the lowest voltage. Add the next lowest once the lowest is within 0.5V of it. Repeat until all are in. Connecting batteries that are more than 0.5V apart can let excessive current flow between them.',
          sources: [src('manual', 20)],
          revisions: 'all',
        },
      ],
    },

    // ---------------------------------------------------------------- 3
    {
      id: 'm4-wiring',
      title: 'Wiring order and BMS communication',
      summary: 'What goes on first, what goes on last, and how the BMS cables differ by revision.',
      blocks: [
        {
          type: 'facts',
          title: 'One inverter, one battery',
          items: [
            fact('Check the voltage of the battery first (51-55.6 VDC).', [src('manual', 21), AUTHOR]),
            fact('Connect the battery cables to the inverter first. Connect the cables to the battery receptacles last.', [src('manual', 21), src('san2_3', 18)]),
          ],
        },
        {
          type: 'facts',
          title: 'One inverter, several batteries',
          items: [
            fact('Connect the eyelet-to-eyelet battery cables to the inverter first, then to the provided busbars.', [src('manual', 21), src('san2_3', 18)]),
            fact('Connect all negative cables from the negative busbar to the negative battery receptacles.', [src('manual', 21), src('san2_3', 18)]),
            fact('Connect the positive cables from the positive busbar to the positive battery receptacles last.', [src('manual', 21), src('san2_3', 18)]),
            fact(
              'When connecting busbars, the battery cables must be the same length throughout the entire system and have a correct degree and voltage rating.',
              [src('manual', 24), src('san2_3', 18)],
            ),
          ],
        },
        {
          type: 'facts',
          title: 'Several inverters',
          items: [
            fact('Mount busbars directly below each inverter and connect the busbars to each other.', [src('manual', 24)], ['rev4']),
            fact(
              'Connect each inverter to its busbar with the eyelet-to-eyelet cables, then the negative battery cables, then the positive battery cables last.',
              [src('manual', 24)],
              ['rev4'],
            ),
          ],
        },
        image(
          'images/wire-box-cables.webp',
          [845, 634],
          'A red-booted cable and a black-booted cable entering terminals, a 4-pin aviation-style connector, and a labeled busbar with Ethernet cables, inside a wiring compartment.',
          'Cables and connectors in the wiring compartment of the training setup: red and black battery-style cables entering terminals, a 4-pin aviation-style connector, and a busbar with Ethernet cables.',
        ),
        {
          type: 'revisionDiff',
          title: 'BMS communication wiring',
          rows: [
            {
              label: 'Battery BMS cables',
              values: {
                rev1: 'BMS splitter to the inverter BMS Coms port; each battery BMS cable to that battery 4-pin aviation connector',
                rev2: 'BMS splitter to the inverter BMS Coms port; each battery BMS cable to that battery 4-pin aviation connector',
                rev3: 'BMS splitter to the inverter BMS Coms port; each battery BMS cable to that battery 4-pin aviation connector',
                rev4: 'Standard Ethernet (T568A or T568B) daisy chain: parent inverter to battery 1, then battery to battery',
              },
              sources: [src('san2_2', 12), src('san2_3', 18), src('manual', 21)],
            },
          ],
        },
        {
          type: 'facts',
          title: 'Rev 4 and the EMS-C',
          items: [
            fact(
              'The EMS-C battery port is only used during commissioning to set the address on each battery. After commissioning, the BMS cables are moved to the inverter BMS port.',
              [src('emsc', 8), src('video')],
              ['rev4'],
            ),
            fact(
              'With a splitter on the BMS port (Revs 1-3), fault A2_11 (BMS Communication Failure) says: after commissioning, make sure the BMS splitter is plugged into the BMS communication port.',
              [src('san2_2', 34)],
              ['rev1', 'rev2', 'rev3'],
            ),
          ],
        },
        {
          type: 'call',
          customer: 'Do I connect the cables to the battery first, or the inverter?',
          answer: 'The inverter first. The cables go on the battery receptacles last, and with several batteries the positive cables go on last of all.',
          sources: [src('manual', 21)],
          revisions: 'all',
        },
      ],
    },

    // ---------------------------------------------------------------- 4
    {
      id: 'm4-dead-battery',
      title: 'A battery that will not wake up',
      summary: 'The troubleshooting ladder for a battery that does not address, and why battery awaken is not the answer.',
      blocks: [
        {
          type: 'facts',
          title: 'When the battery does not address',
          items: [
            fact(
              'If the battery does not address during commissioning and its voltage is absent or below 51V, it needs to be charged. The system is not commissioned yet, so battery awaken is not available.',
              [AUTHOR],
            ),
            fact(
              'Remove the battery cover (16 screws, 4mm). Connect the alligator clips of the 60V variable DC power supply to the positive and negative terminals at the top of the battery, inside.',
              [AUTHOR],
            ),
            fact('Set the power supply to 52 VDC at 5A (5A because that is what the supply can deliver). Stop charging when the battery reaches 51.5 VDC.', [AUTHOR]),
            fact('Follow standard electrical safety for this voltage.', [AUTHOR]),
            fact(
              'If it still will not address after charging: swap the BMS cable for another Cat5/6 cable and try again. If that does not work, restart the commissioning process and power cycle the system.',
              [AUTHOR],
            ),
          ],
        },
        {
          type: 'callout',
          tone: 'note',
          text: 'Restarting commissioning here is only for a system that never finished its first commissioning. Re-commissioning a commissioned system is not a troubleshooting tool.',
          sources: [AUTHOR, src('emsc', 16)],
          revisions: 'all',
        },
        {
          type: 'call',
          customer: 'The installer says the app will not find battery 2 and it reads 0 volts.',
          answer:
            'Below 51V the BMS is asleep, and battery awaken is not available before commissioning. Charge it with the power supply at 52V and 5A until it reaches 51.5V, then try to address it again. If it still will not address, swap the BMS cable, then restart commissioning and power cycle.',
          sources: [AUTHOR],
          revisions: 'all',
        },
        todo('What to do for a commissioned system with a battery below 51V (not covered by the sources). If it is still not working, contact ESS Support at (435) 244-3352.'),
      ],
    },

    // ---------------------------------------------------------------- 5
    {
      id: 'm4-pv',
      title: 'PV input and limits',
      summary: 'The four MPPTs, voltage and current limits by revision, and the Rev 4 settings.',
      blocks: [
        {
          type: 'facts',
          title: 'All revisions',
          items: [
            fact('The inverter has 4 MPPTs, each capable of 3kW of solar, for a total of 12kW.', [src('manual', 26), src('san2_3', 22), src('san2_2', 16)]),
            fact('The maximum open circuit voltage is 500V.', [src('manual', 26), src('san2_3', 22), src('san2_2', 16)]),
            fact('The inverter accepts up to 10 AWG wire for PV connections.', [src('manual', 27), src('san2_3', 23), src('san2_2', 17)]),
            fact(
              'Before the final DC connection or turning on the DC switch, make sure positive connects to positive and negative to negative.',
              [src('manual', 26), src('san2_3', 22), src('san2_2', 16)],
            ),
          ],
        },
        image(
          'images/inverter-wiring-compartment.png',
          [326, 440],
          'The inverter wiring compartment with its clear cover swung open, showing the control board and Ethernet cables at the top, rows of terminals in the middle, and an EMS-C at the lower left.',
          'The inverter wiring compartment with its clear cover swung open: the control board and Ethernet cables at the top, the PV and AC terminal rows in the middle, and the EMS-C at the lower left.',
        ),
        image(
          'images/inverter-pv-terminals-and-board.png',
          [590, 443],
          'Close-up of the PV terminal row labeled PV1+ to PV4+ and PV1- to PV4-, with three Ethernet cables plugged into the control board above it.',
          'Close-up: the PV terminals are labeled PV1+ to PV4+ and PV1- to PV4-. Three Ethernet cables are plugged into ports on the control board above them.',
        ),
        {
          type: 'revisionDiff',
          title: 'PV limits by revision',
          rows: [
            {
              label: 'Usable / minimum voltage',
              values: { rev1: '150 VDC minimum (p.16)', rev2: '150 VDC minimum (p.16)', rev3: '120 V DC minimum', rev4: '120V to 500V usable' },
              sources: [src('san2_2', 16), src('san2_3', 22), src('manual', 26)],
            },
            {
              label: 'Max PV short circuit current (Isc)',
              values: { rev1: '13A per MPPT (p.16)', rev2: '13A per MPPT (p.16)', rev3: '15A per MPPT', rev4: '22A' },
              sources: [src('san2_2', 16), src('san2_3', 22), src('manual', 26)],
            },
            {
              label: 'Max input current per MPPT (spec table)',
              values: { rev1: '12A x4', rev2: '12A x4', rev3: '12A x4', rev4: '14A x4' },
              sources: [src('san2_2', 36), src('san2_3', 39), src('manual', 44)],
            },
          ],
        },
        todo(
          'Revs 1-2: the Rev 2 guide gives 150 VDC minimum and 13A Isc on p.16, but its spec table (p.36) gives a 120-500V MPPT range and 15A Isc. Confirm which is right.',
        ),
        {
          type: 'facts',
          title: 'Rev 4 extras',
          items: [
            fact(
              'Account for the increase in panel voltage at low temperatures so the 500V maximum open circuit voltage is never exceeded.',
              [src('manual', 26)],
              ['rev4'],
            ),
            fact(
              'Dual MPPT mode puts MPPT 1&2 and MPPT 3&4 in parallel, effectively two 6kW MPPTs. The parallel connection is made manually, external to the inverter. Change the setting Solar Input Type from "Independent" to "Dual MPPT".',
              [src('manual', 26)],
              ['rev4'],
            ),
            fact(
              'If the panels use optimizers such as Tigo TS4-A-O, enable the setting "PV Optimizer" after commissioning. It is no problem to enable it even if there are no optimizers.',
              [src('manual', 26)],
              ['rev4'],
            ),
            fact('Use a surge protection device on the PV lines. Otherwise lightning damage to a PV module may damage the system.', [src('manual', 27), src('san2_2', 17)], ['rev1', 'rev2', 'rev4']),
            fact(
              'Make PV connections while the unit is powered off. The PV(-) terminals are typically at -240V DC while the unit is in operation.',
              [src('manual', 26), src('san2_3', 22)],
              ['rev3', 'rev4'],
            ),
          ],
        },
        todo('Cold-temperature voltage: the manual says to refer to the technical specifications, which do not give a temperature coefficient. Do not calculate a corrected voltage until the author supplies the data.'),
        todo('The manual says to use the recommended PV cable size "given in the table below", but no table is in the document. Only "up to 10 AWG" is sourced.'),
      ],
    },

    // ---------------------------------------------------------------- 6
    {
      id: 'm4-leakage',
      title: 'Ungrounded PV and the leakage test',
      summary: 'Why PV is never grounded, and how to test for a path to ground before power-up.',
      blocks: [
        {
          type: 'callout',
          tone: 'warning',
          text: 'DO NOT ground the PV lines. If the grid is turned on while PV(-) is connected to ground, catastrophic failure will occur.',
          sources: [src('manual', 27)],
          revisions: ['rev4'],
        },
        {
          type: 'facts',
          title: 'Revs 1-3 wording',
          items: [
            fact('Only the PV racking is grounded. The inverter PV wiring must not have any path to ground.', [src('san2_3', 23)], ['rev3']),
            fact('Be sure there is no negative grounding. Grounded PV modules will cause current leakage to the inverter.', [src('san2_2', 17)], ['rev1', 'rev2']),
          ],
        },
        {
          type: 'facts',
          title: 'What to expect',
          items: [
            fact(
              'There can be voltage between PV(+) and PV(-), but there should not be any voltage between PV(+) and GND or PV(-) and GND. If there is, it indicates a current path.',
              [src('manual', 27)],
              ['rev4'],
            ),
            fact('During on-grid operation the PV(-) terminals are usually around -240V DC with respect to GND.', [src('manual', 27)], ['rev4']),
          ],
        },
        {
          type: 'facts',
          title: 'The PV-to-GND leakage test',
          items: [
            fact('1. Rotate the PV Disconnect switch to the off position.', [src('manual', 27)], ['rev4']),
            fact(
              '2. Measure voltage between PV(-) and GND. You should get about 0V. If it is about 0V, measure continuity between PV(-) and GND. It should read open circuit.',
              [src('manual', 27)],
              ['rev4'],
            ),
            fact(
              '3. Measure voltage between PV(+) and GND. You should get about 0V. If it is about 0V, measure continuity between PV(+) and GND. It should read open circuit.',
              [src('manual', 27), AUTHOR],
              ['rev4'],
            ),
            fact(
              '4. If module level power electronics (MLPE) are used, this test may not detect a PV-to-ground leakage path if the Rapid Solar Shutdown (RSS) system is not turning the PV panels on.',
              [src('manual', 27)],
              ['rev4'],
            ),
          ],
        },
        {
          type: 'callout',
          tone: 'note',
          text: 'The manual\'s step 3 says to check continuity between PV(-) and GND a second time. That is a typo. Step 3 checks continuity between PV(+) and GND.',
          sources: [AUTHOR, src('manual', 27)],
          revisions: ['rev4'],
        },
        todo('Confirm whether the same leakage test applies to Revs 1-3 (the Rev 2 and Rev 3 guides only say the PV wiring must have no path to ground).'),
        {
          type: 'facts',
          title: 'The inverter checks too',
          items: [
            fact(
              'At first power-up, about a minute after the PV Disconnect is turned on, the inverter runs a PV insulation check. You might hear the relay clicking. If the front panel LED turns orange or red, it failed. Do not proceed until the PV wiring has no path from PV(+) to GND or PV(-) to GND.',
              [src('manual', 42), AUTHOR],
              ['rev4'],
            ),
            fact('Do not turn on any grid breaker until the PV wiring is fixed. Otherwise catastrophic equipment failure may occur.', [src('manual', 42)], ['rev4']),
          ],
        },
        {
          type: 'call',
          customer: 'My installer measured 0V from PV(+) to ground but the meter beeped on continuity. Can we power it up?',
          answer:
            'No. Even at about 0V, continuity from PV(+) to GND should read open circuit. A beep means there is a path to ground. Do not power up. Fix the PV wiring first.',
          sources: [src('manual', 27, 42)],
          revisions: ['rev4'],
        },
      ],
    },

    // ---------------------------------------------------------------- 7
    {
      id: 'm4-specs-rsd',
      title: 'Battery specs and rapid shutdown',
      summary: 'The battery numbers that differ by revision, and the 12V rapid shutdown supply.',
      blocks: [
        {
          type: 'revisionDiff',
          title: 'Battery specifications',
          rows: [
            {
              label: 'Capacity',
              values: { rev1: '13.5kWh (13,875.2Wh)', rev2: '13.5kWh (13,875.2Wh)', rev3: '13.5kWh (13,875.2Wh)', rev4: '14.3kWh' },
              sources: [src('san2_2', 36), src('san2_3', 39), src('manual', 44)],
            },
            {
              label: 'Voltage range',
              values: { rev1: '40 - 55.6 VDC', rev2: '40 - 55.6 VDC', rev3: '40 - 55.6 VDC', rev4: '40 - 58.4 VDC (rated 51.2 VDC)' },
              sources: [src('san2_2', 36), src('san2_3', 39), src('manual', 44)],
            },
            {
              label: 'Charging temperature / current',
              values: { rev1: '32 to 86 F / 150A', rev2: '32 to 86 F / 150A', rev3: '32 to 86 F / 150A', rev4: '32 to 131 F / 150A' },
              sources: [src('san2_2', 36), src('san2_3', 39), src('manual', 44)],
            },
            {
              label: 'Discharging temperature / current',
              values: { rev1: '-4 to 86 F / 160A', rev2: '-4 to 86 F / 160A', rev3: '-4 to 86 F / 160A', rev4: '-4 to 131 F / 160A' },
              sources: [src('san2_2', 36), src('san2_3', 39), src('manual', 44)],
            },
            {
              label: 'Derates',
              values: { rev4: 'Below 50 F and above 104 F' },
              sources: [src('manual', 44)],
            },
          ],
        },
        {
          type: 'facts',
          title: 'All revisions',
          items: [
            fact('The battery is lithium iron phosphate (LFP). Up to 3 batteries per inverter.', [src('manual', 44), src('san2_3', 39)]),
          ],
        },
        {
          type: 'facts',
          title: 'Rapid shutdown',
          items: [
            fact(
              'The NEC requires a rapid shutdown system for PV systems on buildings, for first responder safety (NEC section 690.12).',
              [src('manual', 28)],
            ),
            fact(
              'The inverter has a built-in 12 VDC, 1A power supply for a rapid shutdown (RS) transmitter on the pins labeled +12V_COM and GND_COM. The transmitter is polarity sensitive.',
              [src('manual', 28)],
            ),
            fact(
              'When the remote shutdown switch is pressed (open circuit), or the power button is turned off, the inverters turn off, including this 12V power source.',
              [src('manual', 28)],
            ),
          ],
        },
        {
          type: 'call',
          customer: 'The installer wired the rapid shutdown transmitter backwards. Does that matter?',
          answer: 'Yes. The RS transmitter is polarity sensitive. It connects to +12V_COM and GND_COM, the inverter built-in 12 VDC, 1A supply.',
          sources: [src('manual', 28)],
          revisions: 'all',
        },
      ],
    },
  ],

  quiz: {
    passMark: 0.8,
    questions: [
      question({
        id: 'm4-q-spread',
        lessonId: 'm4-battery-check',
        prompt: 'How close should batteries be to each other before they are paralleled?',
        correct: ['Within 0.5V'],
        wrong: ['Within 5V', 'Within 0.05V', 'They do not need to be close'],
        explanation: 'Batteries should be within 0.5V of each other. If not, excessively high current may flow between them when connected in parallel. In the field a larger spread is usually not a big problem, but 0.5V is the recommendation.',
        sources: [src('manual', 20), AUTHOR],
      }),
      question({
        id: 'm4-q-range',
        lessonId: 'm4-battery-check',
        prompt: 'What is the acceptable battery voltage before wiring?',
        correct: ['51 to 55.6 VDC'],
        wrong: ['45 to 55.6 VDC', '40 to 58.4 VDC', '53.5 to 55.6 VDC'],
        explanation: 'The acceptable range is 51-55.6 VDC. The manual says 45-55.6, which is a typo. The BMS goes to sleep below 51 VDC. 40-58.4 VDC is the Rev 4 battery operating range, not the wiring check.',
        sources: [src('manual', 21, 44), AUTHOR],
      }),
      question({
        id: 'm4-q-high',
        lessonId: 'm4-battery-check',
        prompt: 'A battery rests at 54.0V at room temperature. What does that suggest?',
        correct: ['It is probably above 98% charged and can be quickly discharged to 53.5V on battery power'],
        wrong: ['It is under 7% charged', 'It is faulty and must be replaced', 'It is out of range and cannot be wired'],
        explanation: 'Above 53.5V resting at room temperature, a battery is probably above 98% charged. 54.0V is also inside the 51-55.6V range. Running the inverter on battery only brings it down to 53.5V.',
        sources: [src('manual', 20)],
      }),
      question({
        id: 'm4-q-low',
        lessonId: 'm4-battery-check',
        prompt: 'A battery reads 51.1V at rest, and the others read 53.0V. What do you do?',
        correct: ['It is in range but probably under 7% charged: charge it to within 0.5V of the others before paralleling'],
        wrong: ['Wire it as is', 'It is out of range: do not wire it', 'Discharge the others down to 51.1V'],
        explanation: 'Below 51.2V a battery is probably under 7% charged and should be charged to within 0.5V of the others before paralleling. 51.1V is still inside the 51-55.6V acceptable range.',
        sources: [src('manual', 20), AUTHOR],
      }),
      question({
        id: 'm4-q-first',
        lessonId: 'm4-paralleling',
        prompt: 'Which battery positive cable is plugged in first when paralleling?',
        correct: ['The battery with the lowest voltage'],
        wrong: ['The battery with the highest voltage', 'Whichever is closest', 'All positives at once'],
        explanation: 'Plug in the positive of the lowest-voltage battery first. Add the next lowest once the lowest is within 0.5V of it, and repeat.',
        sources: [src('manual', 20)],
      }),
      question({
        id: 'm4-q-neg-first',
        lessonId: 'm4-paralleling',
        prompt: 'At the start of paralleling, which battery cables are connected?',
        correct: ['Only the negative cables. The positives stay unplugged'],
        wrong: ['Only the positive cables', 'Both, with the breaker off', 'None until the inverter is commissioned'],
        explanation: 'Start with only the negative cable on each battery and the positives unplugged. This may trigger a battery disconnected alarm.',
        sources: [src('manual', 20)],
      }),
      question({
        id: 'm4-q-charge-current',
        lessonId: 'm4-paralleling',
        prompt: 'What temporary charge current limit is used while paralleling?',
        correct: ['140A or less'],
        wrong: ['40A or less', '190A or less', 'No limit'],
        explanation: 'Set "inverter max charge current" (single inverter) or "system charge current" (parallel inverters) to no more than 140A, then restore the original setting afterward.',
        sources: [src('manual', 20)],
      }),
      question({
        id: 'm4-q-priority',
        lessonId: 'm4-paralleling',
        prompt: 'There is not enough solar to charge the batteries during paralleling. What setting do you use, and what does the homeowner call it?',
        correct: ['Battery priority mode, which the homeowner sees as "emergency mode"'],
        wrong: ['Battery awaken', 'Dual MPPT mode', 'The remote shutdown switch'],
        explanation: 'Battery priority mode lets the batteries charge from grid power. Homeowners cannot access it. They see the same setting as "emergency mode". Turn it off again afterward.',
        sources: [src('manual', 20), AUTHOR],
      }),
      question({
        id: 'm4-q-awaken',
        lessonId: 'm4-dead-battery',
        prompt: 'A battery will not address during commissioning and reads 0V. Why can you not use battery awaken?',
        correct: ['Battery awaken only works on a commissioned system'],
        wrong: ['Battery awaken is only for batteries above 53.5V', 'Battery awaken needs the battery cover on', 'Battery awaken is only for Rev 4'],
        explanation: 'The system is not commissioned yet, and battery awaken is only available after commissioning. Charge the battery with the 60V variable DC power supply instead.',
        sources: [AUTHOR],
      }),
      question({
        id: 'm4-q-supply',
        lessonId: 'm4-dead-battery',
        prompt: 'What are the power supply settings to charge a dead battery, and when do you stop?',
        correct: ['52 VDC at 5A, and stop when the battery reaches 51.5 VDC'],
        wrong: ['60 VDC at 20A, and stop at 58.4 VDC', '48 VDC at 1A, and stop at 40 VDC', '52 VDC at 5A, and stop at 55.6 VDC'],
        explanation: 'Set the supply to 52 VDC at 5A (5A is what it can deliver). Stop charging at 51.5 VDC. Follow standard electrical safety for this voltage.',
        sources: [AUTHOR],
      }),
      question({
        id: 'm4-q-after-charge',
        lessonId: 'm4-dead-battery',
        prompt: 'The battery is charged to 51.5V but still will not address. What is the next step?',
        correct: ['Swap the BMS cable for another Cat5/6 cable and try again'],
        wrong: ['Replace the inverter', 'Charge it to 58.4V', 'Turn on emergency mode'],
        explanation: 'After charging, if it still will not address, change the BMS cable and try again. If that does not work, restart the commissioning process and power cycle the system.',
        sources: [AUTHOR],
      }),
      question({
        id: 'm4-q-order',
        lessonId: 'm4-wiring',
        prompt: 'With one inverter and several batteries, which cables go on last?',
        correct: ['The positive cables to the battery receptacles'],
        wrong: ['The eyelet cables to the inverter', 'The negative cables', 'The BMS communication cables'],
        explanation: 'Eyelet cables go to the inverter first, then to the busbars. Negatives go on the batteries next, and the positives go on last.',
        sources: [src('manual', 21)],
      }),
      question({
        id: 'm4-q-length',
        lessonId: 'm4-wiring',
        prompt: 'What must be true of the battery cables when connecting busbars?',
        correct: ['They must be the same length throughout the whole system'],
        wrong: ['They must be as short as possible', 'They must be different lengths for each battery', 'Only the positive cables must match'],
        explanation: 'Battery cables must be the same length throughout the entire system, with a correct degree and voltage rating.',
        sources: [src('manual', 24)],
      }),
      question({
        id: 'm4-q-bms-rev4',
        lessonId: 'm4-wiring',
        prompt: 'On a Rev 4 system, how are the battery BMS cables wired?',
        correct: ['Standard Ethernet (T568A or T568B), daisy chained from the parent inverter to battery 1, then battery to battery'],
        wrong: ['A splitter with a cable from every battery', 'A CAN cable to Parallel B', 'Each battery to its own inverter port'],
        explanation: 'Rev 4 uses a standard Ethernet daisy chain. Revs 1-3 use a splitter at the BMS Coms port with a cable to each battery.',
        sources: [src('manual', 21), src('san2_3', 18)],
        revisions: ['rev4'],
      }),
      question({
        id: 'm4-q-pv-grounded',
        lessonId: 'm4-leakage',
        prompt: 'What happens if the grid is turned on while PV(-) is connected to ground?',
        correct: ['Catastrophic failure'],
        wrong: ['Nothing, PV is normally grounded', 'The inverter shows a blinking green light', 'The batteries discharge'],
        explanation: 'PV must never be grounded. If the grid is on while PV(-) is grounded, catastrophic failure will occur.',
        sources: [src('manual', 27)],
        revisions: ['rev4'],
      }),
      question({
        id: 'm4-q-leak-first',
        lessonId: 'm4-leakage',
        prompt: 'What is the first step of the PV-to-GND leakage test?',
        correct: ['Rotate the PV Disconnect switch to off'],
        wrong: ['Measure continuity from PV(-) to GND', 'Turn on the grid breaker', 'Measure voltage from PV(+) to PV(-)'],
        explanation: 'Turn the PV Disconnect off first. Then measure voltage and continuity from each of PV(-) and PV(+) to GND.',
        sources: [src('manual', 27)],
        revisions: ['rev4'],
      }),
      question({
        id: 'm4-q-leak-step3',
        lessonId: 'm4-leakage',
        prompt: 'In the leakage test, step 3 checks continuity between which two points?',
        correct: ['PV(+) and GND'],
        wrong: ['PV(-) and GND', 'PV(+) and PV(-)', 'GND and neutral'],
        explanation: 'Step 3 checks PV(+) to GND. The manual says PV(-), which is a typo: PV(-) was already checked in step 2.',
        sources: [AUTHOR, src('manual', 27)],
        revisions: ['rev4'],
      }),
      question({
        id: 'm4-q-leak-expect',
        lessonId: 'm4-leakage',
        prompt: 'With the PV Disconnect off, what should you read between PV(+) and GND?',
        correct: ['About 0V, and open circuit on continuity'],
        wrong: ['About 240V', 'About -240V', 'Closed circuit on continuity'],
        explanation: 'There can be voltage between PV(+) and PV(-), but there should be none between either one and GND. Any voltage or continuity to GND indicates a current path.',
        sources: [src('manual', 27)],
        revisions: ['rev4'],
      }),
      trueFalse({
        id: 'm4-q-mlpe',
        lessonId: 'm4-leakage',
        prompt: 'With MLPE, a clean leakage test result is always conclusive.',
        answer: false,
        explanation: 'With module level power electronics the test may not detect a leakage path if the rapid shutdown system is not turning the PV panels on.',
        sources: [src('manual', 27)],
        revisions: ['rev4'],
      }),
      question({
        id: 'm4-q-insulation-led',
        lessonId: 'm4-leakage',
        prompt: 'At first power-up the inverter\'s front LED turns orange or red after the PV insulation check. What does that mean?',
        correct: ['The check failed: do not power up until the PV wiring has no path to ground'],
        wrong: ['The check passed', 'The battery is low', 'The inverter is updating'],
        explanation: 'If the LED turns orange or red, the PV insulation test failed. Fix the PV wiring before turning on any grid breaker.',
        sources: [src('manual', 42), AUTHOR],
        revisions: ['rev4'],
      }),
      question({
        id: 'm4-q-dual',
        lessonId: 'm4-pv',
        prompt: 'What does Dual MPPT mode do on Rev 4?',
        correct: ['Puts MPPT 1&2 and MPPT 3&4 in parallel, making two 6kW inputs'],
        wrong: ['Doubles the maximum voltage to 1000V', 'Lets the inverter take AC solar', 'Disables rapid shutdown'],
        explanation: 'MPPT 1&2 and 3&4 are paralleled manually, external to the inverter, giving two 6kW MPPTs. Change Solar Input Type from "Independent" to "Dual MPPT".',
        sources: [src('manual', 26)],
        revisions: ['rev4'],
      }),
      question({
        id: 'm4-q-optimizer',
        lessonId: 'm4-pv',
        prompt: 'The panels may have Tigo optimizers. What do you do?',
        correct: ['Enable the "PV Optimizer" setting after commissioning. It is safe to enable even without optimizers'],
        wrong: ['Leave it off, because enabling it without optimizers causes a fault', 'Switch to Dual MPPT mode', 'Turn off rapid shutdown'],
        explanation: 'Enable "PV Optimizer" after commissioning if optimizers such as Tigo TS4-A-O are present. It is no problem to enable it when there are none.',
        sources: [src('manual', 26)],
        revisions: ['rev4'],
      }),
      question({
        id: 'm4-q-rsd',
        lessonId: 'm4-specs-rsd',
        prompt: 'What does the inverter built-in 12 VDC supply power?',
        correct: ['A rapid shutdown (RS) transmitter. It is polarity sensitive'],
        wrong: ['The batteries', 'The generator start relay', 'The CT sensors'],
        explanation: 'The built-in 12 VDC, 1A supply on +12V_COM and GND_COM is for the RS transmitter. The transmitter is polarity sensitive. The NEC requires rapid shutdown (690.12).',
        sources: [src('manual', 28)],
      }),
      question({
        id: 'm4-q-battery-cap',
        lessonId: 'm4-specs-rsd',
        prompt: 'What is the usable capacity of the Rev 4 battery, and how many can one inverter take?',
        correct: ['14.3kWh, up to 3 batteries'],
        wrong: ['13.5kWh, up to 3 batteries', '14.3kWh, up to 6 batteries', '10kWh, up to 2 batteries'],
        explanation: 'The Rev 4 battery is 14.3kWh. Revs 1-3 have a 13.5kWh battery. Up to 3 batteries per inverter on all revisions.',
        sources: [src('manual', 44), src('san2_3', 39)],
        revisions: ['rev4'],
      }),
    ],
  },

  sim: {
    id: 'multimeter-bench',
    kind: 'multimeter-bench',
    title: 'Multimeter bench',
    intro: 'Probe batteries, decide what can be wired, and run the PV leakage test.',
  },
}

export default mod
