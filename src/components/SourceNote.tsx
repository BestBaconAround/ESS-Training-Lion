import { revisionText, sourceText } from '../content/labels'
import type { RevisionTag, SourceRef } from '../content/types'

/** Small provenance line shown under facts so every claim stays traceable. */
export default function SourceNote({ sources, revisions }: { sources: SourceRef[]; revisions?: RevisionTag }) {
  return (
    <span className="block text-xs text-slate-500 dark:text-slate-400">
      Source:{' '}
      {sources.map((x, i) => (
        <span key={i}>
          {i > 0 && '; '}
          {x.url ? (
            <a href={x.url} target="_blank" rel="noreferrer" className="underline hover:text-slate-800 dark:hover:text-slate-200">
              {sourceText(x)}
            </a>
          ) : (
            sourceText(x)
          )}
        </span>
      ))}
      {revisions && revisions !== 'all' ? ` · Applies to: ${revisionText(revisions)}` : ''}
    </span>
  )
}

export function RevisionBadge({ revisions }: { revisions: RevisionTag }) {
  if (revisions === 'all') return null
  return (
    <span className="mr-2 inline-block rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
      {revisionText(revisions)}
    </span>
  )
}
