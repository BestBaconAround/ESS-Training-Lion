# ESS-Training-Lion

Training platform for new Lion Energy tech support specialists on the **Sanctuary 2 Energy Storage System** (12kW hybrid inverter, 14.3kWh LFP batteries, up to 3 batteries per inverter). Currently a single-user tool (the author). The learner learns by doing, by example, and by repetition.

## Source of truth

- **Primary source (v1):** *Sanctuary Installation Guide & Manual, Gen2 12K* (updated 12/20/24), https://support.lionenergy.com/files/manuals/Sanctuary%20Installation%20Guide%20and%20Manual%20Gen2%2012K.pdf
- **Other source documents in the repo (committed by the author):**
  - `LION- SAN2_2 - Sanctuary Installation Guide- 042525.pdf` (Updated 4/25/25 (2), 40 pp, 13.5kWh variant, includes a fault-code table on pp.32-35)
  - `LION- SAN2_3- Sanctuary Installation Guide-042525.pdf` (Updated 4/25/25 (3), 44 pp, 13.5kWh variant)
  - `Lion_Energy_EMS-C_Manual_7-compressed.pdf` (EMS-C manual, Updated 4/13/25, 16 pp, for Sanctuary 2 and Sanctuary 3)
  - `Lion- Sanctuary Technical Service Manual.pdf` (Updated 9/30/2026, 101 pp, Sanctuary 2 and 3; source tag `tsm`). The newest document: alarm/fault/status table (pp.67-96, 88 codes), power button tests, relay and IGBT checks, firmware recovery, solar and generator troubleshooting. **Where it disagrees with the 4/25/25 guides, it wins** (newer), but record the conflict as a `todo`. **Author decision (10/2/2026): the Technical Service Manual is written by the engineer and overrules the author's own field knowledge too.**
  - `Lion Sanctuary 2 & 3 Settings Guide` (rev1.1 6/4/2026, 53 pp, tag `settings`). **Not committed** (do not commit it). Only user (U) and installer (I) level settings are used in content. **Lion-internal (LE) settings, the "Settings Requiring Lion Energy Support" section and register/bit names are held back** (public repo).
  - Source tags in content: `manual` (12/20/24 (4), the 14.3kWh manual), `san2_2`, `san2_3`, `emsc`, `tsm`, `settings`, `video`, `author`, `notes`.
- Page numbers cited in content (`sourcePages`) are **PDF page numbers**, which equal the printed page numbers (cover = 1) in all four PDFs.
- Later: Confluence-sourced content may be added as additional modules/lessons. Technical content must come from lionenergy.com or the author's Confluence, never from general knowledge.
- **Never invent specs, fault codes, or procedures.** If something is not in the source, leave a `TODO(source): ...` in the content file and, if it affects the learner, ask the author.
- **Ignore the manual's internal page cross-references** (e.g. "see page 41", "pages 40-41", "page 18"); several are wrong.

## Hardware variants and manual differences (verified by reading the PDFs)

The platform teaches **several hardware variants** (Sanctuary 2 Revs 1-4). The Gen 2s are very similar but a few things differ and **must be taught** (author). Author: in `SAN2_3` "the 3 means revision", i.e. **Sanctuary 2 Rev 3**; `SAN2_2` is Rev 2, and "SAN2 is the same for SAN1" (Rev 1 uses the Rev 2 manual). The 12/20/24 manual is numbered (4) and matches Rev 4 (two power buttons, EMS-C). TODO(author): confirm that mapping.

| Revision | Manual (`source` tag) | Comms module |
|---|---|---|
| Rev 1 | `san2_2` (author: same as Rev 2) | WCM (EMS-C retrofit possible) |
| Rev 2 | `san2_2` | WCM |
| Rev 3 | `san2_3` | WCM |
| Rev 4 | `manual` | EMS-C standard (some Rev 4 shipped with WCM) |

Verified by reading the PDFs: `san2_2` and `san2_3` have **identical specs** (p.36 vs p.39). `san2_3` has a Battery Voltage Check page (p.17) and a "Meter Port" on the inverter overview (p.9) that `san2_2` does not; `san2_2` has the fault table that `san2_3` does not. Facts below are what each document literally says.

| Item | Rev 4: `manual` (12/20/24 (4)) | Revs 2-3: `san2_3` (4/25/25 (3)) and `san2_2` (4/25/25 (2)); same specs |
|---|---|---|
| Battery | 14.3kWh, 40-58.4 VDC, 290 lb | 13.5kWh model (13,875.2Wh), 40-55.6 VDC, 277 lb (p.39) |
| Battery charge / discharge temp | 32-131 F / -4 to 131 F; derate below 50 F and above 104 F | 32-86 F / -4 to 86 F (p.39) |
| Install temperature | 32-131 F (p.15) | 32-86 F (p.39 caution) |
| PV per MPPT | 14A x4, Isc 22A | 12A x4, Isc 15A (p.39) |
| Grid passthrough | 100A | 90A (p.39) |
| Controls / indicators | PV Disconnect, AC/DC, Complete System Shutdown, LED states (p.10) | Inverter overview labels a "High Voltage DC Switch" and "Power" (p.9); no LED/controls text found |
| Comms module | EMS-C / WCM wording (p.40) | "WCM WiFi Control Module" (p.9) |
| Fault-code table | none | `san2_2` only, pp.32-35: A1_0-A1_15 and A2_8-A2_15 (24 codes). **Author: all fault/alarm codes apply to all Sanctuaries** |
| Battery voltage check, "battery priority mode" / "emergency mode" text | p.20 | same text, `san2_3` p.17 |

