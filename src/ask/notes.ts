import { FAULT_CODES } from '../content/data/faults'
import { BATTERY_RULES, CLASS_INFO } from '../content/sims/benchParams'
import { ESCALATION, TROUBLESHOOTING, type TroubleshootingEntry } from '../content/troubleshooting'
import type { Revision, RevisionTag, SourceRef } from '../content/types'
import { src } from '../content/helpers'
import { classify } from '../sims/bench/batteries'
import type { ChunkLink } from './corpus'
import type { Hit, SearchIndex } from './search'

// "Call notes": reads what a specialist types during a call and suggests ideas from the reference material.
// Every idea comes from a sourced entry or a sourced threshold. Nothing is generated or guessed.

export interface IdeaLine {
  text: string
  sources: SourceRef[]
  revisions: RevisionTag
}

export interface Idea {
  id: string
  kind: 'fault' | 'reading' | 'match' | 'question'
  title: string
  /** One sentence of explanation, from a source. */
  detail?: string
  lines: IdeaLine[]
  link?: ChunkLink
  /** Sources for `detail`. */
  sources?: SourceRef[]
}

export interface NotesAnalysis {
  revisions: Revision[]
  faultCodes: string[]
  readings: number[]
  ideas: Idea[]
}

export const EMPTY_ANALYSIS: NotesAnalysis = { revisions: [], faultCodes: [], readings: [], ideas: [] }

/** Notes are noisy free text, so a suggestion must match clearly. Real matches score 7+; unrelated chatter scores about 1. */
const NOTES_MIN_SCORE = 4
const MAX_MATCHES = 4
const MAX_QUESTIONS = 3
const byId = (id: string): TroubleshootingEntry | undefined => TROUBLESHOOTING.find((e) => e.id === id)

