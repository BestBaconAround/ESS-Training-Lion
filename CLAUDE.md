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
3. Battery check step 6 (manual p.20) says "emergency mode"; the procedure actually uses **battery priority mode**. Teach battery priority mode.

Keep this list current. Any new correction from the author goes here first, then into content.

## Author field knowledge (not in the manual)

Knowledge supplied by the author from field experience. It is authoritative for teaching, but tag it in content as `source: 'author'` (not a manual page) so it stays distinguishable from the manual.

- **Battery below 51 VDC:** the battery BMS goes to sleep below 51 VDC (this is why the acceptable range is 51-55.6). If it does not recover after the second attempt, charge the battery with a 60V variable DC power supply. That supply is also often used to charge individual cells. TODO(author): what are the first two attempts?
- **0.5V rule:** within 0.5V of each other is the *recommendation*, and the manual warns of high current between batteries. In practice it is not a big deal if they differ more: the battery cables are designed to be disconnected without touching the breaker, and most installers do not check battery voltage and there have been no issues. Teach the recommendation, then the field reality. TODO(author): how should sims grade a spread above 0.5V?
- **LED color:** the LED appears orange or red depending on the LED type and the viewer. Teach "orange or red = fault / failed PV insulation test".
- **Support phone:** (435) 244-3352 is correct (manual p.21). The number on p.46 (385.375.8191) is the general company line.
- **Gen 2 inverter revisions:** there are 4 revisions. Rev 4 has two power buttons: top = AC/DC, bottom = Complete System Shutdown. Above them is a rotary switch for PV (PV Disconnect).
- **Inverter stays on while it has a source of power.** It turns off only when every power source other than the battery is off *and* those sources are turned off. TODO(author): clarify exactly (see open items).

## Open items / known manual inconsistencies

Track unresolved questions here until the author answers; then move the answer into Corrections, field knowledge, or content.

- "Light off with button pushed in" (p.10): which button, what the learner should do, and the real escalation path (manual says "contact your installer").
- Inverter power-source behavior (see field knowledge): does it change the Module 2 switch/status rules?
- Which of the 4 inverter revisions the manual (updated 12/20/24) describes, and whether lessons should call out revision differences.
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
