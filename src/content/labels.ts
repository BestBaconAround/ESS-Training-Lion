import type { Revision, RevisionTag, SourceRef, SourceTag } from './types'

export const SOURCE_LABELS: Record<SourceTag, string> = {
  manual: 'Installation Guide & Manual 12/20/24 (Rev 4)',
  san2_2: 'Installation Guide 4/25/25 (Revs 1-2)',
  san2_3: 'Installation Guide 4/25/25 (Rev 3)',
  emsc: 'EMS-C Manual 4/13/25',
  san3: 'Sanctuary 3 Installation Guide 3/10/26',
  ctguide: 'CT Guide 4/09/26',
  video: 'Commissioning video',
  author: 'Course author (field knowledge)',
  web: 'Web (not Lion material, verify)',
  tsm: 'Sanctuary Technical Service Manual (9/30/2026)',
  settings: 'Settings Guide for Sanctuary 2 and 3 (rev 1.1, 6/4/2026)',
  notes: 'Author\'s ESS support notes',
}

export const REVISIONS: Revision[] = ['rev1', 'rev2', 'rev3', 'rev4', 'gen3']

/** Tag for a fact that holds on Sanctuary 2 Revs 1-4 and on Sanctuary 3. */
export const EVERY: Revision[] = ['rev1', 'rev2', 'rev3', 'rev4', 'gen3']

export const REVISION_LABELS: Record<Revision, string> = {
  rev1: 'Rev 1',
  rev2: 'Rev 2',
  rev3: 'Rev 3',
  rev4: 'Rev 4',
  gen3: 'Sanctuary 3',
}

export function revisionText(tag: RevisionTag): string {
  if (tag === 'all') return 'All Sanctuary 2 revisions'
  if (REVISIONS.every((r) => tag.includes(r))) return 'All revisions and Sanctuary 3'
  return tag.map((r) => REVISION_LABELS[r]).join(', ')
}

/** Whether a fact tagged `tag` shows for the chosen revision. `'all'` (no choice) shows everything; the tag `'all'` means Sanctuary 2 only. */
export function appliesToRevision(tag: RevisionTag, choice: Revision | 'all'): boolean {
  if (choice === 'all') return true
  if (tag === 'all') return choice !== 'gen3'
  return tag.includes(choice)
}

export function sourceText(ref: SourceRef): string {
  const label = SOURCE_LABELS[ref.source]
  if (ref.source === 'web') return ref.note ? `${label}: ${ref.note}` : label
  if (!ref.pages?.length) return label
  return `${label}, p.${ref.pages.join(', ')}`
}
