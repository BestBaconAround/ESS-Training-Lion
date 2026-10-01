import type { Revision, RevisionTag, SourceRef, SourceTag } from './types'

export const SOURCE_LABELS: Record<SourceTag, string> = {
  manual: 'Installation Guide & Manual 12/20/24 (Rev 4)',
  san2_2: 'Installation Guide 4/25/25 (Revs 1-2)',
  san2_3: 'Installation Guide 4/25/25 (Rev 3)',
  emsc: 'EMS-C Manual 4/13/25',
  video: 'Commissioning video',
  author: 'Course author (field knowledge)',
  settings: 'Settings Guide for Sanctuary 2 and 3 (rev 1.1, 6/4/2026)',
  notes: 'Author\'s ESS support notes',
}

export const REVISIONS: Revision[] = ['rev1', 'rev2', 'rev3', 'rev4']

export const REVISION_LABELS: Record<Revision, string> = {
  rev1: 'Rev 1',
  rev2: 'Rev 2',
  rev3: 'Rev 3',
  rev4: 'Rev 4',
}

export function revisionText(tag: RevisionTag): string {
  return tag === 'all' ? 'All revisions' : tag.map((r) => REVISION_LABELS[r]).join(', ')
}

export function sourceText(ref: SourceRef): string {
  const label = SOURCE_LABELS[ref.source]
  if (!ref.pages?.length) return label
  return `${label}, p.${ref.pages.join(', ')}`
}