**Specs in the project brief (14.3kWh, 14A/22A MPPT, 100A passthrough) are Rev 4 specs.** Module 2 controls content (PV Disconnect / AC-DC / Complete System Shutdown / LED) comes from `manual` and the author, and applies to Rev 4 (the author confirmed Rev 4 has two power buttons). TODO(author): Rev 1-3 controls and LED behavior (the Rev 2/3 manuals have no controls/LED text).

**Content rule:** every revision-specific fact carries a `revisions` tag (e.g. `['rev4']`, `['rev2','rev3']`, or `'all'`) and a source tag; never mix revision facts. Lessons have a "Revision differences" panel; quizzes and sims take a revision where behavior differs.

### Module 4 source notes (verified by reading the PDFs)

- **PV limits differ by revision.** Rev 4 (`manual` pp.26, 44): usable 120-500V, max Isc 22A, 14A input per MPPT. Rev 3 (`san2_3` p.22, p.39): min 120V DC, max 500 VOC, max PV Isc 15A DC per MPPT (p.22); spec table 12A x4 input, 15A Isc. Revs 1-2 (`san2_2` p.16, p.36): **min 150 VDC**, max 500 VOC, max PV Isc **13A** per MPPT (p.16), but its own spec table (p.36) says MPPT range 120-500V and Isc 15A. TODO(author): which is right for Revs 1-2?
- **Dual MPPT mode, PV Optimizer setting, "PV(-) grounded = catastrophic", and the 4-step PV-to-ground leakage test appear only in the Rev 4 manual** (`manual` pp.26-27). Revs 2-3 only say the PV wiring must have no path to ground (`san2_3` p.23: "Only the PV racking is grounded"; `san2_2` p.17: "be sure there is no negative grounding"). TODO(author): does the same leakage test apply to Revs 1-3?
- **Multi-inverter battery cable order differs.** Rev 2 (`san2_2` p.14): busbars connected to each other, a 225A T-fuse on the positive cable between busbars is recommended (not provided), negatives then positives last at the batteries. Rev 3 (`san2_3` p.20): negative then positive cable eyelet ends go on the busbars first, then plug negatives, then positives, into the batteries. Rev 4 (`manual` p.24): negatives then positives last. Inverter-to-inverter communication also differs (`san2_2` p.29 splitter + 10 ft cat5; `san2_3` p.36 splitter + 10 in flat cable to the meter port; Rev 4 single EMS-C, `emsc` p.13).
- **Battery BMS wiring differs.** Rev 4: standard Ethernet (T568A/B) daisy chain from the parent inverter to battery 1, then battery to battery (`manual` p.21). Revs 2-3: a BMS communication cable **splitter** goes to the inverter's BMS Coms RJ45 port, and each battery's BMS cable goes to each battery's 4-pin aviation connector (`san2_2` p.12, `san2_3` p.18).
- **The "45-55.6 VDC" typo (Correction 1) also appears in the Rev 2 and Rev 3 guides** (`san2_2` p.12, `san2_3` p.18). Assumed the 51-55.6 correction applies to all revisions. TODO(author): confirm.
- **The PV wire-size table the manual refers to ("the table below") is not in any of the PDFs** (checked the page image). Only "accepts up to 10 AWG" is sourced.
- **Surge protection** is mentioned in `manual` p.27 and `san2_2` p.17 (use a PV junction box with surge protection), not in `san2_3`.

### EMS-C manual facts (`emsc`, source tag for content)

- Written for Sanctuary 2 and Sanctuary 3. The EMS-C comes standard on **Sanctuary 2 rev4** and Sanctuary 3; **revs 1-3 shipped with a WCM** and can be retrofitted (p.13). Commissioning on revs 1-3 **must be done using a WCM** (p.12).
- **ESS Support: (435) 244-3352, Monday-Friday 8:00 AM-5:00 PM Mountain Time** (p.16). Troubleshooting resources: info.lionenergy.com, lionenergy.com/pages/installers. The app is the **Lion Technician app**; end users use the Lion Smart app or smart.lionenergy.com (pp.5, 15).
- EMS-C LED indicators (p.6): no lights = not commissioned; 1s blink yellow = connecting; solid yellow = EMS-C or inverter updating; solid blue = connected; 100ms blink blue = uploading/downloading data; solid red = disconnected (or EMS has faulted).
- Wiring by revision: **Rev 4:** EMS-C connects to the inverter's **WiFi port**; battery BMS cables go directly to the parent inverter's BMS port; the EMS-C battery port is **only used during commissioning to set each battery's address**, after which the BMS cables move to the inverter's BMS port (p.8). **Rev 3:** EMS-C inverter port connects to the inverter's **meter port (front right)** with a specially wired Ethernet cable (p.9). **Revs 1 & 2:** EMS-C inverter port connects to the **RJ-45 dongle near the battery terminals** (p.10). Sanctuary 3: via the inverter's Parallel A port (p.7).
- On all Sanctuary 2 models the EMS-C is powered by the 12V RSS supply. When the **AC Power button or the remote shutdown switch turns off AC power on the inverter, the RSS 12V supply also turns off, removing power from the EMS-C** (p.8).
- Commissioning (p.16): only for new installs or when changing the number of inverters or batteries. **"Re-commissioning is not a troubleshooting tool."** It sets inverter settings to default, sets parallel settings and inverter addresses, addresses batteries (Sanctuary 2 only), and registers the communicator. Replacing a WCM/EMS-C does not require recommissioning.

