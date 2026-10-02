import { src } from './helpers'
import type { Fact, SourceRef } from './types'
import { fact, official, web } from './helpers'

// Knowledge pages: Electricity, Solar panels, Codes, Competitors. Built only from the documents. Whatever the author
// wants covered that the documents do not give is listed under `needed`, never filled in from general knowledge.

export interface TopicImage {
  /** Path under public/, for example images/codes/x.webp */
  src: string
  alt: string
  caption: string
  sources: SourceRef[]
}

export interface TopicSection {
  title: string
  facts: Fact[]
  /** Images of the pages or photos the facts come from. */
  images?: TopicImage[]
  /** True when the facts come from public web pages, not Lion documents. Shown with a label and a verify note. */
  fromWeb?: boolean
}

export interface TopicLink {
  label: string
  url: string
  note: string
}

export interface Topic {
  id: string
  title: string
  lead: string
  sections: TopicSection[]
  links?: { title: string; items: TopicLink[] }[]
  /** What the author asked for that is not covered yet. */
  needed: string[]
}

const TIGO = official('TS4-A with TAP and CCA Installation Manual, Rev 2.3, 10/1/2025, PN 002-00129-00 (Tigo Energy)', 'https://cdn.prod.website-files.com/5fad551d7419c7a0e9e4aba4/698b65573e1e53f5d116c80f_002-00129-00%202.3%20IO%26M%20TS4A%20with%20TAP%20and%20CCA%2020251001%20-%20EN.pdf')
const CEC_SFR = official('2022 Energy Code: Solar PV, Solar Ready, Energy Storage Systems, Electric Ready - Single-Family (California Energy Commission)', 'https://www.energy.ca.gov/sites/default/files/2024-01/2022_SFR_Solar_PV,SR,ESS,eR_ADA.pdf')
const CEC_GUIDE = official('California Energy Storage Permitting Guidebook, CEC-500-2023-059, January 2026 (California Energy Commission)', 'https://efiling.energy.ca.gov/GetDocument.aspx?tn=268282&DocumentContentId=105452')
const UT_CODE = official('Utah Code 15A-2, Adoption of State Construction Code (Utah Legislature)', 'https://le.utah.gov/xcode/Title15A/Chapter2/C15A-2_1800010118000101.pdf')
const RMP137 = official('Rocky Mountain Power Electric Service Schedule No. 137, Net Billing Service (Rocky Mountain Power)', 'https://www.rockymountainpower.net/content/dam/pcorp/documents/en/rockymountainpower/rates-regulation/utah/rates/137_Net_Billing_Service.pdf')
const TDLR_GUIDE = official('Compliance Guide, Electricians (TDLR)', 'https://www.tdlr.texas.gov/electricians/compliance-guide.htm')
const TDLR_NEWS = official('2023 National Electrical Code is Almost Here! (TDLR)', 'https://www.tdlr.texas.gov/news/2022/11/30/2023-national-electrical-code-is-almost-here')
const PUCT = official('16 TAC §25.211, Interconnection of On-Site Distributed Generation (Public Utility Commission of Texas)', 'https://www.puc.texas.gov/agency/rulesnlaws/subrules/electric/25.211/25.211.pdf')
const UT_ADMIN_312 = official('Utah Admin. Code R746-312-4 (Cornell LII copy, verify at adminrules.utah.gov)', 'https://www.law.cornell.edu/regulations/utah/Utah-Admin-Code-R746-312-4')
const UT_ADMIN_DOPL = official('Utah Admin. Code R156-55a-301, license classifications (Cornell LII copy, verify with DOPL)', 'https://www.law.cornell.edu/regulations/utah/Utah-Admin-Code-R156-55a-301')
const UT_CH3 = official('Utah Code 15A-3 Part 6, Statewide Amendments to the National Electrical Code (Utah Legislature)', 'https://le.utah.gov/xcode/Title15A/Chapter3/C15A-3-P6_1800010118000101.pdf')
const CPUC_NEM = official('Net Energy Metering and Net Billing (CPUC)', 'https://www.cpuc.ca.gov/nem')
const TESLA_PW3 = official('Powerwall 3 Datasheet, North America (Tesla)', 'https://digitalassets.tesla.com/tesla-contents/image/upload/Powerwall_3_Datasheet_NA-EN_53.pdf')
const TSM = (...pages: number[]) => src('tsm', ...pages)
const SET = (...pages: number[]) => src('settings', ...pages)

