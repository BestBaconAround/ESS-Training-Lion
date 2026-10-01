import { sourceText } from '../../content/labels'
import type { SourceRef } from '../../content/types'

export interface GradeRow {
  key: string
  label: string
  correct: boolean
  /** Lines shown under the label. */
  lines: string[]
  why: string
  sources: SourceRef[]
}

/** Step-by-step grading: each step shows right/wrong and why. */
export default function GradeList({ rows, score }: { rows: GradeRow[]; score: number }) {
  return (
    <section aria-label="Results" className="space-y-3">
      <div className="text-2xl font-bold">Score: {score}%</div>
      <ol className="space-y-3">
        {rows.map((r) => (
          <li
            key={r.key}
            className={`rounded-xl border p-3 ${
              r.correct
                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40'
            }`}
          >
            <div className="font-semibold">
              {r.correct ? '✓ ' : '✗ '}
              {r.label}
            </div>
            {r.lines.map((l, i) => (
              <p key={i} className="text-sm">
                {l}
              </p>
            ))}
            {!r.correct && <p className="mt-1 text-sm">{r.why}</p>}
            {!r.correct && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Source: {r.sources.map(sourceText).join('; ')}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
