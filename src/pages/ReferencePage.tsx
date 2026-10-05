import { useMemo, useState } from 'react'
import AddFiles from '../ask/AddFiles'
import Gen3Note from '../components/Gen3Note'
import RevisionSelect from '../components/RevisionSelect'
import SourceNote, { RevisionBadge } from '../components/SourceNote'
import { Disclosure, PageHeader, ui } from '../components/ui'
import { FAULT_CODES } from '../content/data/faults'
import { appliesToRevision, sourceText } from '../content/labels'
import { REFERENCE_SECTIONS } from '../content/reference'
import type { RevisionTag } from '../content/types'
import type { RevisionChoice } from '../troubleshooting/filter'

const appliesTo = (revisions: RevisionTag, rev: RevisionChoice) => appliesToRevision(revisions, rev)
const norm = (s: string) => s.toLowerCase()
const matches = (haystack: string, words: string[]) => words.every((w) => haystack.includes(w))

/** Quick lookups by topic and the full fault code table. Every section folds away; searching opens what matches. */
export default function ReferencePage() {
  const [query, setQuery] = useState('')
  const [rev, setRev] = useState<RevisionChoice>('all')
  const [opened, setOpened] = useState<Set<string>>(new Set())
  const words = useMemo(() => norm(query).split(/\s+/).filter(Boolean), [query])
  const searching = words.length > 0

  const sections = useMemo(
    () =>
      REFERENCE_SECTIONS.map((s) => ({
        ...s,
        rows: s.rows.filter((r) => appliesTo(r.revisions, rev) && matches(norm(`${s.title} ${r.label} ${r.value}`), words)),
      })).filter((s) => s.rows.length > 0),
    [rev, words],
  )
  const faults = useMemo(() => FAULT_CODES.filter((f) => matches(norm(`${f.code} ${f.name} ${f.description}`), words)), [words])

  // While searching, every matching section is open. Otherwise the reader's own choices stand.
  const sectionProps = (id: string) => ({
    open: searching || opened.has(id),
    onToggle: (isOpen: boolean) => {
      if (searching) return
      setOpened((s) => {
        const next = new Set(s)
        if (isOpen) next.add(id)
        else next.delete(id)
        return next
      })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Reference" lead="Quick lookups from the source documents, with the page for each. Open a section, or search to find a fact or a fault code." />

      <AddFiles />

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="ref-search">
          Search the reference material
        </label>
        <input
          id="ref-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search, e.g. CT pins, A2_11, reconnect, 54V"
          className={`${ui.input} max-w-md flex-1`}
        />
        <RevisionSelect value={rev} onChange={setRev} />
      </div>
      <Gen3Note rev={rev} />

      {sections.length === 0 && faults.length === 0 && (
        <p className={`${ui.card} border-dashed p-4 text-sm ${ui.muted}`}>Nothing matches that. Try a code, a part name or a number.</p>
      )}

      <div className="space-y-3">
        {sections.map((s) => (
          <Disclosure
            key={s.id}
            title={<span className="font-semibold">{s.title}</span>}
            right={<span className={`text-xs ${ui.muted}`}>{s.rows.length}</span>}
            {...sectionProps(s.id)}
          >
            <dl className="space-y-4">
              {s.rows.map((r) => (
                <div key={r.label + r.value}>
                  <dt className="text-sm font-semibold">
                    <RevisionBadge revisions={r.revisions} />
                    {r.label}
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {r.value}
                    <SourceNote sources={r.sources} />
                  </dd>
                </div>
              ))}
            </dl>
          </Disclosure>
        ))}

        {faults.length > 0 && (
          <Disclosure
            title={<span className="font-semibold">Alarm, fault and status codes</span>}
            right={
              <span className={`text-xs ${ui.muted}`}>
                {faults.length}
                {faults.length !== FAULT_CODES.length ? ` of ${FAULT_CODES.length}` : ''}
              </span>
            }
            {...sectionProps('faults')}
          >
            <ul className="space-y-2">
              {faults.map((f) => (
                <li key={f.code}>
                  <Disclosure
                    className="shadow-none"
                    title={
                      <span className="text-sm">
                        <span className="font-semibold">{f.code}</span> <span className="text-slate-600 dark:text-slate-300">{f.name}</span>
                      </span>
                    }
                  >
                    <div className="space-y-2 text-sm">
                      <p>{f.description}</p>
                      {f.solutions.length > 0 ? (
                        <ul className="list-disc space-y-1 pl-5">
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
                        <p className={`text-xs ${ui.muted}`}>The Technical Service Manual lists no troubleshooting for this code.</p>
                      )}
                      {f.todo?.map((t) => (
                        <p key={t} className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                          To confirm: {t}
                        </p>
                      ))}
                      <span className={`block text-xs ${ui.muted}`}>Source: {f.sources.map(sourceText).join('; ')}</span>
                    </div>
                  </Disclosure>
                </li>
              ))}
            </ul>
          </Disclosure>
        )}
      </div>
    </div>
  )
}