## Corrections (these override the manual)

1. Battery acceptable voltage before wiring is **51-55.6 VDC** (manual p.21 incorrectly says 45-55.6).
2. PV-to-ground leakage test, step 3 checks continuity **PV(+) to GND** (manual p.27 says PV(-), a typo).
3. Battery check step 6 (manual p.20) says "emergency mode"; the procedure actually uses **battery priority mode**. Teach battery priority mode. They are the same setting: homeowners cannot access "battery priority" and see it named **"emergency mode"** instead. Teach both names.
4. **Commissioning follows the video, not manual p.42 step 3.** The system arrives uncommissioned; after wall install the technician follows the video. The video requires **both power buttons on** during commissioning (manual p.42 step 3 says leave AC/DC off). The video is current (author confirmed: the video overrules). TODO(author): confirm how this affects manual p.42 steps 7-8 (PV insulation check, then AC/DC on) for the Module 7 power-up sim.

Keep this list current. Any new correction from the author goes here first, then into content.

## Author field knowledge (not in the manual)

Knowledge supplied by the author from field experience. It is authoritative for teaching, but tag it in content as `source: 'author'` (not a manual page) so it stays distinguishable from the manual.

- **Battery that will not address / reads 0 V (author decision 10/2/2026: teach the Technical Service Manual, the same whether or not the system is commissioned).** The old author wording ("BMS sleeps below 51 VDC", "battery awaken not available before commissioning", 52 V/5 A and stop at 51.5 V) is **superseded**. Taught now: the Sanctuary 2 BMS turns the battery breaker off and goes to minimum power mode when discharged below 0% with a cell under 2300 mV; 0 V at the terminals usually means the breaker is off; turn it on (red = on); charge at 20 A, wake it alone, `activate battery` or the 60V/5A supply at **54 V/5 A** at the inverter battery terminals (`tsm` p.24); under 40 V charge manually at 5 A, above 50 V try another BMS cable (`tsm` p.80). The 60V variable supply is also used to charge individual cells (max 3.65 V open circuit).
  - **If it still won't address after charging:** swap the BMS cable for another Cat5/6 cable and retry. If that fails, restart the commissioning process and power-cycle the system (see Power cycle).
- **Check battery voltage before wall-mounting it,** in case the battery is faulty.
- **Technician app:** what technicians use to commission and troubleshoot the system. Further troubleshooting may require a laptop. Note the manual (p.40, p.20) calls the app the "Lion Energy App"; the video transcript never names it.
- **"Parallel":** two things are hooked up in parallel: (1) the **parallel communication wire between inverters** (manual p.39, Parallel A/B ports) and (2) the **battery cables**. Both are hooked up during commissioning *when the Technician app directs it*. For the battery cables, the manual's picture shows all batteries plugging into a busbar, and the busbar going to the inverter (manual p.21-25). The manual p.20 sequence (negatives first, lowest-voltage positive first) remains the battery-cable procedure.
- **Battery cables and shutdown:** the battery cables are bolted into the inverter and plugged into the battery. By design they can stay plugged in and still allow the inverter to shut down.
- **Inverter face light does not come on** with batteries hooked up to the inverter: it could mean internal damage to the inverter. If fan noise and relay clicks are heard, the LED itself may be bad. (This is diagnosis context for manual p.10 "light does not come on and the button is pushed in".) TODO(author): what the specialist does next / escalation path.
- **0.5V rule:** within 0.5V of each other is the *recommendation*, and the manual warns of high current between batteries. In practice it is not a big deal if they differ more: the battery cables are designed to be disconnected without touching the breaker, and most installers do not check battery voltage and there have been no issues. Teach the recommendation, then the field reality. The author chose not to define a "large spread" threshold: sims flag a spread above 0.5V as "outside the recommendation" and do not invent a fail threshold.
- **LED color:** the LED appears orange or red depending on the LED type and the viewer. Teach "orange or red = fault / failed PV insulation test".
- **Support phone:** (435) 244-3352 is correct (manual p.21). The number on p.46 (385.375.8191) is the general company line.
- **Gen 2 inverter revisions:** there are 4 revisions, all of the Gen 2 black system. Revisions differ (e.g. Ethernet port location and power buttons); **lessons must call out the differences.** The commissioning video is Rev 4.
  - **Rev 4:** two power buttons (top = AC/DC, bottom = Complete System Shutdown) with a rotary PV switch above them. **All three controls are on the left side of the inverter** (author; visible in `public/images/training-wall.png`). The lights are on the face (front) of the inverter. Lights (manual p.10: solid green = no alarms, blinking green = alarm, red = fault, no light = off): **a normal light and a fault light in a small window on the front, below the Lion logo** (author; same as Revs 1-3). The red button is labeled "AC/DC ON/OFF" (upper) and the green button "Complete System Shutdown" (lower); the rotary switch is labeled "PV Disconnect" (OFF/ON). Two antennas are mounted below the buttons.
  - **Rev 1-3 (author):** **two LEDs on the face of the inverter**: a **normal** light (solid green = no alarms; flashing green = alert) and a **fault** light (red = fault). **The power button controls on/off.** The **DC switch is the PV disconnect** ("DC for DC voltage"). **Behavior with the power button off (author): same as Rev 4's Complete System Shutdown** (works as normal if an external source is on; fully off otherwise). **LEDs behave the same as Rev 4** (read as: both lights off = system off). **A Revs 1-3 inverter looks like Rev 4 but has no second button and no second antenna; the controls are in the same place (left side)** (author). Rev 4 has two antennas (cellular and Bluetooth/Wi-Fi, per the video); Revs 1-3 have one. The Rev 2/3 lights are on the face of the inverter (author). Photos in `public/images/`: left side (buttons and PV switch), front (Lion logo panel), wire box cover diagram.
