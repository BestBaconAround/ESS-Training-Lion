# ESS-Training-Lion

Training platform for new Lion Energy tech support specialists on the **Sanctuary 2 Energy Storage System** (12kW hybrid inverter, 14.3kWh LFP batteries, up to 3 batteries per inverter). Currently a single-user tool (the author). The learner learns by doing, by example, and by repetition.

## Source of truth

- **Primary source (v1):** *Sanctuary Installation Guide & Manual, Gen2 12K* (updated 12/20/24), https://support.lionenergy.com/files/manuals/Sanctuary%20Installation%20Guide%20and%20Manual%20Gen2%2012K.pdf
- **Other source documents in the repo (committed by the author):**
  - `LION- SAN2_2 - Sanctuary Installation Guide- 042525.pdf` (Updated 4/25/25 (2), 40 pp, 13.5kWh variant, includes a fault-code table on pp.32-35)
  - `LION- SAN2_3- Sanctuary Installation Guide-042525.pdf` (Updated 4/25/25 (3), 44 pp, 13.5kWh variant)
  - `Lion_Energy_EMS-C_Manual_7-compressed.pdf` (EMS-C manual, Updated 4/13/25, 16 pp, for Sanctuary 2 and Sanctuary 3)
  - Source tags in content: `manual` (12/20/24 (4), the 14.3kWh manual), `san2_2`, `san2_3`, `emsc`, `video`, `author`.
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

- **Battery below 51 VDC / won't address:** the BMS goes to sleep below 51 VDC (this is why the acceptable range is 51-55.6). If the battery does not address during commissioning and its voltage is absent or below 51 V, it must be charged. Because the system is not yet commissioned, **battery awaken is not available** (it only works on a commissioned system). Procedure: remove the battery cover (16x 4mm screws), connect the 60V variable DC power supply alligator clips to the positive and negative terminals at the top of the battery inside. Set the supply to **52 VDC at 5 A** (5 A because that is all the supply can deliver). **Stop charging once the battery reaches 51.5 VDC.** Follow standard electrical safety for this voltage. This supply is also often used to charge individual cells.
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
- **Complete System Shutdown vs external power:** if Complete System Shutdown is off **and an external power source is on, the system works as normal** (author's answer, taken literally: the other switches decide loads/PV/comms exactly as if Complete System Shutdown were on). Shutdown "tries to turn off the system but doesn't fully follow through" while an external source is on; the inverter's two processors, **DSP and ARM**, stay on. With **no external source** (battery only), shutdown turns the inverter off fully (matches manual p.10: Complete System Shutdown turns off all components). The battery alone does not keep the inverter on. **External sources (author): grid, solar (PV), AC solar, generator, and wind (very, very rare).** PV only counts as a source while the PV Disconnect is on (author confirmed).
- **One communication module per system (author):** only one module (WCM or EMS-C) is used, and it stays in the parent inverter (`emsc` p.13 agrees for the EMS-C).
- **WCM vs EMS-C:** the WCM (wireless communication module) ships on Revs 1-3 and some Rev 4. The EMS-C replaced it and does the same job, plus a built-in cellular data plan (50 MB, very bare-bones data). On cellular the homeowner sees only a blue Wi-Fi icon and no system information. An EMS-C manual exists (149 MB, not yet shared). Manual p.40 describes WCM wiring only.
- **Rev 4, AC/DC off (author: "off"):** the status panel shows controller/comms **offline** when AC/DC is off on an EMS-C system. This matches `emsc` p.8 (AC power off removes 12V from the EMS-C) and **contradicts manual p.10 and the project brief**, which say the controller stays on and can communicate with AC/DC off. The two processors (DSP, ARM) still stay on. **Settings and firmware updates work as long as the EMS-C has power (author).** On Rev 4 the EMS-C is powered from the 12V RSS supply, which turns off with AC/DC, so with AC/DC off the panel shows settings/firmware unavailable (derived from the author's answer plus `emsc` p.8; the EMS-C's integrated backup battery is only mentioned for parallel inverters being power-cycled during commissioning, `emsc` p.5). TODO(author): do WCM revs (1-3) keep comms with the power button off?
- **Restart commissioning (author: yes):** the dead-battery ladder's "restart the commissioning process" applies only to a system that never finished its first commissioning; re-commissioning a commissioned system is not a troubleshooting tool (`emsc` p.16).
- **Battery reserve:** 30% battery reserve percentage is typically recommended; it is customer preference.

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
- **Fault-code table** (`san2_2` pp.32-35) applies to all Sanctuaries (author); Module 2 scenarios may use it. Needs a source-tagged data file when built.
- EMS-C manual (149 MB) not yet available; EMS-C content is limited to what the author stated.
- Cold-temperature Voc derating: manual defers to the tech specs, which contain no temperature coefficient. The sim must not compute Voc corrections without author-supplied data.
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

## Conventions

- Lessons are short, concrete, and tied to what a customer would say on a support call.
- Sims randomize scenarios (seeded RNG) so they can be repeated without memorizing answers.
- Wrong sim actions show the consequence and explain why.
- Every fact in content carries a source page or a `TODO(source)`.
- Commit after each working piece. `npm run dev` must run cleanly and `npm run build` must succeed before calling a milestone done.
- Do not commit the manual PDF unless the author asks.