export const ELECTRICITY: Topic = {
  id: 'electricity',
  title: 'Electricity for ESS',
  lead: 'The terms and numbers that come up on a Sanctuary call, from the Technical Service Manual and the Settings Guide.',
  sections: [
    {
      title: 'Terms',
      facts: [
        fact('AC (alternating current): the voltage vs. time graph looks like a sine wave. Common household power in the United States is 120/240 V, 60 Hz AC.', [TSM(97)]),
        fact('DC (direct current): for example solar power and battery output.', [TSM(97)]),
        fact('Inverter: a device that converts DC power to AC power.', [TSM(98)]),
        fact('kWh (kilowatt hour): each kWh is 1000 watts of power for an hour.', [TSM(98)]),
        fact('Load: any active electrical circuit or device that uses power, such as light bulbs or appliances. Consumption is the power used by loads in the home.', [TSM(97, 98)]),
        fact('Essential or backup loads: the circuits and devices the Sanctuary powers, backed up by batteries, inverters and solar.', [TSM(98)]),
        fact('Grid: the power supply from the utility company. A net (billing) meter, also called a revenue meter, lets the utility track power consumed and power sent back to the grid.', [TSM(98)]),
        fact('C rate: related to the amp-hour capacity. A 280 Ah battery has a 1C rate of 280 A, and 0.1C is 28 A.', [TSM(97)]),
        fact('CT (current transformer): a device that measures the current flow in a wire.', [TSM(97)]),
        fact('EPS (emergency power supply, also called a microgrid): an electrical system that can generate electricity off-grid or connected to the grid.', [TSM(98)]),
        fact('DER (distributed energy resource): any power source connected to the grid. When connected to the grid the Sanctuary is a DER.', [TSM(97)]),
        fact('PCC (point of common coupling): where the customer\'s electrical system connects to the grid, basically at the utility billing meter.', [TSM(99)]),
        fact('One-line (single line) diagram: an electrical schematic that draws one line when several wires are used. It assumes the installer knows where to wire the hot and neutral wires.', [TSM(98, 99)]),
        fact('Bypass: with a manual transfer switch the backup loads can be powered by the grid instead of the Sanctuary, for servicing or troubleshooting.', [TSM(97)]),
      ],
    },
    {
      title: 'Numbers you will use',
      facts: [
        fact('Split phase service: line to neutral 120 V on L1 and L2, and 240 V line to line. About 208 V line to line with 120 V on each leg is three-phase service.', [TSM(34)]),
        fact('Grid reconnect window: 91.7% to 105% of nominal voltage (105% is 126 V), and 59.5 to 60.1 Hz.', [TSM(33, 34, 70)]),
        fact('Sell-back must be reduced above about 106% of nominal voltage and is zero at 110%. It is also reduced when the frequency exceeds 60.036 Hz.', [TSM(65)]),
        fact('A Sanctuary 2 battery is 51.2 V nominal (sixteen 3.2 V cells in series). A depth of discharge of 90% means 10% state of charge.', [TSM(20), SET(14)]),
        fact('The Sanctuary 2 inverter output is limited to 4 kW per leg off-grid (6 kW per leg for Sanctuary 3).', [TSM(67)]),
      ],
    },
    {
      title: 'Measuring',
      facts: [
        fact('Check volts before you check continuity.', [TSM(45)]),
        fact('A clamp-on DC ammeter with 1 mA resolution can measure ground leakage. Clamp both the positive and negative lead of one string at the same time: the string current cancels and what remains is the leakage.', [TSM(64, 72)]),
        fact('Probe a battery terminal through the small hole in the center. Do not put probes down the side: the outer part is connected to the case.', [TSM(22)]),
        fact('Turning the unit off does not make it safe to work on. Disconnect all power sources, including the AC and DC terminals, and use lockout/tagout.', [src('manual', 2), src('san2_2', 2)]),
      ],
    },
    {
      title: 'Basics (Fluke and US Department of Energy, read in full)',
      fromWeb: true,
      facts: [
        fact('Ohm\'s law: voltage = current x resistance, or volts = amps x ohms. One volt of pressure is needed to push one amp of current through one ohm of resistance.', [official('What Is Ohm\'s Law? (Fluke)', 'https://www.fluke.com/en-us/learn/blog/electrical/what-is-ohms-law')]),
        fact('Direct current is not easily converted to higher or lower voltages. Today\'s electricity is still mostly alternating current, but computers, LEDs, solar cells and electric vehicles all run on DC.', [official('The War of the Currents: AC vs. DC Power (US Department of Energy), Nov. 18, 2014', 'https://www.energy.gov/articles/war-currents-ac-vs-dc-power')]),
        fact('Measuring AC volts: turn the dial to the AC voltage symbol, put the black lead in COM, and put the red lead in the jack marked V, not A. Connect the black lead first and the red second. AC voltage has no polarity.', [official('How to Measure AC Voltage with a Digital Multimeter (Fluke)', 'https://www.fluke.com/en-us/learn/blog/digital-multimeters/how-to-measure-ac-voltage-with-a-digital-multimeter')]),
        fact('Continuity test: turn the dial to continuity mode and test with the circuit de-energized. Connect the leads across the component and make sure it is isolated from other components in the circuit.', [official('A Guide to Continuity Testing with a Multimeter (Fluke)', 'https://www.fluke.com/en-us/learn/blog/digital-multimeters/how-to-test-for-continuity')]),
      ],
    },
    {
      title: 'Basic theory (from the web)',
      fromWeb: true,
      facts: [
        fact('Electric power in watts is voltage times current: P = V x I. For a resistive circuit it is also P = R x I squared, or V squared divided by R. A watt is one joule per second, and a kilowatt is 1000 watts.', [web('Ohm\'s Law and power in electrical circuits (Electronics Tutorials)', 'https://www.electronics-tutorials.ws/dccircuits/dcp_2.html')]),
        fact('Ohm\'s law and the power formula together give a family of formulas that solve for any one of voltage, current, resistance or power when you know two of the others.', [web('Ohm\'s Law and power in electrical circuits (Electronics Tutorials)', 'https://www.electronics-tutorials.ws/dccircuits/dcp_2.html')]),
        fact('120/240 V split phase, the standard for North American homes, supplies two 120 V lines that are 180 degrees out of phase around a shared center-tapped neutral. L1 to L2 gives 240 V, and L1 or L2 to the neutral gives 120 V.', [web('120/240V Split Phase (The Engineering Mindset)', 'https://theengineeringmindset.com/120-240v-split-phase-us-can/')]),
        fact('In the main service panel the neutral and ground are bonded to each other and to the grounding electrode. In most entrance panels, but not in sub-panels, the neutral and ground busses are bonded.', [web('Split-phase electric power (Wikipedia)', 'https://en.wikipedia.org/wiki/Split-phase_electric_power'), web('120/240V Split Phase (The Engineering Mindset)', 'https://theengineeringmindset.com/120-240v-split-phase-us-can/')]),
        fact('Wire and breaker pairing for small conductors (NEC 240.4(D)): 14 AWG copper is protected at 15 A, 12 AWG copper at 20 A and 10 AWG copper at 30 A. There is no "next size up" for these.', [web('How to Size a Circuit Breaker According to NEC Rules (ExpertCE)', 'https://expertce.com/learn-articles/how-to-size-circuit-breaker-nec/'), web('Breaker to Wire Size Chart, NEC 240.4 (Electrical Calc Tools)', 'https://electricalcalctools.com/breaker-wire-size-chart')]),
        fact('Continuous loads (NEC 210.19(A)(1)): conductors are sized for the larger of the noncontinuous load plus 125% of the continuous load, or the maximum load served. The breaker is not less than the noncontinuous load plus 125% of the continuous load, and not more than the conductor\'s final ampacity.', [web('How to Size a Circuit Breaker According to NEC Rules (ExpertCE)', 'https://expertce.com/learn-articles/how-to-size-circuit-breaker-nec/')]),
        fact('AC-coupled storage uses a separate solar inverter and a battery inverter. DC-coupled (hybrid) systems run solar into a charge controller or MPPT, then to the battery, then through one hybrid inverter. DC-coupled is generally preferred for new solar plus battery installs, and AC-coupled is the usual choice for adding storage to an existing solar system.', [web('DC-coupled vs. AC-coupled batteries in solar energy systems (SolarEdge)', 'https://www.solaredge.com/aus/for-home/info-centre/batteries/dc-vs-ac-coupled-batteries')]),
      ],
    },
  ],
  needed: [
    'Not found yet: three-phase service, power factor and reactive power, AC vs DC safety, and how to read a one-line diagram. The search did not return usable pages for these.',
    'A multimeter lesson (see the "How a multimeter works" procedure).',
    'The theory section was read as search summaries, not the full pages. Check each source link before you teach from it, and have the author review it.',
  ],
}

