// Content data model. Everything the learner reads lives in data files that
// satisfy these types, so new modules/lessons/quizzes need no UI changes.
// See CLAUDE.md ("Content structure", "Hardware variants") for the rules.

/** Gen 2 black Sanctuary hardware revisions. Add new values here for new hardware. */
export type Revision = 'rev1' | 'rev2' | 'rev3' | 'rev4'

/** Which revisions a fact applies to. */
export type RevisionTag = 'all' | Revision[]

/** Where a fact came from. Never mix sources: tag each fact. */
export type SourceTag =
  | 'manual' // Gen2 12K Installation Guide & Manual, updated 12/20/24 (4) - Rev 4
  | 'san2_2' // Installation Guide, updated 4/25/25 (2) - Revs 1-2
  | 'san2_3' // Installation Guide, updated 4/25/25 (3) - Rev 3
  | 'emsc' // EMS-C Manual, updated 4/13/25
  | 'video' // Commissioning walkthrough video transcript
  | 'author' // Field knowledge supplied by the course author

export interface SourceRef {
  source: SourceTag
  /** PDF page numbers (equal to printed page numbers). Omit for video/author. */
  pages?: number[]
  note?: string
}

/** A single teachable fact. */
export interface Fact {
  text: string
  sources: SourceRef[]
  revisions: RevisionTag
}

export interface RevisionDiffRow {
  label: string
  values: Partial<Record<Revision, string>>
  sources: SourceRef[]
}

export type Block =
  | { type: 'text'; text: string }
  | { type: 'facts'; title?: string; items: Fact[] }
  /** "What the customer says" + what the specialist does. */
  | { type: 'call'; customer: string; answer: string; sources: SourceRef[]; revisions: RevisionTag }
  | { type: 'callout'; tone: 'warning' | 'note'; text: string; sources: SourceRef[]; revisions: RevisionTag }
  /** Visible gap: something not in the source. Never guess; leave a TODO. */
  | { type: 'todo'; text: string }
  | { type: 'revisionDiff'; title: string; rows: RevisionDiffRow[] }
  /** A photo from public/images. `src` is relative to public/. Alt text and a caption are required. */
  | {
      type: 'image'
      src: string
      alt: string
      caption: string
      width: number
      height: number
      sources: SourceRef[]
      revisions: RevisionTag
    }

export interface Lesson {
  /** Stable. Progress is keyed by this: never rename or reuse. */
  id: string
  title: string
  summary: string
  blocks: Block[]
}

export interface QuizChoice {
  id: string
  text: string
}

export interface QuizQuestion {
  /** Stable. Never rename or reuse. */
  id: string
  lessonId?: string
  prompt: string
  kind: 'single' | 'multi' | 'truefalse'
  choices: QuizChoice[]
  /** Ids of the correct choices. */
  correct: string[]
  /** Required: shown after answering. */
  explanation: string
  sources: SourceRef[]
  revisions: RevisionTag
}

export interface Quiz {
  /** Fraction of questions needed to pass, 0-1. */
  passMark: number
  questions: QuizQuestion[]
}

/** Simulator kinds. The engine + UI for each kind lives in src/sims and src/sims-ui. */
export type SimKind =
  | 'sizing-calculator'
  | 'inverter-panel'
  | 'wall-layout'
  | 'multimeter-bench'
  | 'wiring-board'
  | 'continuity-bench'
  | 'power-up-sequence'

export interface SimDef {
  /** Stable. Sim progress is keyed by this. */
  id: string
  kind: SimKind
  title: string
  intro: string
}

export type ModuleStatus = 'ready' | 'coming-soon'

export interface OutlineItem {
  text: string
  sources: SourceRef[]
}

export interface Module {
  /** Stable. Never rename or reuse. */
  id: string
  number: number
  title: string
  summary: string
  status: ModuleStatus
  /** Planned topics. Shown on "Coming soon" modules. */
  outline: OutlineItem[]
  lessons: Lesson[]
  quiz?: Quiz
  sim: SimDef
}
