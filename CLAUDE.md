# ESS-Training-Lion

Training platform for new Lion Energy tech support specialists on the **Sanctuary 2 Energy Storage System** (12kW hybrid inverter, 14.3kWh LFP batteries, up to 3 batteries per inverter). Currently a single-user tool (the author). The learner learns by doing, by example, and by repetition.

## Source of truth

- **Primary source (v1):** *Sanctuary Installation Guide & Manual, Gen2 12K* (updated 12/20/24), https://support.lionenergy.com/files/manuals/Sanctuary%20Installation%20Guide%20and%20Manual%20Gen2%2012K.pdf
- Page numbers cited in content (`sourcePages`) are **PDF page numbers**, which equal the printed page numbers (cover = 1).
- Later: Confluence-sourced content may be added as additional modules/lessons. Technical content must come from lionenergy.com or the author's Confluence, never from general knowledge.
- **Never invent specs, fault codes, or procedures.** If something is not in the source, leave a `TODO(source): ...` in the content file and, if it affects the learner, ask the author.
- **Ignore the manual's internal page cross-references** (e.g. "see page 41", "pages 40-41", "page 18"); several are wrong.

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
- **Technician app:** what technicians use to commission and troubleshoot the system. Further troubleshooting may require a laptop. Battery paralleling is hooked up during commissioning *when the Technician app directs it* (author's wording: "parallel is hooked up while commissioning when it is directed to do so"). TODO(author): confirm "parallel" means plugging in battery positives (paralleling batteries). Note the manual (p.40, p.20) calls the app the "Lion Energy App"; the video transcript never names it.
- **Inverter face light does not come on** with batteries hooked up to the inverter: it could mean internal damage to the inverter. If fan noise and relay clicks are heard, the LED itself may be bad. (This is diagnosis context for manual p.10 "light does not come on and the button is pushed in".) TODO(author): what the specialist does next / escalation path.
- **0.5V rule:** within 0.5V of each other is the *recommendation*, and the manual warns of high current between batteries. In practice it is not a big deal if they differ more: the battery cables are designed to be disconnected without touching the breaker, and most installers do not check battery voltage and there have been no issues. Teach the recommendation, then the field reality. The author chose not to define a "large spread" threshold: sims flag a spread above 0.5V as "outside the recommendation" and do not invent a fail threshold.
- **LED color:** the LED appears orange or red depending on the LED type and the viewer. Teach "orange or red = fault / failed PV insulation test".
- **Support phone:** (435) 244-3352 is correct (manual p.21). The number on p.46 (385.375.8191) is the general company line.
- **Gen 2 inverter revisions:** there are 4 revisions, all of the Gen 2 black system. Rev 4 has two power buttons (top = AC/DC, bottom = Complete System Shutdown) with a rotary PV switch above them. Revisions differ (e.g. Ethernet port location and power buttons); **lessons must call out the differences.** The commissioning video is Rev 4. TODO(author): the Rev 1-3 differences, and which revisions the manual describes.
- **Inverter stays on while an external power source is on.** Turning the system off (Complete System Shutdown) tries to shut it down but does not fully follow through if an external power source (grid/PV/generator) is on. The inverter's **two processors, DSP and ARM, stay on.** It only turns off when every power source other than the battery is off. TODO(author): the author's A/B answer on whether the battery alone keeps it on was inconsistent with this wording; recorded as "battery alone does not keep it on". TODO(author): exactly what else stays on (controller/comms, LED, loads) in that state.
- **WCM vs EMS-C:** the WCM (wireless communication module) ships on Revs 1-3 and some Rev 4. The EMS-C replaced it and does the same job, plus a built-in cellular data plan (50 MB, very bare-bones data). On cellular the homeowner sees only a blue Wi-Fi icon and no system information. An EMS-C manual exists (149 MB, not yet shared). Manual p.40 describes WCM wiring only.
- **Battery reserve:** 30% battery reserve percentage is typically recommended; it is customer preference.

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

- **Shutdown with an external source on:** the processors (DSP, ARM) stay on. What else (controller/comms, LED, loads)? Needed for the Module 2 status panel. Also confirm the battery alone does not keep it on.
- **Module 4 workflow:** the author says paralleling is done during commissioning when the Technician app directs it; manual p.20 says "after commissioning". Confirm the author's version supersedes p.20 and that "parallel" means plugging in battery positives.
- **"Light off with button pushed in"** (manual p.10): with "pushed in = on", it reads as "power buttons on, no light". Confirm. Specialist next step / escalation path still unknown.
- Rev 1-3 differences and which revisions the manual describes (p.10 shows PV disconnect, AC/DC, Complete System Shutdown).
- EMS-C manual (149 MB) not yet available; EMS-C content is limited to what the author stated.
- Cold-temperature Voc derating: manual defers to the tech specs, which contain no temperature coefficient. The sim must not compute Voc corrections without author-supplied data.
- PV wire "recommended cable size table" (p.27) is not present in the PDF text.

## Stack

- Vite + React + TypeScript + Tailwind. Static site only: no backend, no API keys. Must deploy to GitHub Pages (hash routing, configurable `base`).
- Progress in `localStorage` (lesson completion, quiz scores, sim attempts and best scores, per module).
- Vitest for the pure logic (sim scenario generators and graders, progress store).

## Content structure

- Content lives in data files under `src/content/` and is separate from components. Adding a module or lesson must not require UI changes.
- `src/content/modules/<nn>-<slug>.ts` exports one `Module` (see `src/content/types.ts`).
- Every quiz question has an explanation and `sourcePages`.
- Simulators are **data + engine**: parameters, symptom text, and ranges live in content; scenario generation and grading are pure, seeded functions in `src/sims/`, unit-tested.
- Modules 1, 3, 5, 6, 7 are `status: 'coming-soon'` with a planned `outline`. Modules 2 and 4 are fully built in v1.

## Conventions

- Lessons are short, concrete, and tied to what a customer would say on a support call.
- Sims randomize scenarios (seeded RNG) so they can be repeated without memorizing answers.
- Wrong sim actions show the consequence and explain why.
- Every fact in content carries a source page or a `TODO(source)`.
- Commit after each working piece. `npm run dev` must run cleanly and `npm run build` must succeed before calling a milestone done.
- Do not commit the manual PDF unless the author asks.
