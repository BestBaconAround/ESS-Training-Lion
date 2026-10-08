# Handoff notes for a new Claude Code session

Read `CLAUDE.md` first (rules, sources, corrections). This file adds working notes from the cloud sessions. The repo is public: never put customer data, contact details or passphrases here.

## State (v0.15.0)

- Branch: `claude/gracious-ramanujan-6os5lz`. Everything is pushed. Deploys are manual: GitHub Actions, workflow `deploy.yml`, run with "Run workflow" on that branch (or `workflow_dispatch` through the GitHub tools). The author says "publish" to mean deploy.
- Latest additions: Ask-bot wording fixes (`src/ask/tokenize.ts` phrase rules, tests in `src/ask/search.test.ts`), the battery "has voltage but lost communication" entry (`ts-battery-no-comm`), the 3D inverter lab (`/inverter-3d`) with a creative sandbox, and its photo-based look.

## How the author likes to work

- Direct answers; say when something is wrong. Short plain wording. Keep going until a real question needs the author.
- Do not create a pull request unless asked. Commit after each working piece; bump `version` in `package.json` for each release.
- Commit footer lines used so far: `Co-Authored-By: ...` and `Claude-Session: ...` (use whatever the current session gives you).
- Never invent specs, fault codes or procedures. Gaps are `TODO(source)` strings. The Technical Service Manual overrules the author's own field knowledge, except where the author later says otherwise (see `CLAUDE.md`).

## Checks before publishing

- `npx vitest run` (292 tests) and `npm run build` (runs the content tests).
- Browser checks for the 3D lab: headless Chromium needs `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`. Set `window.__ESS_TEST__ = true` before load to use `window.__invScene.screenOf / screenOfPlug / screenOfBolt`. `#/inverter-3d?seed=N` opens a fixed case. Seed examples: 10 bad BMS cable, 20 remote shutdown open, 1 CT in the wrong port, 25 loose PV bolt, 31 loose battery bolt, 43 battery cables reversed.
- Do not use `pkill -f` with the server command (it killed the shell once); use `fuser -k PORT/tcp`.

## Open questions for the author (none answered yet)

- Battery connector: confirm "Viry B" and "Coco" spelling, where the model is printed, which Sanctuary 2 revisions ship each, whether any Sanctuary 3 battery has the round connector, and whether the 2 red + 1 black wire connector is the same as the TSM p.23 green/orange/blue one (and which Ethernet pins to splice to).
- 3D lab: lock the fix tasks until the exploration tasks are done? Add a second inverter for the parallel faults (A2_19, A2_20)?
- Revs 1-3: Wi-Fi steps for Revs 1-2, drilled antenna hole and EMS-C 12 V cable on Revs 1-3, comms with the power button off, PV Isc 13 A vs 15 A for Revs 1-2, whether the PV leakage test applies to Revs 1-3, escalation path for "light off with button in".
- Confirm the Rev 1-4 to manual mapping, screenshots Smart1 to Smart3, which homeowner messages the author actually sends, a real Lion discharge curve, charger settings for the Gen 3 force charge.
- Torque values for the Sanctuary 2 wire box are not in any document read (the TSM points to the Sanctuary 3 installation manual).

## Ideas offered but not started

- Read the rest of the Sanctuary 3 installation guide (solar, AC, generator wiring, commissioning) and add steps.
- Third Claude.ai research prompt: Texas buyback (Utilities Code 39.916), SDG&E Rule 21, split-phase and series-parallel definitions, Vmp/Imp, 48 V and 500 V safety.
- Lab models for Revs 1-3 and Sanctuary 3 (each needs its own layout and photos).