export const SOLAR: Topic = {
  id: 'solar',
  title: 'Solar panels',
  lead: 'What the Sanctuary needs from solar and how to troubleshoot it, from the manuals.',
  sections: [
    {
      title: 'What a panel is',
      facts: [
        fact('A solar panel is solar cells wired together to capture energy from sunlight and convert it to electricity, in a housing built to keep water out and last for decades.', [TSM(99)]),
        fact('Home panels are typically rated at 300 to 600 W and are about 15% to 25% efficient. Output voltage varies from 30 V to 80 V per panel.', [TSM(99)]),
        fact('PV (photovoltaic) means generating solar energy with photovoltaic cells.', [TSM(99)]),
        fact('MLPE (module level power electronics) are modules mounted under or near the panels. Rapid shutdown devices and optimizers are two kinds.', [TSM(98)]),
        fact('MPPT (maximum power point tracking) is a DC to DC converter that extracts the maximum solar power. The Sanctuary has 4 MPPTs of 3 kW each, 12 kW in total.', [TSM(98), src('manual', 26)]),
        fact('AC-coupled solar: the panels\' DC is converted to AC by a separate solar inverter or microinverters, and the Sanctuary can store the excess.', [TSM(97)]),
      ],
    },
    {
      title: 'What the inverter needs',
      facts: [
        fact('The MPPT operating voltage is 120 V to 500 V. It needs at least 120 V DC to start. The open-circuit voltage must never exceed 500 V, or the inverter can be damaged.', [TSM(61)]),
        fact('Rev 4 per MPPT: 14 A input, 22 A Isc. Rev 3: 12 A input, 15 A Isc.', [src('manual', 26, 44), src('san2_3', 22, 39)]),
        fact('Make PV connections with the unit off. The PV(-) terminals are typically at -240 V DC while the unit operates.', [src('manual', 27)], ['rev4']),
        fact('Before the final DC connection, make sure positive goes to positive and negative to negative. About -1 V from PV1+ to PV1- means the lines are reversed.', [src('manual', 26), TSM(63)]),
        fact('The inverter accepts up to 10 AWG wire for PV connections.', [src('manual', 27)]),
        fact('Dual MPPT mode puts MPPT 1&2 and MPPT 3&4 in parallel. Connect one string to both MPPT 1 and 2 and another to both MPPT 3 and 4, and change Solar Input Type to Dual MPPT.', [SET(32)]),
        fact('PV Optimizer: used when each panel has an optimizer. There is no problem running it enabled with no optimizers.', [SET(37)]),
      ],
    },
    {
      title: 'Cold weather and string size',
      facts: [
        fact('Solar panel voltage rises as temperature falls. Some customers first see the DC bus over-voltage alarm (A1_14) when the weather turns cold because the Voc increase was not allowed for.', [TSM(74)]),
        fact('String Voc at a temperature: panel Voc times the number of panels, then adjust by the panel\'s temperature coefficient for each degree C below 25 C. It must stay under 500 V at the coldest expected temperature.', [TSM(62, 63, 85)]),
        fact('Worked example from the manual: Voc 48.2 V and -0.29% per C. Ten panels is 482 V at 25 C and goes over 500 V below about 12 C. Nine panels (433.8 V) goes over 500 V only below about -27.6 C.', [TSM(62, 63)]),
      ],
    },
    {
      title: 'Ground faults, arcs and rapid shutdown',
      facts: [
        fact('Water inside a panel can create a path to ground. The inverter shuts down when ground current is detected, often during or after rain. Rev 4 and Sanctuary 3 have fuses on the MPPT inputs.', [TSM(63)]),
        fact('Normal leakage is around 10 mA or less. A jump of 30 mA, or a rise past 300 mA, raises A1_10.', [SET(35), TSM(72)]),
        fact('The arc fault detector sits just above the PV connections and shuts solar down to prevent fire (NEC 690.11). It does not clear automatically.', [TSM(82)]),
        fact('The Sanctuary does not include rapid shutdown transmitters. Panels with MLPE need a compatible transmitter, or the MLPE shuts off its output. Turning off the PV Disconnect does not turn off 12 V to the transmitter.', [TSM(64, 65)]),
        fact('A PV(-) terminal connected to ground is dangerous. Never connect grid power or turn on the DC solar switch with a solar to ground short.', [TSM(81)]),
      ],
    },
    {
      title: 'Grid limits on solar production',
      facts: [
        fact('When grid voltage exceeds about 106% of nominal, sell-back is reduced, and it is zero at 110%. When the frequency exceeds 60.036 Hz, sell-back is reduced. If grid sell-back is disabled, solar drops to what the loads need once the battery is full.', [TSM(65)]),
      ],
    },
    {
      title: 'Solar cell basics (US Department of Energy and PVEducation, read in full)',
      fromWeb: true,
      facts: [
        fact('A PV (solar) cell contains a semiconductor material that can absorb sunlight and convert it to electricity (the photovoltaic effect). Silicon is by far the most common material.', [official('Solar Photovoltaic Cell Basics (US Department of Energy)', 'https://www.energy.gov/cmei/systems/solar-photovoltaic-cell-basics')]),
        fact('Open-circuit voltage (Voc) is the maximum voltage available from a solar cell, and it occurs at zero current.', [official('Open-Circuit Voltage (PVEducation)', 'https://www.pveducation.org/node/117')]),
        fact('Open-circuit voltage is the parameter most affected by temperature and drops as the temperature rises. For silicon it falls about 2.2 mV per degree C per cell. Short-circuit current rises only slightly with temperature. (This is why cold weather raises string Voc: use the panel datasheet coefficient for the real calculation.)', [official('Effect of Temperature (PVEducation)', 'https://pveducation.org/es/node/127')]),
        fact('A bypass diode is wired in parallel, with opposite polarity, across solar cells. It limits the reverse bias on a shaded cell and prevents hot-spot heating. One diode covers a group of cells.', [official('Bypass Diodes (PVEducation)', 'https://pveducation.org/es/node/171')]),
      ],
    },
    {
      title: 'Panel theory (from the web)',
      fromWeb: true,
      facts: [
        fact('Open-circuit voltage (Voc) is the voltage with nothing connected to draw power, the far end of the I-V curve. Short-circuit current (Isc) is the current when the positive and negative terminals are connected directly.', [web('Calculating Max PV Voltage is Not Scary (SMA)', 'https://www.sma-sunny.com/us/calculating-max-pv-voltage-is-not-scary/'), web('Decoding Solar Panel Output: Voltages, Acronyms, and Jargon (Alternative Energy Store)', 'https://www.altestore.com/pages/decoding-solar-panel-output-voltages-acronyms-and-jargon')]),
        fact('Vmp and Imp are the voltage and current at the knee of the I-V curve, the maximum power point. Vmp times Imp is the maximum power in watts.', [web('Decoding Solar Panel Output: Voltages, Acronyms, and Jargon (Alternative Energy Store)', 'https://www.altestore.com/pages/decoding-solar-panel-output-voltages-acronyms-and-jargon')]),
        fact('Every module has temperature coefficients, one for Voc and one for Vmp. The Voc coefficient is negative, typically about -0.25% to -0.35% per degree C for crystalline silicon: Voc rises as it gets colder and falls as it gets hotter.', [web('Decoding Solar Panel Output: Voltages, Acronyms, and Jargon (Alternative Energy Store)', 'https://www.altestore.com/pages/decoding-solar-panel-output-voltages-acronyms-and-jargon'), web('Open Circuit Voltage (Voc) In Solar Panels (The Green Watt)', 'https://www.thegreenwatt.com/voc/')]),
        fact('NEC 690.7 requires the maximum system voltage to be calculated at the lowest expected temperature. Multiply the sum of the series modules\' Voc by a correction factor from Table 690.7(A), or use the manufacturer\'s temperature coefficient.', [web('NEC 690.7 Maximum Voltage: How to Calculate PV System Voltage (Surge PV)', 'https://www.surgepv.com/solar-compliance/usa/guides/nec-690-7-max-system-voltage'), web('Calculating Max PV Voltage is Not Scary (SMA)', 'https://www.sma-sunny.com/us/calculating-max-pv-voltage-is-not-scary/')]),
        fact('Example from a web source: a module with a 42.0 V Voc at 25 C can reach 48.5 V at -20 C, so 14 in series is about 679 V, which is over the 600 V residential limit that source uses. The Sanctuary limit is 500 V (Technical Service Manual p.61).', [web('NEC 690.7 Solar Voltage Limits: Calculation Methods (Solar Permit Solutions)', 'https://www.solarpermitsolutions.com/blog/nec-690-7-solar-voltage-limits-calculation'), TSM(61)]),
        fact('A bypass diode is connected across a group of cells, usually 15 to 24 cells. When part of a module is shaded, the current goes through the diode instead of forcing the shaded cells to a damaging negative voltage.', [web('Bypass Diodes Configurations for Mismatch Losses Mitigation (Springer)', 'https://link.springer.com/chapter/10.1007/978-981-16-7076-3_18')]),
        fact('Partial shading can cut a whole module\'s output a lot or to near zero, and can heat the shaded cells. A failed bypass diode causes mismatch currents and heating problems.', [web('The effect of partial shading on the reliability of photovoltaic modules (EPJ Photovoltaics)', 'https://www.epj-pv.org/articles/epjpv/full_html/2024/01/pv230068/pv230068.html')]),
        fact('NEC 690.12 rapid shutdown: controlled conductors inside the array boundary must drop to 80 V or less within 30 seconds of initiating rapid shutdown. This is why module-level power electronics (MLPE) such as optimizers and microinverters became common. The 2023 NEC allows MLPE or a listed PV hazard control system.', [web('690.12 Rapid Shutdown of PV Systems on Buildings (UpCodes)', 'https://up.codes/s/rapid-shutdown-of-pv-systems-on-buildings'), web('Meeting NEC 690.12 Rapid Shutdown Requirements (ExpertCE)', 'https://expertce.com/learn-articles/nec-690-12-rapid-shutdown-requirements/')]),
      ],
    },
    {
      title: 'Tigo TS4, TAP and CCA (Tigo installation manual)',
      fromWeb: true,
      facts: [
        fact('Tigo TS4 Flex module level power electronics (MLPE) enable monitoring, rapid shutdown and optimization. TS4-A-M is monitoring, TS4-A-S is monitoring and rapid shutdown, and TS4-A-O is monitoring, rapid shutdown and optimization. They use the Tigo Access Point (TAP) and the Cloud Connect Advanced (CCA) to communicate with inverters and the cloud.', [TIGO]),
        fact('TS4-A-O units used only to optimize performance do not need a TAP or a CCA.', [TIGO]),
        fact('Installing a TS4: put the QR/barcode sticker on a map of the array. Clip the TS4 to the top of the module frame with the cable glands facing down, so the TS4, cables, glands and connectors never touch the roof.', [TIGO]),
        fact('Connect the shorter TS4 input leads to the PV modules before connecting to neighboring TS4s. Failing to do so can damage the TS4 units. Then connect the longer output cables to the neighboring TS4 to make a string.', [TIGO]),
        fact('Do not connect or disconnect TS4s under load. Do not apply an external voltage source to a module or string equipped with TS4s.', [TIGO]),
        fact('To disconnect a TS4, activate rapid shutdown by turning off the CCA and the inverter, or with the PV rapid shutdown system initiator. Wait 30 seconds before disconnecting DC cables, disconnect the TS4 output cables before the input cables, and always assume TS4 units are on.', [TIGO]),
        fact('The TAP talks wirelessly to the TS4s to collect monitoring data and enable rapid shutdown. It connects to the CCA with a ferruled 4-wire cable such as shielded RS-485. Finish all TAP connections before powering on the CCA.', [TIGO]),
        fact('Capacity and range: one TAP can talk to up to 300 TS4s, and one CCA to up to seven TAPs and 900 TS4s. A TAP talks directly to any TS4 within 10 m (33 ft), and each TS4 can relay to another within 10 m, so the TAP reaches TS4s up to 35 m (115 ft) through relays. Place the TAP centrally with no obstructions.', [TIGO]),
        fact('TAP wiring: run the cable from the CCA GATEWAY terminal to the first TAP. When chaining another TAP, remove the pre-installed 120 ohm terminating resistor from the right side terminals. At the last TAP leave the resistor in.', [TIGO]),
        fact('The CCA should control all the TS4s on all strings connected to one inverter or MPPT, installed near that inverter with AC power and internet (Ethernet and Wi-Fi built in).', [TIGO]),
        fact('For PV rapid shutdown compliance the CCA must be on the same AC branch circuit as the inverter or inverters it controls. The rapid shutdown initiator must turn off power to the CCA.', [TIGO]),
        fact('CCA power: with two TAPs or fewer, a Tigo or third-party 12 to 24 V DC, 1 A supply. With three TAPs or more it must be 24 V DC, 1 A. Mount the CCA in a NEMA enclosure: at least NEMA 1 indoors and NEMA 4 outdoors.', [TIGO]),
        fact('The CCA also has two three-pin RS-485 connections for up to 32 Modbus devices. Each needs a unique Modbus address, devices in series need the same baud rate, parity and stop bits, and a 120 ohm resistor goes across + and - on the last device.', [TIGO]),
        fact('CCA LED: solid green is system OK. Blinking green/gray is Tigo SMART app activity. Blinking green/yellow is user PV-Off. Blinking yellow/gray is Discovery. Solid yellow is a warning (scanning incomplete or no connection to the Tigo server). Blinking red/yellow is automatic PV-Off. Solid red is an error (cannot find all TS4s or cannot reach the Tigo server).', [TIGO]),
        fact('Commissioning is done at ei.tigoenergy.com or in the Tigo Energy Intelligence (EI) mobile app, which is required for final commissioning after all equipment and TS4 barcodes are entered.', [TIGO]),
      ],
    },
    {
      title: 'Tigo rapid shutdown details (from search summaries, not in that manual)',
      fromWeb: true,
      facts: [
        fact('Rapid shutdown works with a keep-alive signal: the CCA sends it through the TAP to every TS4, and when the CCA loses AC power the keep-alive stops and the TS4s go into rapid shutdown.', [web('TS4-A-O/S/M with TAP and CCA Quick Start Guide (Tigo Energy)', 'https://www.solar-electric.com/lib/wind-sun/Tigo_QSG_TS4-A_CCA_TAP.pdf')]),
        fact('Tigo states the setup is certified to shut down the output leads of every TS4 module in under 30 seconds.', [web('FAQ - Optimizers (TS4-O) (Tigo support)', 'https://support.tigoenergy.com/hc/en-us/articles/35838437199507-FAQ-Optimizers-TS4-O')]),
        fact('The CCA has an Aux port that can be used for rapid shutdown applications.', [web('Using the Cloud Connect Advanced Aux Port for Rapid Shutdown applications (Tigo support)', 'https://support.tigoenergy.com/hc/en-us/articles/115006973008-Using-the-Cloud-Connect-Advanced-Aux-Port-for-Rapid-Shutdown-applications')]),
        fact('On the Sanctuary, PV Optimizer is a setting that is harmless to leave enabled when there are no optimizers. The Sanctuary itself has no rapid shutdown transmitter.', [src('settings', 37), TSM(64, 98)]),
      ],
    },
    {
      title: 'Tigo support articles (reported by Claude.ai research, not opened here)',
      fromWeb: true,
      facts: [
        fact('Keep-alive: the TAP broadcasts a signal (the keep-alive) to the assigned TS4 units, and they only pass voltage while it is active. When the CCA is powered off the keep-alive stops, the DC side goes into rapid shutdown and the TS4s disconnect their modules from the string. For the TS4-A-O/-S/-M, the output drops to under 80 V within 30 seconds (as per NEC requirements).', [web('Intro to Tigo TS4-A-O/S/M (Monitoring Group), Oct 28, 2024 (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/211807027-Intro-to-Tigo-TS4-A-O-S-M-Monitoring-Group')]),
        fact('To meet NEC 690.12 the CCA should be on the same circuit as the PV inverter\'s AC supply, so that opening the AC disconnect removes power from both.', [web('What are the CCA and TAP power requirements? (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/203510877')]),
        fact('Conflict: Tigo\'s Multi Factor Rapid Shutdown Overview says TS4-X and TS4-A (725W) units can take keep-alive from more than one source, and an integrated RSS transmitter in the inverter may keep the signal going after the CCA is off, so the array can stay energized. Teach "CCA OFF is not the same as Array OFF" for those models.', [web('Multi Factor Rapid Shutdown Overview (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/44983309634195')]),
        fact('Aux port ("PV-Safe"): a single-pole switch or latching button on the CCA Aux terminals makes the CCA sense 3.3 V, the TAP stops the keep-alive and the TS4s enter rapid shutdown. The CCA stays powered. No outside voltage may be put on the Aux port (voids the warranty). Tigo\'s Service and Maintenance push button page says this does not remove power to the inverter and should not be used as a complete rapid shutdown, so teach it as a service tool, not the code-required initiator.', [web('Using the Cloud Connect Advanced Aux Port for Rapid Shutdown applications (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/115006973008'), web('Service & Maintenance Rapid Shutdown Push Button (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/39462325650835')]),
        fact('TAP not talking to the CCA (CCA - TAP Test, Dec 18, 2023): symptoms are a Discovery failure, no portal data or a large grey section of the array. In the EI App open CCA Configuration, Settings, TAP TEST, START TAP TEST. Measure 24 VDC at the Gateway/TAP terminal of the CCA. If under 12 V, power off the CCA, remove the TAP connector, power on, wait 2 minutes and re-measure. If still under 12 V the device may need replacement. Check wire colors at both ends, inspect the whole RS-485 run, put a single 120 ohm resistor between B and A on the last TAP, and confirm 12-24 VDC at the TAP terminals. Last resort: bench test the TAP next to the CCA on a new 2 ft cable.', [web('CCA - TAP Test (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/360059913673-CCA-TAP-Test')]),
        fact('TS4s not appearing: Discovery normally finishes in under 60 minutes on a typical home system. Wait at least 2 hours after sunrise before calling support. Causes: the TAP count does not match what was entered online, TS4s not connected to energized modules, or wrong serial numbers in Layout. After a TS4 replacement the most common cause of a grey module is that the new serial number was not updated in the EI Portal.', [web('System Discovery (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/1500002619981'), web('After a TS4 replacement (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/1500005136381')]),
        fact('CCA LED: solid yellow (warning) means Discovery has not started from the EI App, Discovery finished with errors, fewer than 75% of optimizer serials were found, or the internet is not allowing upload. Solid red means the CCA cannot reach the network or Tigo\'s server (bad password, firewall, weak signal) or cannot finish Discovery because fewer TAPs were found than specified. Normal boot: dark for about 12 seconds, then amber for about 2 to 3 minutes.', [web('Cloud Connect Advanced (CCA) - LED status information (Tigo support), reported by Claude.ai research; not opened here', 'https://support.tigoenergy.com/hc/en-us/articles/224215048-Cloud-Connect-Advanced-CCA-LED-status-information')]),
      ],
    },
  ],
  needed: [
    'Vmp and Imp definitions, panel datasheet reading, cell and module construction, and installation by roof type.',
    'How to wire a Tigo system next to a Sanctuary (where the CCA gets its power, and what the Sanctuary expects). Not in the Lion documents or the Tigo manual. Needs the author.',
    'Tigo support articles: support.tigoenergy.com refused automated access (error 403) from here. The "Tigo support articles" section is as reported by Claude.ai research and has not been opened or checked by Claude Code. Open each link before relying on it.',
    'The Tigo installation manual section was read in full. The panel theory section is from search summaries: check each source link and have the author review it.',
  ],
}

