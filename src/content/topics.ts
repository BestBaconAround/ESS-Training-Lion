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
    'The web section was read as search summaries, not the full pages (the sites could not be opened from here). Check each source link before you teach from it, and have the author review the theory.',
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
  ],
  needed: [
    'How a solar cell works (the physics), cell and module construction, panel datasheet reading, and installation by roof type.',
    'How to wire a Tigo system next to a Sanctuary (where the CCA gets its power, and what the Sanctuary expects). Not in the Lion documents or the Tigo manual. Needs the author.',
    'Tigo field troubleshooting: the installation manual has no troubleshooting section, and support.tigoenergy.com refused automated access (error 403).',
    'The web sections were read as search summaries, not the full pages. Check each source link and have the author review them.',
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
        fact('TDLR adopted the 2023 National Electrical Code, as it existed on August 25, 2022, effective September 1, 2023.', [TDLR_GUIDE]),
        fact('Non-exempt electrical work started on or after September 1, 2023 must be installed to the 2023 NEC. Work starts the day the electrician begins installing electrical materials or equipment in the building.', [TDLR_NEWS]),
        fact('Inside a city, electricians follow the city\'s permitting requirements and local amendments. Section 1305.201 of the Texas Electrical Safety and Licensing Act lets municipalities amend the 2023 NEC locally.', [TDLR_NEWS]),
        fact('PUC of Texas rule 16 TAC 25.211, Interconnection of On-Site Distributed Generation, with 25.212 (technical requirements), applies to electric utilities. For cooperatives only subsection (o) applies. On-site distributed generation is generation at the customer\'s point of delivery of 10 MW or less, connected below 60 kV. The copy read shows an effective date of 1/5/17.', [PUCT]),
      ],
      images: [
        { src: 'images/codes/tx-tdlr-compliance-guide-nec-2023.webp', alt: 'TDLR compliance guide: the 2023 NEC, effective September 1, 2023.', caption: 'TDLR compliance guide, 1.1.', sources: [TDLR_GUIDE] },
        { src: 'images/codes/tx-tdlr-nec-2023-adoption-news.webp', alt: 'TDLR news: local amendments and the start rule.', caption: 'TDLR news, November 30, 2022.', sources: [TDLR_NEWS] },
        { src: 'images/codes/tx-puct-25-211-page-1.webp', alt: 'First page of 16 TAC 25.211.', caption: 'PUCT 25.211, p.1.', sources: [PUCT] },
      ],
    },
  ],
  links: [
    {
      title: 'Lion Energy',
      items: [
        { label: 'Installers page (training videos, compliance certificates, knowledge library)', url: 'https://lionenergy.com/pages/installers', note: 'Listed in the Technical Service Manual, p.99.' },
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
    'California: the CPUC Rule 21 tariff text, net metering rules, contractor licensing (CSLB) and which NEC edition the California Electrical Code is based on. Not read yet.',
    'Utah: Public Service Commission rules and DOPL licensing (both sites refused automated access, error 403) and the statewide amendments to the NEC.',
    'Texas: each utility\'s own interconnection manual, retail buyback rules, and the 2023 NEC text itself (NFPA copyright: link, do not copy).',
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
        fact('Tesla Powerwall 3: 13.5 kWh nominal energy, up to 11.5 kW AC continuous power on 120/240 V split phase, up to 20 kW DC solar input, 6 MPPTs at 60 to 480 V DC and 15 A per MPPT. Up to 15.4 kW off-grid continuous discharge, only when there is enough solar. Up to 4 Powerwall 3 units, with up to 3 expansion units, 7 in total.', [web('Powerwall 3 Datasheet (Tesla Energy Library)', 'https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/Datasheet/en-us/Powerwall-3-Datasheet.pdf'), web('Powerwall 3 Specifications (Tesla Energy Library)', 'https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/InstallManual/BackupSwitch/en-us/GUID-EC527BC7-4750-4425-BBC4-DB8C000339B3.html')]),
        fact('Enphase IQ Battery 5P: 5.0 kWh usable energy, LFP chemistry, six embedded IQ8D-BAT microinverters, 3.84 kVA continuous and 7.68 kVA peak power in backup. It needs an IQ System Controller 3 for grid-tied and backup operation. AC round-trip efficiency 90% and DC round-trip efficiency 96%.', [web('IQ Battery 5P data sheet (Enphase)', 'https://enphase.com/en-ca/download/iq-battery-5p-data-sheet')]),
        fact('FranklinWH aPower 2 (one source): 13.6 kWh usable and 12 kW continuous. Not confirmed on a manufacturer page.', [web('Tesla Powerwall 3 vs Enphase IQ Battery 5P: 2026 Comparison (Boston Solar)', 'https://www.bostonsolar.us/solar-blog-resource-center/blog/tesla-powerwall-3-vs-enphase-iq-battery-5p-which-solar-battery-is-better-for-col/')]),
        fact('Generac PWRcell (one source): 9 kWh to 18+ kWh and up to about 9 kW continuous. Not confirmed on a manufacturer page.', [web('Tesla Powerwall 3 vs Enphase IQ Battery 5P: 2026 Comparison (Boston Solar)', 'https://www.bostonsolar.us/solar-blog-resource-center/blog/tesla-powerwall-3-vs-enphase-iq-battery-5p-which-solar-battery-is-better-for-col/')]),
        fact('EG4 18kPV hybrid inverter (one source): up to 18 kW of PV across 3 MPPTs at 100 to 600 VDC and about 12 kW continuous output, for 48 V batteries including LFP. Not confirmed on a manufacturer page.', [web('Sol-Ark 12k vs. Sol-Ark 15k vs. EG4 18kPV specs (GitHub gist)', 'https://gist.github.com/dotspencer/f7430484bc246f5f9e0b5ace2a49d7d5'), web('Sol-Ark vs EG4 Hybrid Inverters (Portlandia Electric Supply)', 'https://www.portlandiaelectric.supply/blogs/energy-solutions/solark-vs-eg4-hybrid-inverter')]),
        fact('Fortress Power sells 48 V LFP batteries (for example the eVault MAX 18.5 kWh, expandable to 222 kWh, and the eFlex MAX 5.4 kWh) that talk to hybrid inverters over CAN or RS485.', [web('eVault 18.5kWh LFP Battery (Fortress Power)', 'https://www.fortresspower.com/products/evault-18-5kwh-lifepo-battery/'), web('Fortress Power eVault MAX 18.5kWh LFP Battery (Inverters R Us)', 'https://invertersrus.com/product/fortress-power-evault-max/')]),
      ],
    },
  ],
  needed: [
    'Which competitors the author wants covered. The ones here are the ones the search returned. The Sol-Ark 12K result was inconsistent and is left out.',
    'For each: how they connect to the grid and to solar, how they communicate, how to tell them apart on a call, and how a Sanctuary works with or replaces them. Only specifications are here so far, and prices change too often to list.',
    'Manufacturer pages for FranklinWH, Generac, EG4, Sol-Ark, SolarEdge and others. They could not be opened from here, so those numbers are from comparison articles and are marked as not confirmed.',
  ],
}

export const TOPICS: Topic[] = [ELECTRICITY, SOLAR, CODES, COMPETITORS]