export function detectRevisions(text: string): Revision[] {
  const found = new Set<Revision>()
  for (const m of text.matchAll(/\brev(?:ision)?\.?\s*#?([1-4])\b/gi)) found.add(`rev${m[1]}` as Revision)
  return [...found]
}

/** "A2_10", "a2-10" and "A2 10" all become A2_10. Only codes that exist in the fault table are returned. */
export function detectFaultCodes(text: string): string[] {
  const known = new Set(FAULT_CODES.map((f) => f.code))
  const out: string[] = []
  for (const m of text.matchAll(/\bA([12])[\s_-]?(\d{1,2})\b/gi)) {
    const code = `A${m[1]}_${m[2]}`
    if (known.has(code) && !out.includes(code)) out.push(code)
  }
  return out
}

/** Battery-range voltages (35-60 V) written with a unit. Readings next to solar/grid words are skipped. */
export function detectBatteryReadings(text: string): number[] {
  const out: number[] = []
  for (const m of text.matchAll(/(\d{2}(?:\.\d{1,2})?)\s*(?:v\b|vdc\b|volts?\b)/gi)) {
    const v = parseFloat(m[1])
    if (v < 35 || v > 60) continue
    const at = m.index ?? 0
    const around = text.slice(Math.max(0, at - 30), at + m[0].length + 30).toLowerCase()
    if (/\b(pv|solar|string|grid|mppt|panel)/.test(around)) continue
    out.push(v)
  }
  return out
}

const linesOf = (e: TroubleshootingEntry, rev: Revision | null, limit = 5): IdeaLine[] =>
  e.steps
    .filter((s) => !rev || s.revisions === 'all' || s.revisions.includes(rev))
    .slice(0, limit)
    .map((s) => ({ text: s.text, sources: s.sources, revisions: s.revisions }))

const entryLink = (id: string): ChunkLink => ({ type: 'entry', entryId: id })

function readingIdeas(readings: number[]): Idea[] {
  const ideas: Idea[] = []
  const seen = new Set<string>()
  for (const v of readings) {
    const cls = classify(v)
    const key = `${cls}:${v}`
    if (seen.has(key)) continue
    seen.add(key)
    const target = cls === 'dead-low' ? 'ts-battery-wont-address' : cls === 'high-out' ? 'ts-battery-out-of-range' : cls === 'low-charge' ? 'ts-battery-spread' : null
    if (cls === 'ok' && v > BATTERY_RULES.highChargeAbove) {
      ideas.push({
        id: `reading-${v}`,
        kind: 'reading',
        title: `${v} V is above 53.5 V`,
        detail: 'Probably above 98% charged. It can be quickly discharged to 53.5 V by running the inverter on battery power as its only source.',
        sources: [src('manual', 20)],
        lines: [],
      })
    } else if (cls !== 'ok') {
      ideas.push({
        id: `reading-${v}`,
        kind: 'reading',
        title: `${v} V: ${CLASS_INFO[cls].label}`,
        detail: CLASS_INFO[cls].why,
        sources: CLASS_INFO[cls].sources,
        lines: [],
        link: target ? entryLink(target) : undefined,
      })
    }
  }
  if (readings.length >= 2) {
    const spread = Math.round((Math.max(...readings) - Math.min(...readings)) * 100) / 100
    if (spread > BATTERY_RULES.maxSpread) {
      ideas.push({
        id: 'reading-spread',
        kind: 'reading',
        title: `The readings differ by ${spread} V`,
        detail:
          'Batteries should be within 0.5 V of each other before they are paralleled, or excessive current may flow between them. Use the paralleling procedure: lowest battery first. In the field a bigger spread is usually not a big problem.',
        sources: [src('manual', 20), src('author')],
        lines: [],
        link: entryLink('ts-battery-spread'),
      })
    }
  }
  return ideas
}

/** Splits notes at line breaks, sentences and commas so different topics in one note can each be matched. */
const pieces = (text: string): string[] => text.split(/[\n.;,]+/).map((s) => s.trim()).filter((s) => s.length > 3)

export function analyzeNotes(text: string, index: SearchIndex): NotesAnalysis {
  const trimmed = text.trim()
  if (!trimmed) return EMPTY_ANALYSIS

  const revisions = detectRevisions(trimmed)
  const faultCodes = detectFaultCodes(trimmed)
  const readings = detectBatteryReadings(trimmed)
  const rev = revisions.length === 1 ? revisions[0] : null
  const ideas: Idea[] = []
  const usedEntries = new Set<string>()

  for (const code of faultCodes) {
    const e = byId(`ts-fault-${code.toLowerCase()}`)
    if (!e) continue
    usedEntries.add(e.id)
    ideas.push({
      id: e.id,
      kind: 'fault',
      title: e.title,
      detail: e.description,
      sources: e.steps[0]?.sources,
      lines: linesOf(e, rev),
      link: entryLink(e.id),
    })
  }

  const readingList = readingIdeas(readings)
  for (const r of readingList) if (r.link?.type === 'entry') usedEntries.add(r.link.entryId)
  ideas.push(...readingList)

  // Topic matches: the whole note first, then each line, keeping the best score per passage.
  const best = new Map<string, Hit>()
  for (const q of [trimmed, ...pieces(trimmed)]) {
    for (const h of index.search(q, 3, NOTES_MIN_SCORE)) {
      const cur = best.get(h.chunk.id)
      if (!cur || h.score > cur.score) best.set(h.chunk.id, h)
    }
  }
  const ranked = [...best.values()].sort((a, b) => b.score - a.score)
  let matches = 0
  for (const hit of ranked) {
    if (matches >= MAX_MATCHES) break
    const c = hit.chunk
    if (c.link.type === 'entry' && usedEntries.has(c.link.entryId)) continue
    if (c.link.type === 'entry') usedEntries.add(c.link.entryId)
    ideas.push({
      id: c.id,
      kind: 'match',
      title: c.title,
      detail: c.where,
      lines: c.lines.filter((l) => !rev || l.revisions === 'all' || l.revisions.includes(rev)).slice(0, 5),
      link: c.link,
    })
    matches++
  }

  // Questions worth asking, taken from the author's first-call checklist and the revision differences.
  if (ideas.length > 0) {
    const questions: Idea[] = []
    const firstCall = byId('ts-first-call')
    const ask = (id: string, title: string, sources: SourceRef[]) => questions.push({ id: `q-${id}`, kind: 'question', title, lines: [], sources })
    const needsRevision = ideas.some((i) => i.lines.some((l) => l.revisions !== 'all'))
    if (revisions.length === 0 && needsRevision) {
      ask('revision', 'Which revision is it? Rev 4 has two buttons (AC/DC and Complete System Shutdown) and two antennas. Revs 1-3 have one power button and one antenna.', [src('author')])
    }
    if (firstCall && !/intermittent|consistent|constant|sometimes|comes and goes|all the time|every day/i.test(trimmed)) {
      ask('intermittent', firstCall.steps[0].text, firstCall.steps[0].sources)
    }
    if (firstCall && !/alert|fault|alarm|code|light|a[12][_ -]?\d/i.test(trimmed)) {
      ask('alerts', firstCall.steps[1].text, firstCall.steps[1].sources)
    }
    ideas.push(...questions.slice(0, MAX_QUESTIONS))
  }

  return { revisions, faultCodes, readings, ideas }
}

export { ESCALATION }

// ---- draft storage (this browser tab only) ---------------------------------

export const NOTES_KEY = 'ess-training:call-notes'

interface TextStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** Notes may contain customer details, so they are kept in sessionStorage only: they survive a refresh but not a closed tab. */
export function loadNotes(store: TextStore | null): string {
  try {
    return store?.getItem(NOTES_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveNotes(store: TextStore | null, text: string): void {
  try {
    if (!store) return
    if (text) store.setItem(NOTES_KEY, text)
    else store.removeItem(NOTES_KEY)
  } catch {
    // Storage can be blocked; the notes still work in memory.
  }
}