- **Complete System Shutdown (author decision 10/2/2026: the manual is right, the old author wording is superseded).** Rev 4 Complete System Shutdown off **turns off all components of the inverter whatever outside power is connected** (manual p.10; `tsm` p.35: the control board and battery power run through that button, so the LED is off and you cannot communicate with the inverter; if a switch behind it fails, the same happens). The old statement that the system "works as normal" with an external source on is wrong. External sources the inverter can draw on (author): grid, solar (PV, while the PV Disconnect is on), AC solar, generator, wind (very, very rare). **Revs 1-3 power button off** is NOT assumed to match Complete System Shutdown: `tsm` p.13 calls a flashing green light standby with the button off, and `settings` p.32 says Rev 1's controller stayed on with the power button off; the sim treats it as standby (loads off, controller on, light flashing, comms unknown).
- **One communication module per system (author):** only one module (WCM or EMS-C) is used, and it stays in the parent inverter (`emsc` p.13 agrees for the EMS-C).
- **WCM vs EMS-C:** the WCM (wireless communication module) ships on Revs 1-3 and some Rev 4. The EMS-C replaced it and does the same job, plus a built-in cellular data plan (50 MB, very bare-bones data). On cellular the homeowner sees only a blue Wi-Fi icon and no system information. An EMS-C manual exists (149 MB, not yet shared). Manual p.40 describes WCM wiring only.
- **Rev 4, AC/DC off (author: "off"):** the status panel shows controller/comms **offline** when AC/DC is off on an EMS-C system. This matches `emsc` p.8 (AC power off removes 12V from the EMS-C) and **contradicts manual p.10 and the project brief**, which say the controller stays on and can communicate with AC/DC off. The two processors (DSP, ARM) still stay on. **Settings and firmware updates work as long as the EMS-C has power (author).** On Rev 4 the EMS-C is powered from the 12V RSS supply, which turns off with AC/DC, so with AC/DC off the panel shows settings/firmware unavailable (derived from the author's answer plus `emsc` p.8; the EMS-C's integrated backup battery is only mentioned for parallel inverters being power-cycled during commissioning, `emsc` p.5). TODO(author): do WCM revs (1-3) keep comms with the power button off?
- **Restart commissioning (author: yes):** the dead-battery ladder's "restart the commissioning process" applies only to a system that never finished its first commissioning; re-commissioning a commissioned system is not a troubleshooting tool (`emsc` p.16).
- **Battery reserve:** 30% battery reserve percentage is typically recommended; it is customer preference.

## Author support notes (`source: 'notes'`) and what is deliberately left out

The author's own ESS support notes (OneNote) are used as reference material: first-call approach, precheck, connectivity steps, PV reverse and grounded-solar causes, grid over-voltage and sell-back settings, generator behavior, and CT checks. **The repo and the deployed site are public, so these rules apply to anything taken from the notes:**

- **Never include** personal contact details (phone numbers, emails), other people's names, screenshots of chats or of internal tools, or links that need a login (internal wiki pages).
- **Hex register addresses and register-read procedures are held back** (internal). Settings are described by name and value only (for example "grid allowable voltage, default 105%, raise to 107% for high grid voltage").
- **Gen 3 / Sanctuary 3 items are held back** until the platform has a tag for them (battery master-swap during commissioning, the Gen 3 battery checklist, the Gen 3 CT test).
- Items with an uncertain original order or meaning keep a visible `todo` (first-call order and the "they are certified or the homeowner" wording, the precheck grouping, which connector the CT pin numbers refer to).

## "Ask the notes" chatbot (Troubleshooting page)

A search-based assistant, not generative AI: a static site cannot hold an API key. It matches the question against the troubleshooting entries, the lessons, and markdown files in `src/content/reference/*.md` (each heading becomes a searchable section, sourced as `notes`), and answers only with passages that exist, each with its sources. If nothing matches well it says so instead of guessing. Code: `src/ask/` (tokenizer, TF-IDF search with a phrase and fault-code boost, corpus builder, chat panel). `src/ask/search.test.ts` covers questions it must answer and ones it must refuse. To give it more information, add a `.md` file under `src/content/reference/`. A generative chatbot would need a small server (or proxy) to keep the API key secret.

## Photos (`public/images/`, author's training setup, tagged Rev 4 unless noted)

