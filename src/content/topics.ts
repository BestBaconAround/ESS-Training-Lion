import { src } from './helpers'
import type { Fact } from './types'
import { fact } from './helpers'

// Knowledge pages: Electricity, Solar panels, Codes, Competitors. Built only from the documents. Whatever the author
// wants covered that the documents do not give is listed under `needed`, never filled in from general knowledge.

export interface TopicSection {
  title: string
  facts: Fact[]
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
  ],
  needed: [
    'Electrical theory the author wants covered, from a source: voltage, current, power and energy; split phase and three phase; neutral, ground and bonding; breakers and wire sizing; AC vs DC safety; power factor; how to read a one-line diagram.',
    'A multimeter lesson (see the "How a multimeter works" procedure).',
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
  ],
  needed: [
    'Panel theory the author wants covered, from a source: cells, bypass diodes, Voc, Isc, Vmp and Imp, temperature coefficients, shading, string sizing rules, panel datasheets.',
    'Tigo optimizers and CCAs (see the Tigo procedure).',
    'Installation by roof type and a one-line diagram walk-through.',
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
    'The specific requirements for each state that matter for the Sanctuary and solar (interconnection, rapid shutdown, labeling, permitting, which NEC edition, battery and generator rules), and the exact pages on each official site. These have to come from the author or Confluence.',
    'Check the official links. They are agency home pages and could not be opened from here, so confirm each one loads and add the deep links to the code pages.',
    'Local rules are set by each city or county AHJ and can differ from the state.',
  ],
}

export const COMPETITORS: Topic = {
  id: 'competitors',
  title: 'Competitors\' solar systems',
  lead: 'Nothing here yet. Competitor information has to come from the author or Confluence.',
  sections: [],
  needed: [
    'Which competitors the author wants covered.',
    'For each: the products, how they connect to the grid and to solar, how they communicate, how to tell them apart on a call, and how a Sanctuary works with or replaces them.',
    'Sources for every claim. The platform does not use general knowledge.',
  ],
}

export const TOPICS: Topic[] = [ELECTRICITY, SOLAR, CODES, COMPETITORS]
