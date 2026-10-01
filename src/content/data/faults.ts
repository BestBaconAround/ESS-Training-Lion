import type { RevisionTag, SourceRef } from '../types'

/** A troubleshooting line. A bare string is for all revisions and cites the code's own manual pages. */
export type FaultStep = string | { text: string; revisions: RevisionTag; sources?: SourceRef[] }

export interface FaultCode {
  code: string
  name: string
  description: string
  solutions: FaultStep[]
  sources: SourceRef[]
  /** Visible gaps and conflicts with older documents. Never guess. */
  todo?: string[]
}

export const faultStepText = (s: FaultStep): string => (typeof s === 'string' ? s : s.text)

const T = (...pages: number[]): SourceRef[] => [{ source: 'tsm', pages }]

/**
 * Alarm / Fault / Status codes from the Sanctuary Technical Service Manual, updated 9/30/2026, pp.67-96.
 * It supersedes the table in the Installation Guide 4/25/25 (2), pp.32-35, which had 24 codes. Where the two
 * disagree (A1_12, A2_8, A2_9, A2_10) the entry carries a todo. The author confirmed all codes apply to all Sanctuaries.
 * Codes with an empty description or troubleshooting cell in the manual are listed as the manual has them.
 */
export const FAULT_CODES: FaultCode[] = [
  {
    code: "A1_0",
    name: "Over-Current Discharge",
    description: "This alarm occurs when the load is drawing too much power from the battery (usually when the grid is down).",
    solutions: [
      "Either wait five minutes for the alarm to clear, or power cycle the inverter. It should clear after that.",
      "Limit load usage to 4kW per leg per inverter for Sanctuary 2, or 6kW per leg for Sanctuary 3.",
    ],
    sources: T(67),
  },
  {
    code: "A1_1",
    name: "Over-Load",
    description: "When the load demand exceeds the inverter's power rating when off-grid, the inverter will shut down to protect itself.",
    solutions: [
      "The alarm clears after 5 minutes (default delay), depending on the fault restart time setting.",
      "Turn off high power loads such as appliances with motors until it powers back on.",
    ],
    sources: T(67),
  },
  {
    code: "A1_2",
    name: "Battery Disconnected",
    description: "This alarm can be triggered when the inverter detects that it is not connected to a battery. It can be triggered when all batteries are either disconnected or the BMS disabled discharging, when the battery's circuit breaker is off, or when the inverter's battery port circuit breaker is off (Sanctuary 3).",
    solutions: [
      "Use the compare function in the Lion Energy app to check the battery voltage on the inverter against the batteries.",
      "If the inverter is at around 11 V, try the battery wake-up function. Within one minute the inverter should raise the battery terminal voltage to about 48.5 V. When the battery senses charging current it should re-enable itself.",
      "If the battery's internal voltage is greater than the inverter's battery terminals, it will not see charging current and will not re-enable.",
      "A power supply can also help. See \"Sanctuary 2: One Battery is Low and its Breaker is Off\" in the Technical Service Manual.",
    ],
    sources: T(67, 68),
  },
  {
    code: "A1_3",
    name: "Battery Under-Voltage / Battery Under Capacity",
    description: "This happens when a battery's state of charge is below the desired/target state of charge (for example the target is 20% and the battery is at 15%, or the DoD limit is 30% and the battery is at 65%). If any cell voltage drops below the minimum cell voltage setting, it also triggers this alarm. It can be triggered from BMS communication failures. It could be triggered together with A1_4 if both the off-grid DoD and on-grid DoD are set to a level allowing less than the current SoC. This alarm can usually be ignored. It can happen after a power outage when the batteries are discharged below the target state of charge. If you live in a jurisdiction where charging batteries from the grid is not allowed, you need to wait for solar power to be greater than the load power so it can start charging the battery back above the target SoC.",
    solutions: [
      "On older firmware, this alarm would alert when an inverter was first powered on and would clear on its own after a minute or so.",
      "Check battery minimum cell voltage and state of charge data and compare them to the limits in their respective settings.",
      "Wait for solar and/or grid to charge the battery.",
      "Verify the target state of charge (time-of-use setting) is correct.",
      "If grid charging is not allowed, to charge the battery from solar enable Emergency Mode so it uses grid power for loads and charges the battery from solar.",
      "Check the time-of-use settings and make sure Grid Charge is enabled (if allowed by your jurisdiction).",
      "Check the advanced settings and make sure Solar Charge Only is disabled if you want to be able to charge from grid or generator.",
      "DoD settings should allow a sufficient range (default is 90%).",
    ],
    sources: T(68, 69),
  },
  {
    code: "A1_4",
    name: "Battery Low Voltage / Battery Low Capacity",
    description: "This alarm is triggered when the BMS sends status byte 1, bit 5 \"cell under voltage\", or when either the off-grid DoD or on-grid DoD is set to a SoC less than the current SoC.",
    solutions: [
      "On older firmware, this alarm would alert when an inverter was first powered on and would clear on its own after a minute or so.",
      "If it does not clear, double check battery voltage and depth of discharge settings. Allow batteries to charge above the DoD target.",
      "If all else fails, power cycle the inverter.",
      "Also refer to the A1_3 troubleshooting.",
    ],
    sources: T(69),
  },
  {
    code: "A1_5",
    name: "Battery Over-Voltage",
    description: "This alarm is triggered if the inverter's battery terminal voltage exceeds 59 V. It should clear when the inverter's battery terminal voltage drops below 56.5 V.",
    solutions: [
      "On old firmware, this alarm would occasionally happen when the inverter powered on. It should clear on its own after a minute or so.",
      "If the inverter's battery terminal voltage is less than 56.5 V and the alarm has not cleared, power-cycle the inverter.",
    ],
    sources: T(69, 70),
  },
  {
    code: "A1_6",
    name: "Grid Low Voltage",
    description: "This alarm triggers every time the inverter gets reconnected to the grid, along with A1_8 grid low frequency. It remains on until the inverter reconnects to the grid, which is usually a five or six-minute delay. If it is triggered while the inverter is connected to the grid, the inverter disconnects from the grid and tries to run on battery power. It persists if one of the parallel inverters detects a load port or grid port wiring problem. The grid voltage and frequency must be within the reconnect window before it connects (default voltage window is 91.7% to 105% of nominal).",
    solutions: [
      "If the alarm persists for more than five minutes, check the inverter's grid port voltage. L1 and L2 should be 120 V to N, and L1 to L2 should be 240 V.",
      "Make sure all parallel inverters are connected to the grid and their breakers are on. Phasing must be consistent between the inverters.",
      "Make sure the inverter's grid setting matches the grid. 120/240 V is the most common. Three-phase 208 V is also supported for one or three inverter configurations.",
      "If the inverter detected a grid port or load port wiring error, it requires a power-cycle to clear that alarm.",
    ],
    sources: T(70, 71),
  },
  {
    code: "A1_7",
    name: "Grid Over-Voltage",
    description: "If this alarm is triggered, the grid voltage is too high and the inverter disconnects from the grid and tries to run on battery and solar power. The grid must be within 91.7% and 105% (default settings) of nominal grid voltage before it reconnects. Some areas have consistently high grid voltages and the setting needs to be increased.",
    solutions: [
      "The grid reconnect voltage settings need to be adjusted for voltages over 126 V.",
    ],
    sources: T(71),
  },
  {
    code: "A1_8",
    name: "Grid Low Frequency",
    description: "This alarm is triggered when the grid input frequency is below the minimum grid frequency. It is also briefly active after the grid comes back on, before the inverter reconnects to the grid; in that case the grid frequency is not actually low. The reconnect frequency default range is 59.5 to 60.1 Hz.",
    solutions: [
      "Check the setting for the grid standard.",
      "Compare the measured grid frequency to the inverter's reading of grid frequency.",
      "Check the grid reconnect frequency settings.",
      "Ensure all inverters are connected to the grid and their breakers are on.",
      "If using a generator, check the generator frequency settings or reduce battery charge current from the generator.",
      "If that all looks right and it does not clear, try a power cycle.",
    ],
    sources: T(71, 72),
  },
  {
    code: "A1_9",
    name: "Grid High Frequency",
    description: "This alarm is triggered when the grid input frequency is above the maximum grid frequency. The default reconnect frequency window is 59.5 to 60.1 Hz.",
    solutions: [
      "The grid reconnect high frequency setting might need to be adjusted. Sometimes the grid exceeds 60.1 Hz.",
    ],
    sources: T(72),
  },
  {
    code: "A1_10",
    name: "Leakage Current (GFCI Fault)",
    description: "Any current leakage to ground from the solar PV lines above 30 mA may trigger this alarm. A large amount of ground leakage can damage the inverter. For inverters with fuse protection on the MPPT inputs, excessive current can blow a fuse. For a sudden jump in current the inverter shuts off: 30 mA jump, stop in 300 ms; 60 mA jump, stop in 150 ms; 150 mA jump, stop in 40 ms; steady current over 300 mA, stop in 300 ms.",
    solutions: [
      "For the inverter with the alarm, check all PV strings for ground leakage current. Solar to ground leakage is usually intermittent. The alarm often coincides with rain.",
      "Check solar panels for physical damage, cracks, and signs of moisture ingress such as water spots under the glass. Check for wiring connections that are not waterproof.",
      "Solar to ground leakage can be graphed in the Lion Energy web app. The normal reading is around 10 mA.",
      "For leakage less than 1 A, the leakage current may be measured while the DC PV disconnect switch is on. Use a clamp-on DC ammeter with 1 mA resolution: at the inverter, clamp the meter around both the positive and negative leads of the string at the same time, and it reads the difference, which is the ground leakage current. Measure each string.",
      "For leakage greater than 1 A, turn off the DC PV disconnect switch. Measure DC voltage between each terminal of the string and ground. A voltage reading may indicate which string has the ground leakage. A string isolated from ground should not read any DC voltage to ground.",
    ],
    sources: T(72, 73),
  },
  {
    code: "A1_11",
    name: "Parallel CAN Communication Fault",
    description: "This happens when inverters are configured to be in parallel, but the inverters are not able to communicate with each other between the parallel ports. See the installation guide for proper connections.",
    solutions: [
      "Make sure the CAN communication cables are connected in the right places.",
      "Use an Ethernet cable tester to test CAT5 cables to make sure there are no shorts or opens in the cables.",
      "Make sure all inverters are on the same firmware versions.",
      "If someone attempted to commission a child inverter separately, that could cause this alarm.",
    ],
    sources: T(73),
  },
  {
    code: "A1_12",
    name: "Grid CT is Reversed",
    description: "Even though this alarm exists, do not rely on it to detect improper CT installation. It does not detect improper CT installation.",
    solutions: [
      "Check to be sure the CTs are installed correctly. The arrow should be pointing away from the inverter. See the CT manual online.",
    ],
    sources: T(74),
    todo: ["The older Installation Guide (4/25/25 (2), p.33) said A1_12 means the CTs were installed improperly. The Technical Service Manual (9/30/2026) says the alarm does not detect that, so check the CTs by their data, not by this alarm."],
  },
  {
    code: "A1_13",
    name: "DC BUS Under-Voltage",
    description: "This can happen at the same time as an inverter overload alarm.",
    solutions: [
      "If the fault does not clear after five minutes, try power-cycling the inverter.",
    ],
    sources: T(74),
  },
  {
    code: "A1_14",
    name: "DC BUS Over-Voltage",
    description: "This alarm is triggered if any MPPT voltage exceeds 500 V. Solar panel voltages increase as temperature decreases. Some customers see this alarm for the first time when the weather turns cold because the installer did not account for the Voc increase in cold temperatures. This alarm can also happen when a battery disables charging under high current. If the charging voltage is too high or not enough charge derating is set in the settings, this can happen.",
    solutions: [
      "Using the Lion Energy web app, check the PV voltage history on each of the PV strings. If any string exceeded 500 V, this is the cause. Rotate the DC solar switch to off and have the installer shorten the PV string so it will not exceed 500 Voc.",
      "Check settings for charging voltage, max cell V, battery cell derating voltage, derating charging voltage, and inverter max charging current.",
      "Check battery voltage calibration. When charging is enabled, the BMS battery voltage and the inverter battery voltage should agree within 0.3 V.",
    ],
    sources: T(74),
  },
  {
    code: "A1_15",
    name: "Inverter Over-Current",
    description: "This happens when the power demand on the inverter exceeds its rating. It can also happen when multiple inverters are connected, but out of sync due to improper parallel setup.",
    solutions: [
      "After the over-current problem is resolved, this alarm should clear on its own after 5 minutes. Turn off loads and check what the inverter was doing before the alarm tripped to avoid getting the alarm again. After the alarm is cleared, turn loads back on.",
      "This can also be caused by a grid relay that is stuck closed. A relay can get stuck due to over-current. See the relay check section in the Technical Service Manual.",
      "If this alarm happens when the grid goes down and the inverter restarts five minutes later, check the grid relay delay setting. If it is less than 4 ms, try 4 ms. If it is already 4 ms, try 8 ms. The Lion Energy ESS support team has access to update this setting.",
    ],
    sources: T(75),
  },
  {
    code: "A1_22",
    name: "EMS-C Backup Battery Disconnected",
    description: "The EMS-C battery charging circuit does not detect a battery inside the EMS-C.",
    solutions: [
      "The EMS-C battery has disabled discharging and the charge controller chip does not sense a battery and is not giving the battery charging voltage.",
      "Try power-cycling the EMS-C several times in a few seconds.",
    ],
    sources: T(75),
  },
  {
    code: "A1_23",
    name: "Cellular Data Limit Reached",
    description: "The EMS-C has used the allotted cellular data for the month.",
    solutions: [
      "Try reconnecting WiFi.",
      "Try connecting an Ethernet cable between the customer's router and the EMS-C's Ethernet port.",
    ],
    sources: T(75, 76),
  },
  {
    code: "A2_0",
    name: "Over-Current Charge",
    description: "Battery charging over the maximum current.",
    solutions: [
      "Compare inverter battery charging current readings from the web app against a clamp-on DC ammeter.",
      "Compare battery charging currents on each battery from the web app against a clamp-on DC ammeter.",
      "Check the setting for Battery Max Charge Current for the maximum charge current allowed to a single battery.",
      "Check the setting for System Charge Current for the total current from all inverters to charge the batteries.",
      "If the charging current per battery is less than 140 A on each battery, power-cycle the inverter to clear the alarm.",
    ],
    sources: T(76),
  },
  {
    code: "A2_1",
    name: "BUS Voltage Unbalanced",
    description: "This alarm can trigger if the power button is off while the solar is still on for a long time. The fix for this was included in the September 2024 firmware release.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(76),
  },
  {
    code: "A2_2",
    name: "Inverter Under-Voltage",
    description: "This can occur due to an internal hardware failure in the inverter.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(77),
  },
  {
    code: "A2_3",
    name: "Inverter Over-Voltage",
    description: "This can occur due to an internal hardware failure in the inverter.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(77),
  },
  {
    code: "A2_4",
    name: "Inverter Frequency Error",
    description: "This can occur due to an internal hardware failure in the inverter.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(77),
  },
  {
    code: "A2_5",
    name: "IGBT Over-Temperature",
    description: "The inverter's NTC temperature sensor on the IGBTs is reporting too high temperature.",
    solutions: [
      "Turn off the inverter and wait for an hour before powering on again.",
      "Make sure there is adequate ventilation.",
      "Make sure there are no obstructions to the fans.",
      "Make sure all fans are working properly.",
    ],
    sources: T(77),
  },
  {
    code: "A2_6",
    name: "BMS System Failure",
    description: "The battery might be sending an alarm code.",
    solutions: [
      "See the BMS communication failure alarm (A2_11) for ideas on clearing it. If that does not work, try a power cycle.",
    ],
    sources: T(77),
  },
  {
    code: "A2_7",
    name: "Battery Over Temperature",
    description: "This happens when the battery cell temperature exceeds the BMS temperature limit, usually 65 C. It recovers at 55 C.",
    solutions: [
      "This alarm is triggered by the BMS alarm \"cell over-temperature charging\".",
      "Ensure the battery has adequate ventilation and is not installed in direct sunlight.",
    ],
    sources: T(77),
  },
  {
    code: "A2_8",
    name: "Battery Under Temperature",
    description: "This happens when the battery is too cold or has an open or faulty sensor/connection. The alarm should clear once the battery cells are above 0 C. A BMS communication error can also trigger this alarm.",
    solutions: [
      "This alarm is triggered by the BMS alarm \"cell under-temperature discharging\" or \"cell under-temperature charging\".",
      "It is best to install the battery in a temperature-controlled environment. If the battery is outdoors, the alarm persists as long as the battery is too cold to charge.",
    ],
    sources: T(78),
    todo: ["The older Installation Guide (4/25/25 (2), p.34) told the specialist to check the temperature of the inverter and whether the fans work. The Technical Service Manual (9/30/2026) describes a cold battery. Confirm which one applies."],
  },
  {
    code: "A2_9",
    name: "Relay open",
    description: "A relay inside the inverter may not be making good contact or failed to close.",
    solutions: [
      "If the inverter status is on-grid and one load line is not getting power, a bad relay may be the cause. If on-grid and both load lines are not getting power, the grid relays might not be closing.",
      "On Revs 1-3 this can be an old firmware problem, since there are two sets of grid relays: one controlled by the DSP and the other controlled by the ARM. Make sure the inverter firmware is up to date.",
    ],
    sources: T(78),
    todo: ["The older Installation Guide (4/25/25 (2), p.34) listed A2_9 as \"Battery Cell Unbalanced\" (cell voltage difference over 0.4 V: charge the low cells with a power supply). The Technical Service Manual (9/30/2026) lists A2_9 as \"Relay open\". Confirm which one applies to the system on the call."],
  },
  {
    code: "A2_10",
    name: "Battery is Reverse Polarity",
    description: "The inverter does not have reverse polarity protection on the battery terminal. This alarm is a place-holder.",
    solutions: [
      "Connect battery positive to the positive terminal and battery negative to the negative terminal. There is no reverse polarity protection on the battery terminal.",
    ],
    sources: T(78),
    todo: ["The older Installation Guide (4/25/25 (2), p.34) said A2_10 happens when the battery cables are reversed, and to power cycle after fixing them. The Technical Service Manual (9/30/2026) says the alarm is a place-holder, so a reversed battery will not necessarily show A2_10. Confirm."],
  },
  {
    code: "A2_11",
    name: "BMS Communication Failure",
    description: "For Sanctuary 2: this happens when the inverter is unable to receive responses from the BMS in one or more batteries. For Sanctuary 3: this happens when the inverter is unable to communicate with the first battery over the CAN bus.",
    solutions: [
      "This is the most common alarm. If it is triggered, focus on it first before any others. It could resolve other alarms. It triggers as soon as the inverter gets power and should clear on its own within a minute or two. If it does not, try a method below. After trying any method, wait a minute or two. Sometimes the inverter takes a few minutes to query the BMS using all the different protocols.",
      "Make sure all the BMS cables are plugged in and to the correct port according to the installation manual. Check contact inside the splitter (if used). Occasionally pins get bent and do not connect. Make sure connections are secure (no broken clips).",
      "If commissioning or installing, the BMS address should be 1 for one battery. If there are more batteries, each address should be unique and count up from 1 with no gaps. This addressing takes place during commissioning, but can also be done in the Lion Technician app under \"select service\".",
      "Make sure the number of batteries you are installing agrees with the number of batteries during commissioning.",
      "An installer may use the Lion Technician app to verify each battery is communicating with the function \"Read battery address\" under \"Select Service\".",
      "If a battery does not respond to \"Read battery address\", check the terminal voltage. If the terminal voltage is less than 40 V, try manually charging the battery with 5 A of current. If no charging current is accepted, check the battery circuit breaker and retry charging at 5 A. If the battery terminals are above 50 V, try a different BMS cable.",
      "If all batteries respond to \"Read battery address\", power-cycle the inverter.",
      "Check any Ethernet style cables and couplers used for BMS communication with an Ethernet cable tester. If a BMS cable connector needs to be replaced, unplug the cable from the battery before changing the end. On the RJ-45 connector, pin 6 = GND, pin 7 = A, pin 8 = B.",
      { text: "On Revs 1-3 with a splitter on the BMS port: after commissioning, make sure the BMS splitter is plugged into the BMS communication port, and check the wire orientation of the BMS cable (installation guide).", revisions: ['rev1', 'rev2', 'rev3'], sources: [{ source: 'san2_2', pages: [34] }] },
    ],
    sources: T(79, 80),
  },
  {
    code: "A2_12",
    name: "PV Miswiring (old name: Battery Fault)",
    description: "Since the October 2023 firmware release, if the PV wiring is grounded, this alarm is triggered. The inverter can only sense this dangerous condition if the PV is turned on before connecting to the grid. The inverter checks if GND to BUS- is negative during the PV insulation check. If that error condition happens, this alarm is triggered. This check cannot happen if PV is switched on after the inverter connects to the grid.",
    solutions: [
      "If a PV- terminal is connected to GND, the inverter may be damaged. Since Sanctuary 2 Rev 4, the inverter has a fuse on each PV- terminal.",
      "This alarm is unrecoverable, meaning a power-cycle is required to clear it. The unit must be powered off and wiring connections corrected before being powered back on.",
      "Never connect grid power to the Sanctuary inverter if there is a solar to ground short. Never turn on the DC solar switch if there is a solar to ground short.",
    ],
    sources: T(81),
  },
  {
    code: "A2_13",
    name: "Grid Over-Load",
    description: "This happens when the load power exceeds the inverter's power rating. The inverter does grid pass-through and still contributes up to its rated power, but if the grid is interrupted while demand exceeds capability, it will not be able to keep the loads powered and will shut off.",
    solutions: [
      "Reduce load power consumption so that each inverter does not need to supply more than its rated power. The alarm should clear once the load is reduced to below its rated power.",
    ],
    sources: T(82),
  },
  {
    code: "A2_14",
    name: "Grid Phase Error",
    description: "Grid phase sequence is incorrect. This alarm is specific to three-phase installations.",
    solutions: [
      "Check the grid phase sequence (if three phase). The line 1 phase should be leading the line 2 phase for each inverter. See the instructions for wiring up and commissioning three-phase systems in the installation manual.",
      "Power-off the inverter and correct the wiring before turning the inverter back on.",
    ],
    sources: T(82),
  },
  {
    code: "A2_15",
    name: "ARC Fault Detected",
    description: "The arc fault detector is located just above the PV connections in the inverter. If any PV wiring sparks (loose connection), it should trigger this alarm. If there is any arcing inside a solar panel, it should trigger this alarm. Solar production is shut down to prevent fire. This fault does not clear automatically per NEC 690.11.",
    solutions: [
      "Check PV panels and PV wiring. Repair or replace any damaged wiring, connectors, panels or MLPE.",
      "Restart the inverter to clear the alarm.",
    ],
    sources: T(82),
  },
  {
    code: "A2_16",
    name: "Charge Derating due to BMS MOSFET Temperature",
    description: "This alarm is triggered when the MOSFETs in the BMS get hotter than the BMS Temperature Derate setting. If it is charging, battery charging is derated. If it is discharging the battery while on-grid, the power drawn from the battery decreases and shifts more to the grid. If this alarm occurs while discharging the battery off-grid, the inverter cannot reduce battery power without shutting off load power. It continues to operate until either the over-temperature alarm triggers, or the BMS protects itself, whichever temperature setting is lower. Either of these conditions shuts off load power.",
    solutions: [
      "Check the setting for BMS Temperature Derate. It should be about 74 C.",
      "Check the setting for BMS Temperature Cutoff. It should be 79 C.",
      "Check BMS MOSFET temperatures on the app to make sure the alarm is real. If the temperatures are normal and the alarm is still active, power-cycle the inverter.",
      "If the BMS MOSFET temperature was above the derating setting (74 C), either the battery current was high, or the ambient temperature of the battery was high, or both.",
      "If the BMS shuts off the breaker and you have this alarm, the BMS may have a damaged MOSFET.",
      "Make sure the battery is not installed in direct sunlight. If the ambient temperature around the battery is high, try decreasing battery current or add another battery to share the current. Consider re-installing the battery in a cooler location.",
    ],
    sources: T(83),
  },
  {
    code: "A2_17",
    name: "Charge Stop due to BMS MOSFET Temperature",
    description: "This alarm is triggered when the MOSFETs in the BMS get hotter than the \"BMS Temperature Cutoff\" setting. If it was charging, battery charging stops. If it was discharging while off-grid, loads turn off. For Sanctuary 2, once the MOSFETs reach 80 C, the BMS on the battery disables the battery current until it cools off.",
    solutions: [
      "Check the setting for BMS Temperature Derate. It should be about 74 C.",
      "Check the setting for BMS Temperature Cutoff. It should be 79 C.",
      "Check BMS MOSFET temperatures on the app to make sure the alarm is real. If the temperatures are normal and the alarm is still active, power-cycle the inverter.",
      "Make sure the battery is not installed in direct sunlight. If the ambient temperature around the battery is high, try decreasing battery current or add another battery to share the current. Consider re-installing the battery in a cooler location.",
      "If the BMS turns off the breaker and you have this alarm, the BMS may have a damaged MOSFET.",
    ],
    sources: T(83, 84),
  },
  {
    code: "A2_18",
    name: "Main Load Relay Status",
    description: "For Sanctuary 2 (which is equipped with load relays), this alarm may trigger when the load relay should be closed, but reads open.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(84),
  },
  {
    code: "A2_19",
    name: "Load Port Wiring Incorrect",
    description: "This alarm is for parallel inverter systems. It is also called \"EPS protect wiring error\". Before turning on load power, the inverter checks to see if the load voltage from the parent inverter can be read at the child inverters in the correct phase. If not, this alarm is triggered.",
    solutions: [
      "Check if each inverter's load breaker is turned on in the load combiner panel.",
      "This alarm requires a power-cycle to clear.",
    ],
    sources: T(84, 85),
  },
  {
    code: "A2_20",
    name: "System Grid Port Wiring Incorrect",
    description: "This alarm is for parallel inverter systems. Before connecting to the grid, all parallel inverters must read the correct phase on L1 and L2. If not, it triggers this alarm.",
    solutions: [
      "Check the phasing on the grid ports.",
    ],
    sources: T(85),
  },
  {
    code: "A2_21",
    name: "PV Over-Voltage",
    description: "If any MPPT input exceeds 500 V, this alarm should trigger.",
    solutions: [
      "Multiply the solar panel Voc by the number of panels in the string. It must be less than 500 V. Take the current temperature in C and subtract 25 C. Multiply by the panel's temperature coefficient (usually about -0.28% per C). This gives you the percent increase or decrease in rated Voc for that temperature. (The Voc increases below 25 C.) Voc must be below 500 V for the coldest expected temperature.",
    ],
    sources: T(85),
  },
  {
    code: "B1_1",
    name: "BMS - Cell Over Voltage",
    description: "The BMS has disabled charging due to the maximum cell voltage being at or above the maximum cell voltage limit. The BMS reports this alarm any time the max cell voltage hits 3650 mV. The alarm persists until the cell voltage is below 3500 mV and the battery re-enables charging. This alarm can be ignored.",
    solutions: [
      "If any battery alarm shows up only on a child inverter, it is not real. That sometimes happens after a firmware update, but depends on what firmware version it was updated to. Try power-cycling the inverters to clear the alarm.",
      "Use the web app to read the maximum cell voltage.",
    ],
    sources: T(85),
  },
  {
    code: "B1_2",
    name: "BMS - Cell Under Voltage",
    description: "The BMS has reported a cell below the minimum cell voltage limit. The BMS disables discharging while this alarm is active. The alarm clears after the minimum cell voltage exceeds the cell under-voltage recovery setting.",
    solutions: [
      "Use the web app to read the minimum cell voltage and the battery state. If the BMS has disabled both charging and discharging, the low cell needs to be charged manually by qualified personnel. If any cell voltage is below 1400 mV, the battery needs to be replaced.",
      "If everything looks ok, then try a power cycle.",
    ],
    sources: T(86),
  },
  {
    code: "B1_3",
    name: "BMS - Cell Over Temperature",
    description: "The battery temperature is above the maximum limit. The alarm clears after the temperature drops below the over-temperature recovery setting.",
    solutions: [
      "Use the web app to read the BMS cell temperatures. Compare with the actual battery temperature.",
      "If everything looks ok, then try a power cycle.",
    ],
    sources: T(86),
  },
  {
    code: "B1_4",
    name: "BMS - Cell Under Temperature",
    description: "The battery temperature is below the minimum limit. The alarm clears after the temperature rises above the under-temperature recovery setting.",
    solutions: [
      "Use the web app to read the BMS cell temperatures. Compare with the actual battery temperature. The battery needs to be above freezing to be charged.",
      "If everything looks ok, then try a power cycle.",
    ],
    sources: T(86),
  },
  {
    code: "B1_5",
    name: "BMS - System Error",
    description: "The Technical Service Manual lists this code with no description.",
    solutions: [],
    sources: T(86),
  },
  {
    code: "B1_7",
    name: "BMS - Over Current Discharge",
    description: "The BMS is reporting too high discharge current.",
    solutions: [
      "The BMS automatically disables discharging if the discharge current is too high.",
      "Make sure the batteries are within 0.5 V of each other before connecting in parallel. Use the web app to check the state of the other batteries to see if any other batteries have disabled discharge.",
    ],
    sources: T(86, 87),
  },
  {
    code: "B1_8",
    name: "BMS - Over Current Charge",
    description: "The BMS is reporting too high charge current.",
    solutions: [
      "The BMS automatically disables charging if the charge current is too high. Make sure the batteries are within 0.5 V of each other before connecting in parallel. Use the web app to check the state of the other batteries to see if any other batteries have disabled charge.",
      "Make sure the battery charge parameters are set correctly: charging voltage, derating charging voltage, battery max charge current, battery cell voltage maximum, battery cell de-rating voltage.",
    ],
    sources: T(87),
  },
  {
    code: "B1_9",
    name: "BMS - Short Circuit",
    description: "This happens when the battery is first connected to the inverter when the inverter's battery port is less than 20 V.",
    solutions: [
      "Disconnect the positive power cable from the battery for ten seconds. Then reconnect. You may have to repeat this twice or more if there are multiple inverters.",
    ],
    sources: T(87),
  },
  {
    code: "B1_10",
    name: "BMS - Cell Open Circuit",
    description: "This can happen if a cell voltage measurement wire gets disconnected. This alarm may also trigger if the battery was dropped or damaged in shipping.",
    solutions: [
      "Check the voltage tap wires and make sure there are no loose connections.",
      "If all cells measure near 3.3 V, but the entire pack reads around 49 V, it does not add up. Check cell busbars for broken welds.",
    ],
    sources: T(87, 88),
  },
  {
    code: "B1_11",
    name: "BMS - Internal Communication Fault",
    description: "The BMS has reported an internal problem.",
    solutions: [
      "Contact Lion Energy.",
    ],
    sources: T(88),
  },
  {
    code: "B1_12",
    name: "BMS - Temperature Open Circuit",
    description: "When this alarm is active, the BMS reads its most negative temperature, usually -50 C.",
    solutions: [
      "Check the connections on the temperature sensors. If the temperature sensor reads roughly 5k to 20k ohms (depending on temperature), it is good. This alarm can happen due to water damage in the battery.",
    ],
    sources: T(88),
  },
  {
    code: "B1_13",
    name: "BMS - Pack Over Voltage",
    description: "The entire pack is over the over-voltage setting. This alarm clears after the pack voltage decreases to the over-voltage recovery setting.",
    solutions: [
      "Adjust the maximum charge voltage setting in the inverter.",
      "Check the pack over-voltage setting in the BMS.",
    ],
    sources: T(88),
  },
  {
    code: "B1_14",
    name: "BMS - Pack Under Voltage",
    description: "The entire pack is under the under-voltage setting. This alarm clears after the pack voltage increases to the under-voltage recovery setting.",
    solutions: [
      "Charge the battery.",
      "Check the pack under-voltage setting in the BMS.",
    ],
    sources: T(88),
  },
  {
    code: "B1_15",
    name: "BMS - Cell temperature differential charging",
    description: "One battery module temperature sensor is more than 15 degrees different than the other while charging the battery. Charging is disabled until the temperature differential between the two modules decreases to the recovery temperature differential setting.",
    solutions: [],
    sources: T(88, 89),
  },
  {
    code: "B1_16",
    name: "BMS - Cell temperature differential discharging",
    description: "One battery module temperature sensor is more than 15 degrees different than the other while discharging the battery. Discharging is disabled until the temperature differential between the two modules decreases to the recovery temperature differential setting.",
    solutions: [],
    sources: T(89),
  },
  {
    code: "B1_17",
    name: "BMS - Cell Unbalance",
    description: "The Technical Service Manual lists this code with no description.",
    solutions: [],
    sources: T(89),
  },
  {
    code: "B1_18",
    name: "BMS - Circuit Fault",
    description: "The Technical Service Manual lists this code with no description.",
    solutions: [],
    sources: T(89),
  },
  {
    code: "B1_19",
    name: "BMS - Contactor Failure",
    description: "This is a reserved alarm (place-holder).",
    solutions: [],
    sources: T(89),
  },
  {
    code: "B1_20",
    name: "Warning Cell Voltage High",
    description: "The BMS reports high cell voltage. The alarm is triggered at 3.65 V and clears at 3.5 V.",
    solutions: [],
    sources: T(89),
  },
  {
    code: "B1_21",
    name: "Warning Cell Voltage Low",
    description: "The BMS reports low cell voltage. It usually triggers at 2400 mV and recovers at 2750 mV.",
    solutions: [],
    sources: T(90),
  },
  {
    code: "B1_22",
    name: "Warning Cell Temperature High",
    description: "The BMS reports high cell temperature.",
    solutions: [],
    sources: T(90),
  },
  {
    code: "B1_23",
    name: "Warning Cell Temperature Low",
    description: "The BMS reports low cell temperature.",
    solutions: [],
    sources: T(90),
  },
  {
    code: "B1_24",
    name: "Warning Discharge Current High",
    description: "The BMS reports discharge current too high.",
    solutions: [],
    sources: T(90),
  },
  {
    code: "B1_25",
    name: "Warning Discharge Current Low",
    description: "The BMS reports charging current too high.",
    solutions: [],
    sources: T(90),
    todo: ["The manual names this code \"Warning Discharge Current Low\" but describes it as charging current too high. Confirm the name."],
  },
  {
    code: "B4_24",
    name: "Charging Over-Temperature",
    description: "Sanctuary 2 only. Cell over-temperature detected while charging.",
    solutions: [],
    sources: T(90),
  },
  {
    code: "B4_25",
    name: "Charging Under-Temperature",
    description: "Sanctuary 2 only. Cell under-temperature detected while charging.",
    solutions: [],
    sources: T(90),
  },
  {
    code: "B4_26",
    name: "Discharging Over-Temperature",
    description: "Sanctuary 2 only. Cell over-temperature detected while discharging.",
    solutions: [],
    sources: T(90),
  },
  {
    code: "B4_27",
    name: "Discharging Under-Temperature",
    description: "Sanctuary 2 only. Cell under-temperature detected while discharging.",
    solutions: [],
    sources: T(91),
  },
  {
    code: "E1_1",
    name: "Inverter Communication Fault",
    description: "The EMS-C (or WCM) cannot communicate with one or more inverters.",
    solutions: [
      "Make sure all inverters are turned on and have the front panel LED on or flashing.",
      "Check all communication cables for proper connections. This varies from model to model. See the appropriate installation manual for details.",
      "Check for physical damage to the inverter, cables, and communicator.",
      "Power-cycle the communicator.",
      "Contact ESS Support for help with the following: read the alarm history for each inverter (the one that does not respond is the one that is not communicating); connect to one inverter at a time and check whether the parallel settings are properly configured for single or parallel inverter operation; check the modbus ID for each inverter (the address the inverter talks on).",
      "There is a possibility that the communication baud rate of either the EMS-C or the inverter was changed. The default is 9600 bps. The communicator may adjust the baud rate to 115200 during firmware updates. It might not have been set back to 9600.",
      "Re-flash the inverter firmware via USB if possible. If not possible via USB, try reflashing the ARM firmware directly to the board using the STM32Cube programmer. The file needs to be of the type *.axf_cat_to.bin.",
    ],
    sources: T(91, 92),
  },
  {
    code: "E3_2",
    name: "Backup Battery Low Voltage",
    description: "The backup battery in the EMS-C is low.",
    solutions: [
      "A low battery condition may occur if the EMS-C runs on battery power without a connection to 12 V DC. Make sure the EMS-C is connected to 12 V DC. The EMS-C will run as long as it is connected to 12 V DC even with this alarm.",
    ],
    sources: T(92),
  },
  {
    code: "E3_3",
    name: "Device Main Power Lost (12v)",
    description: "The EMS-C lost 12 V power and is running on battery power.",
    solutions: [
      "If the E3_3 alarm coincides with an E1_1 inverter communication fault, then the inverter probably shut off and the EMS-C is indeed running on battery power.",
      "This alarm is often caused by a bug in the old EMS-C firmware.",
      "Make sure the EMS-C has 12 V power.",
      "Make sure the EMS-C is communicating on WiFi or Ethernet. Try not to update over cellular as that will take hours.",
      "Do not push a firmware update when it is running on battery power. If doing remote debugging, the EMS-C can be rebooted to see if that clears the E3_3 alarm.",
      "After 12 V power is confirmed, update the EMS-C firmware if it is not already on the latest version.",
    ],
    sources: T(92, 93),
  },
  {
    code: "F1_0",
    name: "DC BUS Soft Start Failure",
    description: "The inverter failed a power-on test.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(93),
  },
  {
    code: "F1_1",
    name: "Inverter Soft Start Failure",
    description: "The inverter failed a power-on test.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(93),
  },
  {
    code: "F1_2",
    name: "DC BUS Short Circuit",
    description: "The inverter has detected an internal problem.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(93),
  },
  {
    code: "F1_3",
    name: "Inverter Short Circuit",
    description: "This can be caused by wiring or configuration errors resulting in over-current. It can also be triggered by excessive load current when off-grid.",
    solutions: [
      "Double check the installation manual instructions regarding line 1 and line 2 wiring and verify it is correct before powering the inverter back on.",
      "Make sure parallel inverters are configured properly (wiring, settings, commissioning) before powering on with combined load outputs.",
      "If this alarm is triggered when the grid goes down and then the inverter starts up five minutes later, check the grid relay delay timing.",
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(93, 94),
  },
  {
    code: "F1_4",
    name: "Fan Lock Error",
    description: "One or more fans has stopped turning while commanded on.",
    solutions: [
      "Check for worn out or damaged fans.",
    ],
    sources: T(94),
  },
  {
    code: "F1_5",
    name: "Low PV Insulation Impedance",
    description: "During the PV insulation check, the inverter measured too low impedance.",
    solutions: [
      "Check solar panels and wiring for any leakage to ground.",
    ],
    sources: T(94),
  },
  {
    code: "F1_6",
    name: "DC BUS Relay Fault",
    description: "If there is AC present (generator or grid), the inverter runs a self-check and measures the DC bus voltage. If it is less than about 120% of the applied AC Vrms, it assumes a problem with the DC relay.",
    solutions: [
      "An inverter overcurrent (A1_15) may draw down the DC bus voltage and trigger this fault. If both occur together, correct the cause of the overcurrent and power-cycle the inverters.",
      "In parallel systems, if you disconnect the load port from one or more inverters while off grid, it may overcurrent upon reconnecting.",
    ],
    sources: T(94),
  },
  {
    code: "F1_7",
    name: "Grid Relay Fault",
    description: "One of the grid relays is either stuck closed or not making good contact.",
    solutions: [
      "Turn off the grid breaker that feeds the inverter. Measure the grid port voltage L1 to N and L2 to N. It should be zero while load port voltage is live. If the grid port has 120 V on either line to N while disconnected from the grid, the grid relay is stuck closed.",
      "If either of the load lines is 0 V while connected to the grid (inverter status must be \"On Grid\"), the grid relay has a bad contact or is open.",
    ],
    sources: T(95),
  },
  {
    code: "F1_8",
    name: "EPS/Back-up Relay Fault",
    description: "One of the EPS relays is either stuck closed or not making good contact.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(95),
  },
  {
    code: "F1_9",
    name: "GFCI Fault",
    description: "Excessive ground current is detected.",
    solutions: [
      "See also the troubleshooting for alarm A1_10.",
    ],
    sources: T(95),
  },
  {
    code: "F1_10",
    name: "CT Fault",
    description: "The manual lists this code with no description.",
    solutions: [
      "On certain firmware versions, this has occurred when updating the firmware. Power cycle to clear.",
      "This fault seems to be unrelated to external grid CTs, since they can be disconnected or installed incorrectly and the inverter will still run, although not correctly.",
    ],
    sources: T(95),
  },
  {
    code: "F1_11",
    name: "PV Short Circuit",
    description: "The Technical Service Manual lists this code with no description.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(95),
  },
  {
    code: "F1_12",
    name: "Bypass Relay Fault",
    description: "One of the bypass relays is either stuck closed or not making good contact.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(96),
  },
  {
    code: "F1_13",
    name: "System Fault",
    description: "If any of the following occur 15 times, it triggers system fault (F1_13): bus relay soft fail (F1_0), grid relay fail (F1_7), current sensor fail (F1_10). If off-grid inverter short (F1_3) accumulates three times, it also triggers system fault (F1_13), which needs a power-cycle to clear it.",
    solutions: [
      "Power-cycle the inverter. Determine the cause of the repeated faults that trigger this unrecoverable fault (unrecoverable without a power-cycle).",
    ],
    sources: T(96),
  },
  {
    code: "F1_14",
    name: "DC Over-Current",
    description: "The Technical Service Manual lists this code with no description.",
    solutions: [
      "Observe what the battery and solar were doing before it cut. If everything looks fine, then power cycle.",
    ],
    sources: T(96),
  },
  {
    code: "F1_15",
    name: "DC Over-Voltage",
    description: "The Technical Service Manual lists this code with no description.",
    solutions: [
      "Observe what the battery and solar were doing before it cut. If everything looks fine, then power cycle.",
    ],
    sources: T(96),
  },
  {
    code: "F1_21",
    name: "MCU Self Test Failed",
    description: "The Technical Service Manual lists this code with no description.",
    solutions: [
      "Power-cycle the inverter to clear the alarm. If the alarm persists, contact ESS support.",
    ],
    sources: T(96),
  },
]

/** Printed under the table (Technical Service Manual p.67). */
export const FAULT_FOOTNOTE =
  'In general, an alarm means the system has limited capability, and a fault means the system has shut down to protect itself. If an alarm or fault does not clear after the cause has been fixed, power-cycle the inverter(s). For persistent alarms, contact the Lion Energy ESS Support team.'

export const faultByCode = (code: string): FaultCode | undefined => FAULT_CODES.find((f) => f.code === code)