`training-wall.png` (two inverters on batteries), `rev4-left-side-controls.webp` (PV Disconnect, AC/DC, Complete System Shutdown, antennas), `rev4-front-lights.webp` (Lion logo panel and the lights window), `rev4-wiring-compartment.webp`, `rev4-board-ports.webp` (port labels: FRONT Parallel A / BACK BMS COMM, FRONT Parallel B / BACK WIFI PORT, FRONT NOT USED / BACK CT1 & CT2), `rev4-wire-box-cover-diagram.webp` (the Rev 4 diagram inside the wire box cover, labeled "Sanctuary Installation Guide Rev 4"), `ems-c-in-inverter.png`, `wire-box-cables.webp`, `wcm.webp` (the small green board at the top left of the Rev 4 training unit's wiring compartment is the **WCM**; **author: this unit was upgraded to an EMS-C and the WCM is not used**; the USB-C port is at the top left of the control board). Captions state only what is visible or what the author said. The Rev 4 diagram labels the front-right port "Meter Port"; the board label says "NOT USED". **Author: the Meter Port is unused on Rev 4** (on Rev 3 it carries inverter communication, `emsc` p.9, `san2_3` p.36). Rev 2/3 guide pages used as images: `san2_2` pp.12-14, 16, 30; `san2_3` pp.18-20, 22, 37 (`public/images/rev2-*`, `rev3-*`).

## Power cycle (author-supplied procedure, `source: 'author'`)

Buttons latch: **pushed in = on, pushed out = off.** Procedure as given for a **Gen 3** inverter:
1. Turn off the grid breaker.
2. Turn off the Bat switch.
3. Turn off the PV turn switch.
4. Push out the AC/DC button.
5. Push out the Complete System Shutdown button.
6. Wait ten seconds, when the normal light on the face of the inverter turns off.
7. Repeat in reverse order.

It takes about two minutes for the inverter to fully power back on. Verify on the EMS-C that the status light changes to solid, indicating it is connected to the internet (may take a minute or two longer).

**Gen 2:** pretty much the same steps minus the Bat switch, and the technician has to locate the grid breaker. (Manual p.10: "Some alarms or faults may need intervention such as a power-cycle"; p.42 step 8: "turn off all three buttons".)

## Commissioning walkthrough (video transcript, `source: 'video'`)

Source: author-supplied transcript of a Lion Energy training video, "commissioning a Gen 2 Sanctuary with an EMS-C" (Rev 4, 1 inverter, 2 batteries). It is a **pre-commissioning** demo done in the app (the author calls it the Technician app). The transcript has no timestamps and the narrator sometimes refers to things on screen ("this one"), so anything ambiguous is a TODO, not a fact.

Flow, as stated:
1. Choose total number of inverters and batteries (demo: 1 inverter, 2 batteries, black). The app checks spacing, asks WCM vs EMS-C installed (demo: EMS-C), asks about split phase and "advanced" (demo: next).
2. Antennas: confirm they are installed and the cellular and Bluetooth/Wi-Fi antennas match their labels. Internal wires connect to the external antennas; if there are connectivity problems, check these first.
3. Both power buttons must be on, "not just one" (see Corrections #4).
4. Power on the EMS-C with its switch; a blue light appears under "power". App finds the EMS-C over Bluetooth, then connects it to Wi-Fi (enter the Wi-Fi password). Can take several tries. App then checks for and installs EMS-C updates (a couple of minutes).
5. EMS-C connects to the inverter's WiFi port (back middle). Typically comes with this cable.
6. Address the batteries so the EMS knows which is which: plug the Ethernet cable from the EMS-C battery port into battery 1 and address it; move the cable to battery 2 and address it. Then daisy chain: move the EMS-C cable to the BMS COM port (back left of the board), and run another Ethernet cable from battery 1 to battery 2. Checklist: addressing cable removed, battery 1 connected to BMS port, all batteries linked.
7. Power sources screen (depends on the customer): grid, AC solar, generator (demo: grid + AC solar, no generator). Breaker size (demo: 100A; ask the installer). Sell back to grid (demo: yes). SoC at which AC solar stops charging the battery (demo: 100%). Emergency mode (demo: no). CTs: read the rating on the CTs themselves (demo: 200A / 100mA). Battery reserve: 30% typically recommended, customer preference.
8. Confirm the product, enter customer info (address, full name) and the installer name. Because it is pre-commissioning, CTs are not installed yet; CT placement is checked manually when the installers arrive. Finish.

## Open items / known manual inconsistencies

Track unresolved questions here until the author answers; then move the answer into Corrections, field knowledge, or content.

- **"Light off with button pushed in"** (manual p.10): confirmed to mean power button(s) on (pushed in) and no light. Possible causes per the author: internal inverter damage, or a bad LED if fan and relay noise are heard. Specialist next step / escalation path still unknown (TODO).
- **Confirm Rev 4 = the 12/20/24 manual** (see Hardware variants).
- **WCM revs (1-3) comms/settings with the power button off.**
- **Fault-code table** is now `src/content/data/faults.ts` from the TSM (88 codes, applies to all Sanctuaries per the author). The sim only asks "first step" for codes whose first line is short.
- EMS-C manual (149 MB) not yet available; EMS-C content is limited to what the author stated.
- Cold-temperature Voc derating: method is in `tsm` pp.61-63 (see below). The datasheet temperature coefficient comes from the panel, never from us.
- PV wire "recommended cable size table" (p.27) is referenced but not present in any PDF (checked the page image).

## Stack

- Vite + React + TypeScript + Tailwind. Static site only: no backend, no API keys. Must deploy to GitHub Pages (hash routing, configurable `base`).
- Progress in `localStorage` (lesson completion, quiz scores, sim attempts and best scores, per module).
- Vitest for the pure logic (sim scenario generators and graders, progress store).

## Content structure

- Content lives in data files under `src/content/` and is separate from components. Adding a module or lesson must not require UI changes.
- `src/content/modules/<nn>-<slug>.ts` exports one `Module` (see `src/content/types.ts`).
- Every quiz question has an explanation and `sourcePages`.
- Simulators are **data + engine**: parameters, symptom text, and ranges live in content; scenario generation and grading are pure, seeded functions in `src/sims/`, unit-tested.
- Modules 1, 3, 5, 6, 7 are `status: 'coming-soon'` with a planned `outline`. Modules 2 and 4 are fully built in v1 (`status: 'ready'`).
- Layout: `src/content/` (types, labels, helpers, modules, `data/faults.ts`, `sims/` scenario data and thresholds), `src/sims/` (seeded RNG and engines: `panel/`, `bench/`), `src/sims-ui/` (simulator UIs and `registry.tsx`), `src/progress/` (versioned localStorage store, tested), `src/quiz/` (grading, shuffling), `src/pages/` and `src/components/` (UI).
- `src/content/content.test.ts` enforces the rules (explanations, sources, revision tags, unique ids) and runs as part of `npm run build`.
- Simulator numbers (thresholds, voltage ranges) live in `src/content/sims/benchParams.ts` with sources, never hard-coded in engines.
- **Troubleshooting page** (`/troubleshooting`): entries in `src/content/troubleshooting.ts` (guided entries plus one generated entry per fault code from `data/faults.ts`; `FAULT_AREA` assigns each code to Battery, Inverter or Power for navigation only). Every step needs a source and a revision tag; gaps are `todo` strings. Search and revision filtering are pure functions in `src/troubleshooting/filter.ts`. `src/content/troubleshooting.test.ts` enforces sources, unique ids, full fault-code coverage and valid lesson links.

## Conventions

- Lessons are short, concrete, and tied to what a customer would say on a support call.
- Sims randomize scenarios (seeded RNG) so they can be repeated without memorizing answers.
- Wrong sim actions show the consequence and explain why.
- Every fact in content carries a source page or a `TODO(source)`.
- Commit after each working piece. `npm run dev` must run cleanly and `npm run build` must succeed before calling a milestone done.
- Do not commit the manual PDF unless the author asks.

## Call notes and private History (Troubleshooting page)

- `AssistantPanel` has three tabs: Ask, Call notes, History. **Reference** is its own page (`/reference`, `src/pages/ReferencePage.tsx`, data in `src/content/reference.ts`): a searchable, sourced lookup (every row needs `sources` and `revisions`, enforced by `reference.test.ts`) plus the fault table, in collapsible sections. Panels stay mounted (hidden) so state survives tab switches.
- **Call notes** (`src/ask/notes.ts`): pure `analyzeNotes(text, index)` detects revisions, fault codes and battery voltages (35-60 V with a unit; ignores PV/solar/grid context), classifies readings with `benchParams.ts` thresholds (never invent new ones), matches topics (`NOTES_MIN_SCORE = 4`), and asks first-call questions from `ts-first-call`. Draft is in sessionStorage (`ess-training:call-notes`).
- **History** (`src/history/`): AES-GCM + PBKDF2 vault in localStorage key `ess-training:history-vault`. This is encryption at rest, **not a login**: no account, no recovery, per-browser, locks on leave/Lock now/15 min idle, capped at 500 entries. Ask questions auto-save while unlocked; call notes save only on "Save to private history". Do not describe it as a login or as secure against someone who knows the passphrase or can run code on the page.
- The repo is public: never commit real history, customer data, or passphrases.

## Technical Service Manual and Settings Guide: what they settled and what conflicts

Settled (now in content, tagged `tsm` / `settings`):
- **CT pins** (`tsm` p.9): RJ45 pins 3 and 6 = L1 CT (3 = N, 6 = P); pins 1 and 2 = L2 CT (1 = N, 2 = P) on Rev 4 and Sanctuary 3. CT plugged into the meter port reads only L2, backwards. **CT sizes** (`settings` p.31): 90A/90mA (1000:1) on Rev 1-2, 200A/100mA (2000:1) on Rev 3, Rev 4, Sanctuary 3.
- **Rev 4 AC/DC off** (`tsm` pp.13, 35, 39): the inverter controller stays on and the green LED **flashes** (standby), but the 12V for the EMS-C and RSD comes through the top button, so the EMS-C goes offline. Manual p.10 and the author/EMS-C manual are both right (controller vs communicator). The panel sim shows the normal light flashing green for Rev 4 AC/DC off.
- **Rev 4 buttons** (`tsm` p.35): AC/DC has two switches (AC power, 12V RSD); Complete System Shutdown has three (AC power, control board, battery power to the control board). The remote shutdown switch is in series with the AC/DC button; in parallel systems any one open turns all inverters off.
- **Cold-weather Voc** (`tsm` pp.61-63): method and worked example are now sourced (entry `ts-voc-calc`). The sim may use a panel's own datasheet coefficient; never invent one.
- **Version identification** (`tsm` pp.14-15): Rev 1 six black plastic RJ45 on the I/O board; Rev 2 six metallic RJ45; Rev 3 adds a black plastic RJ45 to the left plus a second row of push connectors; Rev 4 plug-in screw terminals and two power buttons. Sanctuary 3 is white with two power buttons.
- **Grid reconnect voltage** (`tsm` p.33): the "grid allowable voltage 105%" in the author's notes is the default maximum grid reconnect voltage (126 V).
- **Emergency mode** (`settings` pp.11-12, `tsm` p.13) = Limit Grid Consumption with Battery Priority enabled; solar cannot be stored or used from the battery. Battery Priority is meant for short-term use (not more than a week).
- **Fault table is now the TSM's 88 codes.** The 4/25/25 Installation Guide table (24 codes) is superseded.

Conflicts and open questions (each is a visible `todo` in content where it affects a learner):
- Older guide vs TSM: **A1_12** (older: CTs installed improperly; TSM: does not detect improper CT installation), **A2_8** (check inverter temperature and fans vs cold battery), **A2_9** ("Battery Cell Unbalanced" vs "Relay open"), **A2_10** (reverse polarity vs a place-holder alarm). TSM used.
- **A1_3** is described two ways in the Settings Guide (p.14) about when it appears with A1_4.
- ~~PV Insulation Detection~~ **Settled (author 10/2/2026):** the setting is disabled by default and gets turned on when the inverter is updated or after commissioning.
- ~~Complete System Shutdown with an external source on~~ **Settled (author 10/2/2026):** the manual is right (see Author field knowledge). Still open: what to check when a customer says the system keeps working after the button is out (the transfer-switch idea is from `tsm` p.32, unconfirmed).
- ~~"BMS goes to sleep below 51 V" (author)~~ **Settled (author 10/2/2026): the manual is right and is taught.** Original conflict, kept for the record: TSM p.21: the Sanctuary 2 BMS goes to minimum power mode when the battery is discharged below 0% and any cell is under 2300 mV, and a 0 V terminal usually means the battery breaker is off (red = on, green = off on the breaker window). TSM p.24 charges a low battery from a 60V/5A supply set to **54V/5A at the inverter's battery terminals**; the author's procedure is 52 V/5 A at the battery, stop at 51.5 V. Different scenarios (uncommissioned vs commissioned), but confirm.
- **Rev 1 and the power button** (`settings` p.32): "Inverter Shutdown SOC" was added because on Sanctuary 2 Rev 1 the controller stayed on with the power button off and drained the batteries to 0%. This is a hint for the open WCM-comms question; not confirmed.
- **Revs 1-2 PV minimum**: now taught as 120 V to start (`tsm` p.61, newest; the author said the Technical Service Manual overrules). The Isc limit for Revs 1-2 (13 A vs 15 A) is still open.
- **Power cycle wait**: now taught as about 30 s until the relays click (`tsm` p.56 overrules the author's ten seconds). Rev 1 also needs the batteries unplugged (`tsm` p.56). The Power cycle section below keeps the author's original wording for the record.

## Reference inbox ("Add files for Claude to learn from")

- The Reference tab has an **Add files** panel (`src/ask/AddFiles.tsx`, logic in `src/reference/upload.ts`, tested). It uploads to `reference-inbox/` on the dev branch through the GitHub contents API using a **fine-grained token the author pastes in** (kept in memory only, never stored, sent only to api.github.com). A static site has no backend, so this is the only in-app way to write to the repo.
- Limits: 25 MB per file (GitHub's browser upload limit is 25 MB; git blocks 100 MB and warns at 50 MB), 10 files per batch, types pdf/md/txt/csv/png/jpg/jpeg/webp/docx/xlsx. Names are sanitized and never overwritten (`-2`, `-3`).
- **The repo is public: everything in the inbox is public.** The panel says so and requires a checkbox. Before using an inbox file in content, apply the same public-repo rules as for the notes (no personal details, no internal-only items, no register-level steps).
- **When asked to "check the inbox":** list `reference-inbox/`, read each file in full, add a source tag in `src/content/types.ts` and `labels.ts`, turn the facts into sourced content (lessons, troubleshooting entries, `reference.ts` rows, fault data), note conflicts as `todo`s, update this file, then tell the author what changed. Do not move or delete inbox files unless asked.

## Look and feel, theme and version

- Shared building blocks are in `src/components/ui.tsx` (`ui` class tokens, `Disclosure` with a chevron, `PageHeader`). Build screens from these so the site stays consistent; collapsible content uses `Disclosure`.
- **Day/night** is a `.dark` class on `<html>` (Tailwind `@custom-variant dark` in `index.css`). `src/theme.ts` saves the choice in localStorage (`ess-training:theme`), falls back to the device setting, and `index.html` applies it before first paint.
- **Version and update time** in the header come from `package.json` `version` and the build time, injected by `vite.config.ts` (`__APP_VERSION__`, `__BUILD_TIME__`, read in `src/buildInfo.ts`). The time is the build (deploy) time shown in the viewer's time zone. **Bump `version` in `package.json` for each release** (0.x while the content grows).
- Chat answers show three steps first ("Show all"), with sources folded away.

## Procedures, knowledge pages and feedback

- **Procedures page** (`/procedures`, data in `src/content/procedures.ts`, 46 items): every procedure the author asked for. `statusOf()` derives Ready / Partly done / To do / Needs AI from the content: steps or links with no `todo` = Ready; with a `todo` = Partly done; nothing = To do; `blocked` = needs AI. **Every step needs sources and revisions; gaps are `todo` strings** (`procedures.test.ts` enforces this, checks that every link resolves, and checks that each requested item exists). Items with steps are also searchable by the chat.
- **Knowledge pages** (`/electricity`, `/solar`, `/codes`, `/competitors`, data in `src/content/topics.ts`): sourced facts in folding sections plus a visible "Still needed" list. **No general-knowledge content**: electrical and panel theory, state code requirements and everything about competitors are still to come from the author or Confluence. The Codes page links to agency home pages (California Energy Commission and CPUC and CSLB, Utah PSC and DOPL, Texas PUC and TDLR); those links could not be opened from the build sandbox, so verify them.
- **Held back from the Procedures content** (public repo): register addresses and register-read procedures (the registers item is a `todo` pending the author's decision), and the ESS support email address (the phone number is already public in the manuals).
- **Feedback page** (`/feedback`, `src/feedback/issue.ts`): a static site cannot store input, so it opens a pre-filled GitHub issue (public). **When asked to "check feedback", list the open issues, verify each claim against the sources, and update the content.**
- Items that need an AI model (the graph-screenshot optimizer) are shown as `blocked`: this site has no server or API key.

## Web research (author decision 10/2/2026)

- The author allowed information **from the internet** for four areas only: Tigo optimizers/TS4/TAP/CCA, electrical and panel theory, state code requirements (California, Utah, Texas) and competitors. This relaxes the "Lion sources only" rule for those areas and nowhere else.
- Web facts use the `web` source tag (`web()` helper: title, https URL, date searched), live in sections marked `fromWeb` ("From the web" label and a banner on the page), and are **never mixed into Lion facts**. `procedures.test.ts` enforces the URL, the date and the label.
- Quality: the build sandbox blocks most of these sites (support.tigoenergy.com, www.tigoenergy.com, www.energy.ca.gov, www.energy.gov, www.nrel.gov; earlier support.lionenergy.com, youtube.com, github.io), so the facts are from **search summaries, not the full pages**. Codes, dates and NEC editions are high stakes: Utah's edition results conflict and one Texas date was unconfirmed. Treat them as leads to verify on the official page. The author is using Claude.ai to pull the exact wording, to be handed back and loaded into these sections.
- Public repo: the same hold-backs apply (no register addresses, no internal-only Lion content, no personal contact details).
- **"Read in full" (10/2/2026):** the sandbox's WebFetch tool is blocked, but Bash `curl` works for many official sites (energy.ca.gov, le.utah.gov, rockymountainpower.net, tdlr.texas.gov, puc.texas.gov, Tigo's CDN manual). Facts read from the full official page use the `official()` helper (note "read in full <date>"); search-summary facts still use `web()` ("searched"). Still blocked (403/429): support.tigoenergy.com, psc.utah.gov, dopl.utah.gov, lionenergy.com/pages/installers.
- **Pictures:** `TopicSection.images` and `Procedure.images` (`TopicImage`: src under `public/`, alt, caption, sources). Code pages are in `public/images/codes/` (page images of the CEC, Utah, RMP, TDLR and PUCT documents). Procedure pictures reuse the author's photos and the Rev 2/3 guide pages. `procedures.test.ts` checks the files exist and have alt, caption and a source. Captions say only what is visible. Do not add generated or stock images.
- **Claude.ai research (10/2/2026):** the author ran a research prompt in Claude.ai. Facts I re-verified by `curl` are `official()` (Utah R746-312-4 and R156-55a-301 via Cornell LII, Utah Code 15A-3 Part 6, CPUC /nem, Tesla Powerwall 3 NA datasheet, Lion installers page). Facts I could not open (support.tigoenergy.com, CSLB, DGS CEC docx, SCE) are `web()` with the title ending "reported by Claude.ai research; not opened here". Still NOT FOUND: Texas utility manuals and buyback rules, other competitors' datasheets, electricity theory sources. Installers page: no training videos; its "UL 1741 Inverter Compliance" link for Sanctuary 3 points at the Sanctuary 2 UL 1973 certificate (report to Lion).
- **Second Claude.ai research (10/2/2026):** re-verified by curl and now `official()`: Oncor residential requirements (rev. May 1, 2025), CPS Energy DG Manual (9th ed., no battery export under net metering), Generac PWRcell 2 spec sheet, FranklinWH aPower 2 datasheet, EG4 18kPV spec sheet, Tesla Powerwall 3 US datasheet, Fluke AC-voltage, continuity and Ohm's law pages, US DOE AC vs DC page. Reported only (`web()`, "not opened here"): CenterPoint (URL 404s), AEP Texas, SolarEdge (403), Sungrow UK, and the CSLB BESS rule, whose effective date is **stayed by a court order** (do not teach it as in force). Texas buyback (Utilities Code 39.916) and Utah adminrules pages could not be opened. Datasheet gaps are shown as "not stated by manufacturer", never filled from review sites.