export const CODES: Topic = {
  id: 'codes',
  title: 'Codes: California, Utah and Texas',
  lead: 'What the documents say about codes, plus links to the official sites. The specific code requirements for each state still have to come from the author.',
  sections: [
    {
      title: 'What the Sanctuary documents say',
      facts: [
        fact('The NEC (National Electric Code) specifies electrical safety requirements. Each jurisdiction decides which version of the NEC to adopt and when.', [TSM(98)]),
        fact('The AHJ (authority having jurisdiction): the installer works with the AHJ throughout permitting to meet its requirements. PTO (permission to operate) may be given after the AHJ inspects.', [TSM(97, 99)]),
        fact('Installers are responsible for checking the settings the AHJ requires and for setting the inverter to match. Utilities usually have their own required values for the grid interactive settings.', [SET(10, 43)]),
        fact('Many AHJs disallow a breaker-interlock style bypass. A bypass made of breakers in separate panels is disallowed everywhere and is prohibited by Lion Energy.', [TSM(13)]),
        fact('Since the 2017 NEC, panels on residential rooftops are required to include rapid shutdown modules.', [TSM(64)]),
        fact('The arc fault detector follows NEC 690.11: the fault does not clear automatically.', [TSM(82)]),
        fact('The Grid Standard setting has pre-programmed profiles, including "Rule21", "UL1741 SA", "UL1741 SB", "Heco 2.0" and "Puerto Rico". Changing it changes many smart inverter settings. The default is UL1741 and IEEE1547.2020.', [SET(25)]),
        fact('The Settings Guide gives Rocky Mountain Power in Utah as an example of a utility that requires specific grid interactive settings.', [SET(43)]),
        fact('Compliance certificates listed on the installers page: UL 9540, UL 9540A, UL 1973 and UL 1741 (SA, SB).', [TSM(99)]),
        fact('Sell-back must reduce at high grid voltage and high frequency, and exact settings vary by location. It is the installer\'s job to make the DER settings match the utility\'s requirements.', [TSM(65)]),
      ],
    },
    {
      title: 'California',
      fromWeb: true,
      facts: [
        fact('The 2022 California Energy Code (Title 24, Part 6) is effective January 1, 2023, for building permit applications submitted on or after that date. The 2025 code applies to applications submitted on or after January 1, 2026 (the 2025 date is from a search summary: check it).', [CEC_SFR]),
        fact('Single-family, 2022 code: every newly constructed single-family building must have a new solar PV system meeting Joint Appendix JA11. PV is a prescriptive requirement (150.1(c)14). There are no PV requirements for additions and alterations.', [CEC_SFR]),
        fact('A battery is not required. New single-family buildings must be ESS ready (mandatory, 150.0(s)). A battery that is installed must meet JA12, and a JA12 battery of at least 7.5 kWh lets the required PV size (Equation 150.1-C) be reduced by 25%.', [CEC_SFR]),
        fact('The system and its components, including inverters, must meet Rule 21. The Sanctuary Grid Standard setting has a Rule21 profile.', [CEC_SFR, src('settings', 25)]),
        fact('Net billing (NEM 3.0) applies to customers who applied for interconnection since April 15, 2023 (CPUC decision D.22-12-056). Exports before true-up are credited at CPUC Avoided Cost Calculator values (usually lower than import rates). Interconnection fees for systems under 1 MW: PG&E $145, SCE $94, SDG&E $132. Non-bypassable charges apply to net energy consumed in each metered interval. PG&E and SCE residential customers who apply before the end of 2027 get slightly higher export credits for nine years (SDG&E excluded, and not for customers required to add solar by the building code).', [CPUC_NEM]),
        fact('California Electrical Code 2025 (Title 24, Part 3) is based on the 2023 NEC, effective January 1, 2026.', [web('The 2025 California Electrical Code (DGS), reported by Claude.ai research; not opened here', 'https://www.dgs.ca.gov/-/media/Divisions/BSC/02-Codes/2025-CEC_rev2025-11-20_locked.docx')]),
        fact('CSLB battery rule: CSLB\'s Battery Energy Storage Systems regulation (16 CCR 810, 832.10, 832.46) was approved by the Office of Administrative Law in June 2024. It adds BESS to the C-10 Electrical Contractor scope and lets a C-46 Solar contractor install a BESS as incidental to a PV installation up to 80 kWh. Its effective date was stayed by a court order pending a San Diego County Superior Court case, and CSLB\'s laws page still described the stay after June 2026. Do not tell anyone this scope is in force until you confirm the case outcome with CSLB.', [web('CSLB Laws and Regulations and Order of Adoption (CSLB), reported by Claude.ai research; not opened here', 'https://cslb.ca.gov/About_Us/Library/Laws')]),
        fact('Since August 29, 2023, SCE\'s Rule 21 applicants must use UL 1741 SB compliant inverters, with a Smart Inverter Phase 2 communication attestation. This is SCE only. PG&E and SDG&E were not found.', [web('Interconnecting Generation Under Rule 21 (SCE), reported by Claude.ai research; not opened here', 'https://www.sce.com/business/smart-energy-solar/solar-for-business/grid-interconnections/interconnecting-generation-under-rule-21')]),
        fact('PG&E has required UL 1741 SB certified inverters and Common Smart Inverter Profile (CSIP) conformance for interconnection applications since August 29, 2023. SDG&E was not found.', [official('UL 1741 SB and CSIP Requirements (PG&E)', 'https://www.pge.com/assets/pge/docs/about/pge-systems/PGE-UL1741-SB-CSIP-Requirements.pdf')]),
        fact('SB 379 requires California cities and counties to adopt an automated permitting platform for solar systems under 38.4 kW AC, with or without an attached energy storage system also rated no more than 38.4 kW AC. As of October 8, 2025, 363 authorities (35 counties and 328 cities) had adopted automated permitting.', [CEC_GUIDE]),
        fact('The California Electrical Code (Part 3 of Title 24) governs the electrical side of energy storage. Energy storage is covered in Article 706 for systems over 1 kWh. For one- and two-family dwellings an ESS must include an emergency shutdown function that stops the export of power.', [CEC_GUIDE]),
        fact('Residential ESS of 1 kWh or more (R330 as the guidebook describes it for the 2025 code): listed to UL 9540 and installed to the manufacturer\'s instructions, at least 3 ft apart unless the listing allows less. Allowed in detached garages and accessory structures, attached garages, outdoors or exterior walls at least 3 ft from doors and windows into the dwelling, and enclosed utility closets, basements and storage spaces. Smoke or heat alarms are needed in those rooms. Each unit is limited to 20 kWh and the property total to 600 kWh, with 40 kWh in basements, closets and storage spaces and 80 kWh in garages or outdoors.', [CEC_GUIDE]),
      ],
      images: [
        { src: 'images/codes/ca-2022-energy-code-effective.webp', alt: 'CEC slide: 2022 Energy Code effective January 1, 2023.', caption: 'CEC 2022 single-family fact sheet, p.5: effective date.', sources: [CEC_SFR] },
        { src: 'images/codes/ca-2022-sfr-table-100-0-a.webp', alt: 'CEC Table 100.0-A: Solar PV is prescriptive 150.1(c)14; ESS ready is mandatory 150.0(s); battery not required, but must meet JA12 if used.', caption: 'CEC 2022 single-family fact sheet, p.13: Table 100.0-A.', sources: [CEC_SFR] },
        { src: 'images/codes/ca-2022-sfr-battery-25-percent.webp', alt: 'CEC slide: reduce the solar PV size by 25% with a JA12 battery of at least 7.5 kWh.', caption: 'CEC 2022 single-family fact sheet, p.19: the 25% PV reduction.', sources: [CEC_SFR] },
        { src: 'images/codes/ca-2022-sfr-rule-21.webp', alt: 'CEC slide: the system and components, including inverters, must meet Rule 21.', caption: 'CEC 2022 single-family fact sheet, p.25: Rule 21.', sources: [CEC_SFR] },
        { src: 'images/codes/ca-sb379-automated-permitting.webp', alt: 'Guidebook page describing SB 379 and the automated permitting platform.', caption: 'Energy Storage Permitting Guidebook (January 2026), p.13: SB 379.', sources: [CEC_GUIDE] },
        { src: 'images/codes/ca-ess-r330-locations.webp', alt: 'Guidebook page listing R330 locations and size limits for residential energy storage.', caption: 'Energy Storage Permitting Guidebook, p.17: R330.', sources: [CEC_GUIDE] },
        { src: 'images/codes/ca-electrical-code-article-706.webp', alt: 'Guidebook page on the California Electrical Code and Article 706, with the emergency shutdown requirement.', caption: 'Energy Storage Permitting Guidebook, p.18: Article 706.', sources: [CEC_GUIDE] },
      ],
    },
    {
      title: 'Utah',
      fromWeb: true,
      facts: [
        fact('Utah Code 15A-2-103 (current text, amended in the 2026 General Session) adopts the 2023 edition of the National Electrical Code, the 2021 International Residential Code and the 2024 International Energy Conservation Code. A version effective January 1, 2027 lists the same editions. Statewide and local amendments apply on top.', [UT_CODE]),
        fact('Rocky Mountain Power Schedule 137 (net billing) applies to a renewable generating facility of up to 25 kW residential or 2 MW non-residential, interconnected in parallel with the company\'s system and controlled by an inverter.', [RMP137]),
        fact('Export credit, effective March 1, 2026: 4.855 cents per kWh for exported energy in June through September, and 4.033 cents per kWh in October through May. Credits carry over within the Annualized Billing Period, which ends at the March meter reading, and unused credits expire at the end of it.', [RMP137]),
        fact('Interconnection review fees (non-refundable): Level 1 is $60 per application, Level 2 is $75 plus $1.50 per kW, and Level 3 is $150 plus $3.00 per kW.', [RMP137]),
        fact('An inverter-based system of 10 kW or less does not need a disconnect switch. Larger systems need a manual, lockable, load-break disconnect that shows open or closed, readily accessible to the company and within 10 feet of the company\'s meter.', [RMP137]),
        fact('The customer provides, at their own expense, the equipment needed to meet local and national standards for electrical and fire safety, power quality and interconnection (NEC, IEEE, UL). The company may test and inspect an interconnection.', [RMP137]),
        fact('Utah PSC rule R746-312-4(2)(a): an interconnection customer must install a manual disconnect switch that is lockable, load-break, plainly shows open or closed, readily accessible to the utility at any time, and within ten feet of the utility\'s meter. Exemption (2)(b)(i): the utility may not require one for inverter-based customer generating systems of ten kilowatts or less. (2)(b)(ii): it may be more than ten feet away if permanent instructions at the meter show its location and the utility approves the location in writing before installation.', [UT_ADMIN_312]),
        fact('Utah DOPL license class S202, Solar Photovoltaic Contractor, covers fabrication, construction, installation and replacement of PV modules and related components. It excludes wiring, connections and wire methods governed by the NEC, but an S202 may hire or subcontract an E200 or E201 electrical contractor for that work. A separate battery-only license class was not found in the rule text (not found, not confirmed absent). Third-party sites disagree with the rule text: use the rule and confirm with DOPL.', [UT_ADMIN_DOPL]),
        fact('Utah Code 15A-3 Part 6 (amended by Chapter 532, 2025 General Session) does not amend NEC Articles 690, 705 or 706 or rapid shutdown. It deletes NEC 230.67 and replaces 230.71 to allow up to six service disconnects. 230.71(B) stops being in effect on July 1, 2027.', [UT_CH3]),
        fact('The Sanctuary Settings Guide names Rocky Mountain Power in Utah as an example of a utility that requires specific grid interactive settings.', [src('settings', 43)]),
      ],
      images: [
        { src: 'images/codes/ut-15a-2-103-nec-2023.webp', alt: 'Utah Code 15A-2-103 page listing the 2023 National Electrical Code.', caption: 'Utah Code 15A-2-103 (page 3): the 2023 NEC.', sources: [UT_CODE] },
        { src: 'images/codes/ut-rmp-schedule-137-applicability.webp', alt: 'First page of Rocky Mountain Power Schedule 137.', caption: 'Schedule 137, p.1: who it applies to.', sources: [RMP137] },
        { src: 'images/codes/ut-rmp-schedule-137-export-credit.webp', alt: 'Schedule 137 export credit rates.', caption: 'Schedule 137, p.3: export credit rates.', sources: [RMP137] },
        { src: 'images/codes/ut-rmp-schedule-137-disconnect-switch.webp', alt: 'Schedule 137 special conditions: disconnect switch and customer responsibilities.', caption: 'Schedule 137, p.4: disconnect switch.', sources: [RMP137] },
      ],
    },
    {
      title: 'Texas',
      fromWeb: true,
      facts: [
        fact('Texas now uses the 2026 National Electrical Code. TDLR adopted it as the state electrical code (16 TAC 73.100) with a limited exception for ground-fault circuit interrupter requirements on certain outdoor outlets. The effective date is September 1, 2026. This replaces the 2023 NEC that was effective September 1, 2023.', [official('Commission Adopts Rules, Electricians, Sept. 1, 2026 (TDLR)', 'https://www.tdlr.texas.gov/news/rulemaking/2026/09/01/commission-adopts-rules-12/')]),
        fact('Houston Permitting Center: permit applications submitted on or after September 1, 2026 are reviewed against the 2026 NEC as the state minimum.', [official('2026 National Electrical Code Effective September 1, 2026 (Houston Permitting Center)', 'https://www.houstonpermittingcenter.org/news-events/2026-national-electrical-code-effective-september-1-2026')]),
        fact('Austin\'s Building Technical Codes page lists the National Electrical Code as 2023, with 2026 effective September 1, 2026.', [official('Building Technical Codes (City of Austin)', 'https://www.austintexas.gov/development-services/building-technical-codes')]),
        fact('Dallas adopted the 2023 NEC on April 23, 2025, effective May 23, 2025, with local amendments such as surge protection on feeders supplying dwellings (215.18) and an emergency disconnect when service equipment is replaced (230.85(C)). No Dallas page adopting the 2026 NEC was found, and how the 2023 local code works with the state\'s 2026 minimum was not found. Ask the Dallas permit office.', [official('Letter to Contractors for 2023 NEC (City of Dallas)', 'https://dallascityhall.com/departments/sustainabledevelopment/DCH%20documents/Letter%20to%20Contractors%20for%20%2723NEC.pdf')]),
        fact('Inside a city, electricians follow the city\'s permitting requirements and local amendments. Section 1305.201 of the Texas Electrical Safety and Licensing Act lets municipalities amend the NEC locally (from TDLR\'s 2022 notice about the 2023 NEC).', [TDLR_NEWS]),
        fact('PUC of Texas rule 16 TAC 25.211, Interconnection of On-Site Distributed Generation, with 25.212 (technical requirements), applies to electric utilities. For cooperatives only subsection (o) applies. On-site distributed generation is generation at the customer\'s point of delivery of 10 MW or less, connected below 60 kV. The copy read shows an effective date of 1/5/17.', [PUCT]),
      ],
      images: [
        { src: 'images/codes/tx-tdlr-compliance-guide-nec-2023.webp', alt: 'TDLR compliance guide: the 2023 NEC, effective September 1, 2023.', caption: 'TDLR compliance guide, 1.1 (the 2023 NEC, now replaced by the 2026 NEC).', sources: [TDLR_GUIDE] },
        { src: 'images/codes/tx-tdlr-nec-2023-adoption-news.webp', alt: 'TDLR news: local amendments and the start rule.', caption: 'TDLR news, November 30, 2022 (about the 2023 NEC, now replaced by the 2026 NEC).', sources: [TDLR_NEWS] },
        { src: 'images/codes/tx-puct-25-211-page-1.webp', alt: 'First page of 16 TAC 25.211.', caption: 'PUCT 25.211, p.1.', sources: [PUCT] },
      ],
    },
    {
      title: 'Texas utilities (Oncor, CPS Energy, CenterPoint, AEP Texas)',
      fromWeb: true,
      facts: [
        fact('Oncor: a single separate visible, lockable, labeled AC disconnect (VLLD) must be between the Oncor meter and all sources of distributed generation. It must have an external handle and be lockable, and it must be accessible at all times. Molded-case breakers are not acceptable VLLDs. It must be on an accessible exterior wall within 10 feet of the Oncor meter. The meter socket space is reserved for Oncor (no meter collars).', [official('Oncor Residential/Small Commercial Project Requirements, revised May 1, 2025 (Oncor)', 'https://www.oncor.com/content/dam/oncorwww/documents/for-installers/New-Residential-Requirements-2025.pdf.coredownload.pdf')]),
        fact('Oncor placards: caution placards are required on all distributed generation projects, on the VLLD and not on the meter, in UV-resistant material. If the VLLD is within 10 feet of the meter, Class 1 placards may be used. If it is farther than 10 feet, Class 2 or Class 3 placards are required.', [official('Oncor Residential/Small Commercial Project Requirements, revised May 1, 2025 (Oncor)', 'https://www.oncor.com/content/dam/oncorwww/documents/for-installers/New-Residential-Requirements-2025.pdf.coredownload.pdf')]),
        fact('Oncor drawings: the words "Visible Lockable Labeled Disconnect" must be written out in at least one place before "VLLD" is used, and the distance from the disconnect to the Oncor meter must be stated in feet. Each diagram must be a single flattened, non-editable PDF under 2 MB. The tariff application and interconnection agreement must be signed by the customer. At least 5 clear inspection photos are required.', [official('Oncor Residential/Small Commercial Project Requirements, revised May 1, 2025 (Oncor)', 'https://www.oncor.com/content/dam/oncorwww/documents/for-installers/New-Residential-Requirements-2025.pdf.coredownload.pdf')]),
        fact('Oncor: if non-identical equipment (different manufacturer or model number) replaces existing equipment, the interconnection agreement is voided and a new project is required. Oncor\'s list of equipment includes batteries.', [official('Oncor Residential/Small Commercial Project Requirements, revised May 1, 2025 (Oncor)', 'https://www.oncor.com/content/dam/oncorwww/documents/for-installers/New-Residential-Requirements-2025.pdf.coredownload.pdf')]),
        fact('CPS Energy (San Antonio, municipally owned): energy storage systems installed as part of a net-metered installation are not permitted to export power to the grid, but can power essential loads when the power is out. The DG Manual (9th Edition, May 1, 2024) is being revised to include battery energy storage systems. For battery questions CPS says to contact DG@cpsenergy.com or 210-353-2700.', [official('Distributed Generation (DG) Manual, 9th Edition, May 1, 2024 (CPS Energy)', 'https://www.cpsenergy.com/content/dam/corporate/en/Documents/Distributed%20Generation%20Manual.pdf')]),
        fact('CPS Energy: the DG owner pays for a visible load break disconnect switch installed to CPS Energy\'s specification, readily accessible to CPS personnel and able to be secured open with a CPS padlock (section 4.7). A screening study is required for all grid-tied systems and case by case for net-metered systems. CPS may require a witness test before granting permission to operate.', [official('Distributed Generation (DG) Manual, 9th Edition, May 1, 2024 (CPS Energy)', 'https://www.cpsenergy.com/content/dam/corporate/en/Documents/Distributed%20Generation%20Manual.pdf')]),
        fact('CenterPoint Energy (Houston): the visible lockable disconnect must be within 10 feet of the CenterPoint meter, with a placard if it is farther or out of line of sight. Systems with batteries need a Mode of Operation document describing how the battery will run with the grid (backup only, self-consumption, TOU and so on). The agreement is voided if the customer switches retail electric provider as a true move-in. CenterPoint interconnects under PUCT rules 25.211 and 25.212.', [web('Small Distributed Generation Project Application Submission Information (CenterPoint Energy), reported by Claude.ai research; not opened here', 'https://www.centerpointenergy.com/en-us/Documents/DistributedGenerationDocs/SmallScale-DER-Project-Documentation.pdf')]),
        fact('AEP Texas: all customers must have a visible lockable disconnect switch for the DER interconnection, and the interconnection service agreement is approved within 35 days of a complete application. This is from search excerpts only: the page body did not load, so verify it.', [web('Installing Generating Equipment (AEP Texas), reported by Claude.ai research; not opened here', 'https://www.aeptexas.com/business/builders/generating-equipment')]),
      ],
    },
  ],
  links: [
    {
      title: 'Lion Energy',
      items: [
        { label: 'Installers page', url: 'https://lionenergy.com/pages/installers', note: 'Opened 10/2/2026: app links, portals, manuals and compliance certificates. No training videos are linked there. Listed in the Technical Service Manual, p.99.' },
        { label: 'Lion Knowledge Library', url: 'https://info.lionenergy.com', note: 'Linked from the installers page.' },
        { label: 'Lion Certification Portal', url: 'https://certification.lionenergy.com', note: 'Linked from the installers page.' },
        { label: 'EMS-C Manual', url: 'https://support.lionenergy.com/files/manuals/Lion_Energy_EMS-C_Manual_7.pdf', note: 'Linked from the installers page.' },
        { label: 'CT Manual', url: 'https://support.lionenergy.com/files/manuals/Lion_Energy_CT_Manual_3.pdf', note: 'Linked from the installers page. Not yet read for this site.' },
        { label: 'Sanctuary 3 Installation Guide', url: 'https://support.lionenergy.com/files/manuals/sanctuary-3-installation-guide.pdf', note: 'Linked from the installers page. Sanctuary 3 content is held back.' },
      ],
    },
    {
      title: 'California (official sites)',
      items: [
        { label: 'California Energy Commission', url: 'https://www.energy.ca.gov/', note: 'State energy and building efficiency code.' },
        { label: 'California Public Utilities Commission', url: 'https://www.cpuc.ca.gov/', note: 'Utility rules, including interconnection.' },
        { label: 'Contractors State License Board', url: 'https://www.cslb.ca.gov/', note: 'Contractor licensing.' },
      ],
    },
    {
      title: 'Utah (official sites)',
      items: [
        { label: 'Utah Public Service Commission', url: 'https://psc.utah.gov/', note: 'Utility rules.' },
        { label: 'Utah Division of Professional Licensing (DOPL)', url: 'https://dopl.utah.gov/', note: 'Electrician and contractor licensing.' },
      ],
    },
    {
      title: 'Texas (official sites)',
      items: [
        { label: 'Public Utility Commission of Texas', url: 'https://www.puc.texas.gov/', note: 'Utility rules.' },
        { label: 'Texas Department of Licensing and Regulation (electricians)', url: 'https://www.tdlr.texas.gov/', note: 'Electrician licensing.' },
      ],
    },
  ],
  needed: [
    'Codes change. The three state sections come from official documents opened and read on 10/2/2026, with page images, but only for the points listed. Check the date on each before quoting it on a call.',
    'California: the Rule 21 tariff text for PG&E and SDG&E (SCE and PG&E were found, SDG&E was not). The CSLB battery rule was approved June 2024 but its effective date was stayed by a court order pending a San Diego case (reported, not opened here, and the case number differs between sources): do not tell anyone the C-10 and C-46 battery scope is in force until confirmed. The California Electrical Code item is also reported, not opened.',
    'Utah: psc.utah.gov and dopl.utah.gov refused automated access, and adminrules.utah.gov returned an error, so the PSC rule and DOPL license text are from Cornell LII copies of the Utah Administrative Code. A 2016 bulletin suggests battery wiring falls to electrical contractors (an inference, not a quote): confirm with DOPL.',
    'Texas buyback: the official text of Utilities Code 39.916 could not be opened. Chapter 39 mostly does not apply to municipal utilities (CPS Energy) or co-ops (section 39.002), and no statewide buyback rate was found. In retail-choice areas buyback depends on the customer\'s retail electric provider plan (an inference, not a quote). Do not teach a buyback rule yet.',
    'Texas code adoption by city: San Antonio was not found (only a 2024 committee agenda). Whether Dallas has adopted the 2026 NEC was not found. Houston and Austin are read from their own pages.',
    'Texas utilities: Oncor and CPS Energy are read from their own documents. CenterPoint and AEP Texas are reported by Claude.ai research and not opened here. Still missing: AEP Texas page body, and CPS Energy placard rules.',
    'Rapid shutdown, labeling and battery (NEC 706) requirements as adopted in each state, and generator backup rules.',
    'Local rules are set by each city or county AHJ and can differ from the state.',
  ],
}

