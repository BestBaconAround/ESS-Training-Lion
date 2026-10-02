import { useMemo, useState } from 'react'
import AddFiles from './AddFiles'
import SourceNote, { RevisionBadge } from '../components/SourceNote'
import { FAULT_CODES } from '../content/data/faults'
import { sourceText } from '../content/labels'
import { REFERENCE_SECTIONS } from '../content/reference'
import type { RevisionTag } from '../content/types'
import type { RevisionChoice } from '../troubleshooting/filter'

const appliesTo = (revisions: RevisionTag, rev: RevisionChoice) => rev === 'all' || revisions === 'all' || revisions.includes(rev)
const norm = (s: string) => s.toLowerCase()
const matches = (haystack: string, words: string[]) => words.every((w) => haystack.includes(w))

/** Quick lookups: facts, pins and numbers by topic, and the full fault code table. Search narrows both. */
export default function ReferenceTab({ rev }: { rev: RevisionChoice }) {
  const [query, setQuery] = useState('')
  const words = useMemo(() => norm(query).split(/\s+/).filter(Boolean), [query])

  const sections = useMemo(
    () =>
      REFERENCE_SECTIONS.map((s) => ({
        ...s,
        rows: s.rows.filter((r) => appliesTo(r.revisions, rev) && matches(norm(`${s.title} ${r.label} ${r.value}`), words)),
      })).filter((s) => s.rows.length > 0),
    [rev, words],
  )

  const faults = useMemo(
    () => FAULT_CODES.filter((f) => matches(norm(`${f.code} ${f.name} ${f.description}`), words)),
    [words],
  )

  const nothing = sections.length === 0 && faults.length === 0

  return (
    <section aria-label="Reference">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Quick lookups from the source documents, with the page for each. Search narrows everything below, including the fault codes.
      </p>
      <div className="mt-2">
        <AddFiles />
      </div>
      <label className="sr-only" htmlFor="ref-search">
        Search the reference material
      </label>
      <input
        id="ref-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search, e.g. CT pins, A2_11, reconnect, 54V"
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
      />

      {nothing && <p className="mt-4 text-sm">Nothing in the reference material matches that. Try a code, a part name or a number.</p>}

      <div className="mt-4 space-y-5">
        {sections.map((s) => (
          <div key={s.id}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">{s.title}</h3>
            <dl className="mt-2 space-y-2">
              {s.rows.map((r) => (
                <div key={r.label + r.value} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <dt className="font-semibold">
                    <RevisionBadge revisions={r.revisions} />
                    {r.label}
                  </dt>
                  <dd className="mt-1">
                    {r.value}
                    <SourceNote sources={r.sources} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        {faults.length > 0 && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Alarm, fault and status codes ({faults.length}
              {faults.length !== FAULT_CODES.length ? ` of ${FAULT_CODES.length}` : ''})
            </h3>
            <div className="mt-2 space-y-2">
              {faults.map((f) => (
                <details key={f.code} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <summary className="cursor-pointer font-semibold">
                    {f.code}: {f.name}
                  </summary>
                  <p className="mt-2">{f.description}</p>
                  {f.solutions.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {f.solutions.map((x, i) => {
                        const text = typeof x === 'string' ? x : x.text
                        const revs = typeof x === 'string' ? 'all' : x.revisions
                        if (!appliesTo(revs, rev)) return null
                        return (
                          <li key={i}>
                            <RevisionBadge revisions={revs} />
                            {text}
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs">The Technical Service Manual lists no troubleshooting for this code.</p>
                  )}
                  {f.todo?.map((t) => (
                    <p key={t} className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                      To confirm: {t}
                    </p>
                  ))}
                  <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">Source: {f.sources.map(sourceText).join('; ')}</span>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
