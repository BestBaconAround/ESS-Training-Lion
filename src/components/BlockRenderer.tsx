import { REVISIONS, REVISION_LABELS } from '../content/labels'
import type { Block } from '../content/types'
import SourceNote, { RevisionBadge } from './SourceNote'

export default function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return <p className="leading-relaxed">{block.text}</p>

    case 'facts':
      return (
        <section>
          {block.title && <h3 className="mb-2 font-semibold">{block.title}</h3>}
          <ul className="space-y-3">
            {block.items.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>
                  <RevisionBadge revisions={f.revisions} />
                  {f.text}
                  <SourceNote sources={f.sources} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )

    case 'call':
      return (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            On a support call
          </div>
          <blockquote className="mt-2 border-l-4 border-amber-400 pl-3 italic">&ldquo;{block.customer}&rdquo;</blockquote>
          <p className="mt-3">
            <RevisionBadge revisions={block.revisions} />
            <span className="font-semibold">What you do: </span>
            {block.answer}
          </p>
          <div className="mt-1">
            <SourceNote sources={block.sources} />
          </div>
        </section>
      )

    case 'callout': {
      const warn = block.tone === 'warning'
      return (
        <aside
          className={`rounded-xl border p-4 ${
            warn
              ? 'border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100'
              : 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100'
          }`}
        >
          <div className="font-semibold">{warn ? 'Warning' : 'Note'}</div>
          <p className="mt-1">
            <RevisionBadge revisions={block.revisions} />
            {block.text}
          </p>
          <div className="mt-1 opacity-80">
            <SourceNote sources={block.sources} />
          </div>
        </aside>
      )
    }

    case 'todo':
      return (
        <aside className="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
          <span className="font-semibold">TODO: </span>
          {block.text}
        </aside>
      )

    case 'revisionDiff':
      return (
        <section>
          <h3 className="mb-2 font-semibold">{block.title}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-3 py-2">
                    &nbsp;
                  </th>
                  {REVISIONS.map((r) => (
                    <th key={r} scope="col" className="px-3 py-2">
                      {REVISION_LABELS[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {block.rows.map((row, i) => (
                  <tr key={i}>
                    <th scope="row" className="px-3 py-2 align-top font-medium">
                      {row.label}
                      <SourceNote sources={row.sources} />
                    </th>
                    {REVISIONS.map((r) => (
                      <td key={r} className="px-3 py-2 align-top">
                        {row.values[r] ?? <span className="text-slate-400">&mdash;</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )
  }
}