export const COMPETITORS: Topic = {
  id: 'competitors',
  title: 'Competitors\' solar systems',
  lead: 'Specifications from manufacturer datasheets and comparison articles found on the web, next to the Sanctuary 2. Not Lion material: check before using on a call.',
  sections: [
    {
      title: 'The Sanctuary 2 for comparison (Lion documents)',
      facts: [
        fact('Sanctuary 2: a 12 kW hybrid inverter with four MPPTs (3 kW each), 120 V to 500 V MPPT range, a 14.3 kWh LFP battery on Rev 4 (up to 3 batteries per inverter), grid passthrough 100 A on Rev 4. It can also take AC solar at its generator port.', [src('manual', 26, 44), TSM(61, 65)], ['rev4']),
      ],
    },
    {
      title: 'Competitor specifications (from the web)',
      fromWeb: true,
      facts: [
        fact('Tesla Powerwall 3 (North America datasheet): 13.5 kWh AC nominal battery energy, 11.5 kW AC maximum continuous discharge, 5 kW AC maximum continuous charge, up to 20 kW solar STC input, up to 4 Powerwall 3 units supported, up to 3 expansion units (7 in total), 185 LRA load start, 15.4 kW off-grid continuous only when the on-grid rating is 11.5 kW, 10-year warranty. The datasheet gives no chemistry, no millisecond transfer time and no throughput. International datasheets list different continuous power (for example 11.04 kW in South Africa), so use the North America sheet for US calls.', [TESLA_PW3]),
        fact('Enphase IQ Battery 5P: 5.0 kWh usable, LFP, single phase, six embedded grid-forming microinverters, 3.84 kVA continuous at 240 VAC and 3.33 kVA at 208 VAC, 15-year or 6,000-cycle limited warranty.', [official('IQ Battery 5P data sheet (Enphase)', 'https://enphase.com/en-ca/download/iq-battery-5p-data-sheet')]),
        fact('Generac PWRcell 2 (spec sheet): usable energy 9, 12, 15, 18 or 36 kWh (M3 to M6, and M6 x2), maximum continuous power 5.2, 7, 8.7, 10.5 or 11.5 kW (11.5 kW needs two cabinets with at least 7 modules). Battery chemistry lithium nickel manganese cobalt (NMC). Automatic transfer time under 50 ms for the Smart Disconnect Switch. Warranty: battery modules 10 years or 7.56 MWh, inverter, cabinet and switch 10 years. Charging range 23 to 122 F, discharging -4 to 122 F. Peak power in kW is not on this sheet (it lists maximum AC start capacity). Generac\'s 2024 sell sheet shows slightly different figures, so name the edition.', [official('PWRcell 2 Specification Sheet (Generac)', 'https://www.generac.com/globalassets/residential/dealers--installers/generac-installer-programs/solar--battery-installer-support/pwrcell2_specsheet.pdf')]),
        fact('FranklinWH aPower 2 (datasheet, 2025-12-16): 15 kWh AC per unit, up to 15 units (225 kWh) per aGate, 10 kW or 11.5 kVA continuous discharge, 8 kW continuous charge, 15 kW peak for 10 seconds, lithium iron phosphate (LFP), -4 to 122 F, 15-year or 60 MWh throughput warranty. No transfer time is on the datasheet. FranklinWH support says under 16 ms (not read here).', [official('aPower 2 Datasheet, 2025-12-16 (FranklinWH)', 'https://www.franklinwh.com/document/apower-2-datasheet')]),
        fact('EG4 18kPV hybrid inverter (spec sheet, 2024): rated output 12,000 W at 240 VAC and 10,400 W at 208 VAC, 50 A, 48 VDC battery input up to 250 A, lead-acid or lithium batteries, transfer time 20 ms (10 ms configurable). The EG4 wall-mount battery was not found on a manufacturer page, so no battery specs are listed.', [official('EG4 18kPV Hybrid Inverter spec sheet, 2024 (EG4)', 'https://eg4electronics.com/wp-content/uploads/2024/04/EG4-18KPV-12LV-Spec-Sheet.pdf')]),
        fact('SolarEdge Home Battery 400V (reported datasheet, March 5, 2024): 9,700 Wh usable, 5,000 W continuous, 7,500 W peak for 10 seconds, up to 3 batteries per inverter, 10-year warranty, works with SolarEdge Home Hub inverters. Chemistry (NMC), transfer time and throughput are not on the datasheet.', [web('SolarEdge Home Battery 400V for North America (SolarEdge), reported by Claude.ai research; not opened here', 'https://knowledge-center.solaredge.com/sites/kc/files/se-solaredge-home-battery-datasheet-nam.pdf')]),
        fact('Sungrow SBR (UK datasheet only, version 4, 2024; its SH-RT inverter is three-phase and US homes are split-phase, so it is not sold for US homes and is not a fair US competitor): LiFePO4, 3.2 kWh modules, 2 to 8 modules (6.4 to 25.6 kWh), 30 A continuous, charge 0 to 50 C and discharge -20 to 50 C, IP55. It lists CE and IEC certificates and no UL listing, so treat it as a non-US product until confirmed.', [web('SBR064-SBR256 Datasheet (Sungrow UK), reported by Claude.ai research; not opened here', 'https://uk.sungrowpower.com/upload/file/20240827/EN_DS_SBR064…SBR256_Datasheet.pdf')]),
        fact('FranklinWH aGate: a microgrid interconnect device that works with any brand of solar inverter and standby generator, grid-tied or off-grid, with an optional Generator Module. A 2023 datasheet says 4 aPowers per aGate, but the 2025 aPower 2 datasheet says up to 15, so use the newer one. Transfer time and aGate warranty were not found on a FranklinWH page.', [web('Franklin Home Power V1.1 Datasheet, 2023 (FranklinWH), reported by Claude.ai research; not opened here', 'https://www.franklinwh.com/document/franklin-home-power-v11-datasheet-compressed')]),
        fact('Generac PWRcell 2 inverter (model APKE00075, spec guide, no date): maximum AC power 11.5 kW (needs two battery cabinets), operating range -22 to 122 F, battery input 360 to 420 VDC, 10-year warranty, certifications include UL 1741 SB, CA Rule 21 and CSIP. Whether it works without solar was not found.', [web('PWRcell 2 Inverter Spec Guide (Generac), reported by Claude.ai research; not opened here', 'https://www.generac.com/globalassets/residential/dealers--installers/generac-installer-programs/solar--battery-installer-support/pc2inverter_specguide.pdf')]),
        fact('SolarEdge Backup Interface (via a reseller copy): grid disconnection switchover under 100 ms, up to 3 batteries per inverter, service up to 200 A and up to 3 inverters. It works with the StorEdge single-phase inverter and the Home Hub inverter, but the Home Battery datasheet lists only Home Hub, so teach Home Hub as the current pairing.', [web('Backup Interface datasheet (SolarEdge, via solar-electric.com), reported by Claude.ai research; not opened here', 'https://knowledge-center.solaredge.com/sites/kc/files/se-solaredge-home-battery-datasheet-nam.pdf')]),
        fact('EG4 PowerPro WallMount All Weather battery (spec sheet v1.0.3, 2023): 14.3 kWh total (not usable) capacity, LiFePO4, over 8,000 cycles at 0.5C and 80% depth of discharge, 10-year warranty. Its temperature limits are protection cutoffs, not operating ranges. Power and stacking were not found.', [web('EG4-14.3kWh PowerPro WallMount AW Spec Sheet (EG4), reported by Claude.ai research; not opened here', 'https://eg4electronics.com/backend/wp-content/uploads/2023/09/EG4-14.3kWh-PowerPro-WallMount-AW-Spec-Sheet-1.0.3.pdf')]),
        fact('Fortress Power sells 48 V LFP batteries (for example the eVault MAX 18.5 kWh, expandable to 222 kWh, and the eFlex MAX 5.4 kWh) that talk to hybrid inverters over CAN or RS485.', [web('eVault 18.5kWh LFP Battery (Fortress Power)', 'https://www.fortresspower.com/products/evault-18-5kwh-lifepo-battery/'), web('Fortress Power eVault MAX 18.5kWh LFP Battery (Inverters R Us)', 'https://invertersrus.com/product/fortress-power-evault-max/')]),
      ],
    },
  ],
  needed: [
    'Which competitors the author wants covered. The ones here are the ones the search returned. The Sol-Ark 12K result was inconsistent and is left out.',
    'For each: how they connect to the grid and to solar, how they communicate, how to tell them apart on a call, and how a Sanctuary works with or replaces them. Only specifications are here so far, and prices change too often to list.',
    'Datasheets say "not stated" for several items: chemistry and transfer time for Tesla, maximum units and transfer time for Enphase, whether each product works without solar, and the EG4 wall-mount battery. Show these as "not stated by manufacturer", never from review sites. Sungrow has no US page.',
  ],
}

export const TOPICS: Topic[] = [ELECTRICITY, SOLAR, CODES, COMPETITORS]
