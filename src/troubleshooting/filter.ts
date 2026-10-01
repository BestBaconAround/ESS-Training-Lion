import type { TroubleshootingArea, TroubleshootingEntry, TroubleshootingStep } from '../content/troubleshooting'
import type { Revision } from '../content/types'

const norm = (s: string) => s.toLowerCase()

/** Matches an entry against a free-text query: every word must appear in the title, code, description, customer wording or any step. */
export function matches(entry: TroubleshootingEntry, query: string): boolean {
  const words = norm(query).split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const hay = norm([entry.title, entry.faultCode ?? '', entry.description ?? '', entry.customerSays ?? '', ...entry.steps.map((s) => s.text)].join(' '))
  return words.every((w) => hay.includes(w))
}

export function filterEntries(
  entries: TroubleshootingEntry[],
  area: TroubleshootingArea | 'all',
  query: string,
): TroubleshootingEntry[] {
  return entries.filter((e) => (area === 'all' || e.area === area) && matches(e, query))
}

export type RevisionChoice = 'all' | Revision

/** Steps that apply to the chosen revision. 'all' keeps every step. */
export function stepsFor(entry: TroubleshootingEntry, rev: RevisionChoice): TroubleshootingStep[] {
  if (rev === 'all') return entry.steps
  return entry.steps.filter((s) => s.revisions === 'all' || s.revisions.includes(rev))
}
