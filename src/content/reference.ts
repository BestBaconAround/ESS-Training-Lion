import { src } from './helpers'
import type { RevisionTag, SourceRef } from './types'

// Quick-lookup reference material for the Reference tab. Every row carries a source and a revision tag.
// Numbers come from the documents, never from general knowledge. Gaps are TODOs, not guesses.

export interface ReferenceRow {
  label: string
  value: string
  sources: SourceRef[]
  revisions: RevisionTag
}

export interface ReferenceSection {
  id: string
  title: string
  rows: ReferenceRow[]
}

const row = (label: string, value: string, sources: SourceRef[], revisions: RevisionTag = 'all'): ReferenceRow => ({ label, value, sources, revisions })

const AUTHOR = src('author')

export const REFERENCE_SECTIONS: ReferenceSection[] = [
  {
    id: 'contacts',
    title: 'Contacts and apps',
    rows: [
      row('ESS Support', '(435) 244-3352, Monday-Friday 8:00 AM-5:00 PM Mountain Time.', [src('emsc', 16), AUTHOR]),
      row('Where to look for help', 'info.lionenergy.com and lionenergy.com/pages/installers.', [src('emsc', 16)]),
      row('Apps', 'Technicians and installers use the Lion Technician app. Homeowners use the Lion Smart app or smart.lionenergy.com.', [src('emsc', 5, 15)]),
      row('Changing the Wi-Fi', 'Technician app: Select Service > "Change or Reconnect Network". Laptop with Bluetooth: smart.lionenergy.com > product > settings > change internet. The Lion Smart app can on Apple but not yet on Android. You must be within Bluetooth range.', [src('tsm', 60, 61)]),
    ],
  },
  {
    id: 'revisions',
    title: 'Telling the revisions apart',
    rows: [
      row('Rev 1', 'Six black plastic RJ45 connectors on the I/O board.', [src('tsm', 14)], ['rev1']),
      row('Rev 2', 'Six metallic RJ45 connectors facing downward, still the single row of green push connectors (20 AWG solid wire).', [src('tsm', 14)], ['rev2']),
      row('Rev 3', 'A black plastic RJ45 connector to the left of the six metallic ones, and a second row of push connectors.', [src('tsm', 14)], ['rev3']),
      row('Rev 4', 'Plug-in screw terminals instead of push connectors, and two power buttons on the side.', [src('tsm', 14, 15)], ['rev4']),
      row('Communicator', 'WCM on Revs 1-3 (and some Rev 4). EMS-C standard on Rev 4. Only one communicator per system, in the parent inverter.', [src('emsc', 13), AUTHOR]),
      row('CT size', '90A/90mA (1000:1) on Rev 1 and Rev 2. 200A/100mA (2000:1) on Rev 3 and Rev 4.', [src('settings', 31)]),
    ],
  },
  {
    id: 'lights',
    title: 'Lights and controls',
    rows: [
      row('Front panel LEDs', 'Solid green: no alarms. Flashing green: one or more active alarms (system functionality is limited) or the inverter is in standby with the power button off. Red: a fault, the inverter shut down to protect itself.', [src('tsm', 13, 19), src('manual', 10)]),
      row('Load port', 'If the normal LED is on solid and not flashing, the load port should be powered.', [src('tsm', 19)]),
      row('Orange or red', 'The fault LED can look orange or red depending on the LED and the viewer.', [AUTHOR]),
      row('Complete System Shutdown', 'Turns off all components of the inverter: the front LED goes off and you cannot communicate with the inverter.', [src('manual', 10), src('tsm', 35)], ['rev4']),
      row('AC/DC button', 'Turns off the loads and PV. The controller stays on and the green LED flashes. The 12V that powers the EMS-C comes through this button, so the EMS-C goes offline.', [src('manual', 10), src('tsm', 13, 35, 39)], ['rev4']),
      row('PV Disconnect', 'Rotary switch that controls whether the inverter accepts solar. On Revs 1-3 the DC switch is the PV disconnect.', [src('manual', 10), AUTHOR]),
      row('EMS-C light', 'No lights: not commissioned. 1 s blink yellow: connecting. Solid yellow: EMS-C or inverter updating. Solid blue: connected. 100 ms blink blue: uploading or downloading data. Solid red: disconnected, or the EMS-C faulted.', [src('emsc', 6)]),
    ],
  },
  {
    id: 'battery',
    title: 'Battery',
    rows: [
      row('Acceptable voltage before wiring', '51-55.6 VDC. Below 51.2 V a battery is probably under 7% charged; above 53.5 V it is probably over 98% charged.', [src('manual', 20, 21), AUTHOR]),
      row('Paralleling', 'Batteries within 0.5 V of each other is the recommendation. Higher current can flow from the high battery to the low one.', [src('manual', 20), src('tsm', 25, 26)]),
      row('Cells', 'Sixteen 3.2 V LiFePO4 cells in series (51.2 V nominal), with a 250 A circuit breaker inside. Sanctuary 2 batteries are black.', [src('tsm', 20)]),
      row('Cell limits', 'The battery stops charging when the max cell is over 3650 mV. It stops discharging when the min cell is under 2400 mV, and the inverter stops discharge under 2650 mV. A max-to-min cell difference over 700 mV (1000 mV on some batteries) may disable charging and discharging. Do not charge a battery below 0 C.', [src('tsm', 25, 26)]),
      row('Battery over-voltage alarm (A1_5)', 'Triggers above 59 V at the inverter battery terminal and clears below 56.5 V.', [src('tsm', 69, 70)]),
      row('Breaker window', 'Red = on, green = off.', [src('tsm', 24, 26)]),
      row('Depth of discharge defaults', 'On-grid DoD 90 and off-grid DoD 90 (SoC = 100 - DoD). Off-grid restart 10%. Off-grid, the loads shut off at 10% SoC and come back at 20%.', [src('settings', 13, 14), src('tsm', 32)]),
      row('BMS RJ45 pins', 'Pin 6 = GND (blue), pin 7 = RS-485 A (green), pin 8 = RS-485 B (orange). Sanctuary 1 batteries used pins 1, 2 and 3.', [src('tsm', 23, 24)]),
      row('BMS round 4-pin connector', 'A = green (RS-485 A), B = orange (RS-485 B), C = no connection, D = blue (GND).', [src('tsm', 23)]),
      row('Wake a low battery', '60V/5A variable supply set to 54V/5A at the inverter battery terminals, charge current at 20A, battery priority mode on. See the troubleshooting entry "A battery will not address, or reads 0 V".', [src('tsm', 24)]),
    ],
  },
  {
    id: 'grid',
    title: 'Grid, generator and solar',
    rows: [
      row('Grid reconnect window', 'Voltage 91.7% to 105% of nominal (105% is 126 V). Frequency 59.5 to 60.1 Hz. Grid Reconnection Delay default 300 s, minimum workable 33 s.', [src('tsm', 33, 34, 70)]),
      row('Grid type', 'Split phase 120/240 V is the most common. About 208 V line to line with 120 V on each leg is three-phase service. Parallel three-phase is supported only with three inverters.', [src('tsm', 34), src('settings', 23)]),
      row('Off-grid load limit', 'Alarm A1_0: limit load to 4 kW per leg per inverter for Sanctuary 2.', [src('tsm', 67)]),
      row('Sell-back reduction', 'Sell-back is reduced from about 106% of nominal grid voltage and is zero at 110%. It is also reduced when grid frequency exceeds 60.036 Hz.', [src('tsm', 65), src('settings', 33)]),
      row('MPPT voltage', 'Operating range 120 V to 500 V. It needs at least 120 V DC to start. Open-circuit voltage must never exceed 500 V.', [src('tsm', 61)]),
      row('PV per MPPT', '14 A input, 22 A Isc.', [src('manual', 26, 44)], ['rev4']),
      row('PV per MPPT', '12 A input, 15 A Isc.', [src('san2_3', 22, 39)], ['rev3']),
      row('Reversed PV', 'About -1 V from PV1+ to PV1- means the PV lines are reversed.', [src('tsm', 63)]),
      row('Leakage current', 'Normal PV-to-ground leakage is around 10 mA or less. A jump of 30 mA, or a rise past 300 mA, raises A1_10.', [src('settings', 35), src('tsm', 72)]),
      row('AC solar', 'Connects to the generator port. The AC solar inverter must be grid-following. If the generator port reads 240 V AC, it is ready; if AC solar is not sending power, look at the AC solar inverter. Revs 1 and 2 have no internal CT on the generator port, so AC solar is not tracked.', [src('tsm', 65)]),
      row('Generator', 'The inverter does not accept generator power while connected to the grid. With auto-start on, it commands the generator at the start SoC when off-grid. "Generator as grid" is only for off-grid installs and allows a dark start from the generator on the grid port.', [src('tsm', 66, 67), src('settings', 27, 30)]),
    ],
  },
  {
    id: 'ports',
    title: 'Ports and pins',
    rows: [
      row('CT pins', 'RJ45 pins 3 and 6 = L1 CT (3 = N, 6 = P). Pins 1 and 2 = L2 CT (1 = N, 2 = P). Rev 4 and Sanctuary 3 have both CTs in one plug. Plugged into the meter port, only the L2 CT reads, and it reads backwards.', [src('tsm', 9)], ['rev4']),
      row('CT placement', 'The CTs must at least include the current going to the inverter grid port. Loads upstream of the CTs cannot use battery power on demand while on-grid. In a parallel system only the parent inverter has the CTs (unless Common Grid CT is off).', [src('tsm', 9), src('settings', 33), src('manual', 34)]),
      row('WCM pins', '1 = 5 V, 6 = GND, 7 = RS-485 A, 8 = RS-485 B.', [src('tsm', 57)]),
      row('EMS-C inverter port', '1 = BMS CAN H, 2 = BMS CAN L, 4 = Inverter CAN H, 5 = Inverter CAN L, 6 = GND, 7 = RS-485 A, 8 = RS-485 B.', [src('tsm', 58)]),
      row('EMS-C battery port', 'On Sanctuary 2 it is only used to address the batteries during commissioning, not in normal operation.', [src('tsm', 58), src('emsc', 8)], ['rev4']),
      row('Rev 3 communicator cable', 'A special flat cable from the meter port to the WCM. A standard Ethernet cable will not work.', [src('tsm', 59)], ['rev3']),
      row('Meter port', 'Unused on Rev 4.', [AUTHOR], ['rev4']),
    ],
  },
  {
    id: 'tools',
    title: 'Tools for a service call',
    rows: [
      row('Standard kit', 'Multimeter with AC and DC clamp, Allen 4/6/8 mm, #1 and #2 Phillips, slotted and small slotted, 7 mm and 16 mm sockets, torque wrench, laptop, cell phone, USB-A to USB-C cable (firmware), RJ45 connectors, crimpers, cable tester, couplers and splitters, 60V/5A variable power supply, wire stripper, needle nose pliers, flashlight, USB to RS-485 adapter (RJ45: 6 = GND, 7 = A, 8 = B).', [src('tsm', 18, 19)]),
    ],
  },
  {
    id: 'documents',
    title: 'Source documents',
    rows: [
      row('Sanctuary Technical Service Manual', 'Updated 9/30/2026. Sanctuary 2 and 3. Newest, and it overrules the older guides and the author\'s notes.', [src('tsm')]),
      row('Settings Guide for Sanctuary 2 and 3', 'rev 1.1, 6/4/2026. Setting names, ranges, defaults and access levels.', [src('settings')]),
      row('Installation Guide, Gen2 12K (Rev 4)', 'Updated 12/20/24. 14.3 kWh battery.', [src('manual')], ['rev4']),
      row('Installation Guide 4/25/25 (2)', 'Revs 1-2. 13.5 kWh battery.', [src('san2_2')], ['rev1', 'rev2']),
      row('Installation Guide 4/25/25 (3)', 'Rev 3. 13.5 kWh battery.', [src('san2_3')], ['rev3']),
      row('EMS-C Manual', 'Updated 4/13/25. Sanctuary 2 and 3.', [src('emsc')]),
    ],
  },
]
