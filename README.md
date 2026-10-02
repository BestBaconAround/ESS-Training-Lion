# ESS Training - Lion Energy Sanctuary 2

Training platform for new Lion Energy tech support specialists on the Sanctuary 2 Energy Storage System.
Static site (Vite + React + TypeScript + Tailwind). No backend, no API keys. Progress is saved in this browser's `localStorage`.

## Run it

Requires Node 22 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

Other commands:

```bash
npm run build      # checks content, type-checks, builds to ./dist
npm run preview    # serves ./dist locally to check the production build
npm test           # unit tests (content rules, progress, quiz, simulator engines)
```

## What is built (v1)

All 7 modules are on the dashboard. Modules 2 and 4 are fully built; the rest show "Coming soon" with a planned outline.

| # | Module | Status |
|---|---|---|
| 1 | System Fundamentals | Coming soon |
| 2 | Inverter Controls and Indicators | Lessons, 17-question quiz, inverter panel simulator |
| 3 | Installation Location and Mounting | Coming soon |
| 4 | DC Wiring and Batteries | Lessons, 30-question quiz, battery check and PV leakage simulator |
| 5 | AC Wiring, CTs, Generator, AC Solar | Coming soon |
| 6 | Continuity Testing and Phasing | Coming soon |
| 7 | First-Time Power-Up | Coming soon |

Progress (lessons, quiz scores, simulator attempts and best scores) can be downloaded and restored from the **Progress backup** page.

The **Troubleshooting** page (top navigation) is a searchable reference for battery, inverter and power problems: the 24 fault codes plus guided steps, filterable by area and by revision, each step with its source. Add entries in `src/content/troubleshooting.ts`.

**Ask the notes** (on the Troubleshooting page) is a chatbot that answers only from the reference material, with sources. It searches the troubleshooting entries, the lessons, and any markdown files you drop into `src/content/reference/` (each `#` heading becomes a searchable section). It is a search, not generative AI, so it cannot make things up and needs no server or API key. If nothing matches, it says so.

**Call notes** (second tab) is for typing notes during a call. It suggests ideas from the reference material: fault codes, battery voltages checked against the bench thresholds, matching troubleshooting entries, detected revision, and questions to ask next. Same search engine, no AI. The draft lives in `sessionStorage` (gone when the tab closes) unless you save it.

**Reference** (third tab) is a searchable lookup: quick facts, pins, defaults and limits by topic (contacts, telling the revisions apart, lights and controls, battery, grid/generator/solar, ports and pins, tools, source documents) plus all 88 alarm, fault and status codes. Every row shows its source page and revision. The data is in `src/content/reference.ts` and `src/content/data/faults.ts`.

The Reference tab also has **Add files for Claude to learn from**: it uploads manuals and notes (up to 25 MB each) to the `reference-inbox/` folder using a GitHub token you paste in (kept in memory only). **The repo is public, so anything added is public.** Ask Claude to check the inbox in a later session to turn the files into app content.

**History** (fourth tab) keeps your Ask questions and saved call notes. It is **private by passphrase, not an account**: the history is encrypted in your browser (AES-GCM, key from PBKDF2-SHA-256, 600,000 iterations) and stored only in this browser's `localStorage`. There is no server, so there is **no password recovery** (forget it and the only option is Erase), it does not follow you to another browser or device, and it locks when you leave the page, press Lock now, or after 15 minutes idle. A real login would need a backend, which this static site does not have. Do not put customer names or addresses in call notes.

## Adding content

Content is data, not UI code. See `CLAUDE.md` for the rules (sources, revision tags, corrections).

- A module is one file in `src/content/modules/`, registered in `src/content/index.ts`.
- Every fact, call example and quiz question carries `sources` (manual page, EMS-C manual, video, or author) and a `revisions` tag.
- Every quiz question needs an `explanation`. `npm run build` fails if content breaks the rules (`src/content/content.test.ts`).
- Simulator scenarios live in `src/content/sims/` (data); the generators and graders are pure, seeded, tested functions in `src/sims/`.
- Ids (modules, lessons, questions, sims) are stable: progress is keyed by them. Never rename or reuse one.
- A new kind of simulator needs an engine in `src/sims/`, a UI in `src/sims-ui/`, and one line in `src/sims-ui/registry.tsx`.

## Deploy to GitHub Pages

The build uses relative asset paths and hash routing, so it works from any Pages sub-path with no server rewrites.

1. In the repo: Settings > Pages > Source: **GitHub Actions**.
2. Actions tab > **Deploy to GitHub Pages** > Run workflow.

To serve from a specific base path instead, build with `VITE_BASE=/ESS-Training-Lion/ npm run build`.

The source manuals are Lion Energy documents. Check the repository's visibility before publishing anything built from them.
