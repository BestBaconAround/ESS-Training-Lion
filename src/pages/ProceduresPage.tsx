import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SourceNote, { RevisionBadge } from '../components/SourceNote'
import RevisionSelect from '../components/RevisionSelect'
import { Disclosure, PageHeader, ui } from '../components/ui'
import { PROCEDURES, PROCEDURE_GROUPS, statusOf, type Procedure, type ProcedureLink, type ProcedureStatus } from '../content/procedures'
import type { RevisionTag } from '../content/types'
import type { RevisionChoice } from '../troubleshooting/filter'

const STATUS: Record<ProcedureStatus, { label: string; cls: string }> = {
  ready: { label: 'Ready', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  partial: { label: 'Partly done', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' },
  todo: { label: 'To do', cls: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  blocked: { label: 'Needs AI', cls: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' },
}

const FILTERS: (ProcedureStatus | 'all')[] = ['all', 'ready', 'partial', 'todo', 'blocked']
const applies = (r: RevisionTag, rev: RevisionChoice) => rev === 'all' || r === 'all' || r.includes(rev)
const norm = (t: string) => t.toLowerCase()

function linkTarget(l: ProcedureLink): string {
  switch (l.type) {
    case 'entry':
      return `/troubleshooting#${l.id}`
    case 'lesson':
      return `/module/${l.moduleId}/lesson/${l.lessonId}`
    case 'module':
      return `/module/${l.moduleId}`
    case 'page':
      return l.to
  }
}

/** Every procedure the author asked for, with how much of it exists. Gaps are listed, never papered over. */
export default function ProceduresPage() {
  const [query, setQuery] = useState('')
  const [rev, setRev] = useState<RevisionChoice>('all')
  const [filter, setFilter] = useState<ProcedureStatus | 'all'>('all')
  const words = useMemo(() => norm(query).split(/\s+/).filter(Boolean), [query])
  const searching = words.length > 0

  const counts = useMemo(() => {
    const c: Record<ProcedureStatus | 'all', number> = { all: PROCEDURES.length, ready: 0, partial: 0, todo: 0, blocked: 0 }
    for (const p of PROCEDURES) c[statusOf(p)]++
    return c
  }, [])

  const visible = useMemo(
    () =>
      PROCEDURES.filter((p) => filter === 'all' || statusOf(p) === filter).filter((p) => {
        if (!words.length) return true
        const hay = norm([p.title, p.summary, ...(p.steps?.map((x) => x.text) ?? []), ...(p.todo ?? [])].join(' '))
        return words.every((w) => hay.includes(w))
      }),
    [filter, words],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procedures"
        lead="How to do the jobs on a Sanctuary call. Each one shows how much is written. Where the documents do not give the answer, it says what is still needed."
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
        {FILTERS.map((f) => (
          <button
            key={f}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${
              filter === f
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {f === 'all' ? 'All' : STATUS[f].label} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="proc-search">
          Search procedures
        </label>
        <input id="proc-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search, e.g. generator, TOU, relay" className={`${ui.input} max-w-md flex-1`} />
        <RevisionSelect value={rev} onChange={setRev} />
      </div>

      {visible.length === 0 && <p className={`${ui.card} border-dashed p-4 text-sm ${ui.muted}`}>Nothing matches. Try fewer words or another status.</p>}

      {PROCEDURE_GROUPS.map((g) => {
        const items = visible.filter((p) => p.group === g)
        if (!items.length) return null
        return (
          <section key={g} aria-label={g}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{g}</h2>
            <ul className="space-y-2">
              {items.map((p) => (
                <li key={p.id}>
                  <Item p={p} rev={rev} forceOpen={searching} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function Item({ p, rev, forceOpen }: { p: Procedure; rev: RevisionChoice; forceOpen: boolean }) {
  const st = statusOf(p)
  const steps = (p.steps ?? []).filter((x) => applies(x.revisions, rev))
  return (
    <Disclosure
      id={p.id}
      {...(forceOpen ? { open: true } : {})}
      title={
        <span className="block">
          <span className="font-medium">{p.title}</span>
          <span className={`mt-0.5 block text-xs font-normal ${ui.muted}`}>{p.summary}</span>
        </span>
      }
      right={<span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[st].cls}`}>{STATUS[st].label}</span>}
    >
      <div className="space-y-4 text-sm">
        {p.blocked && <p className="rounded-lg bg-violet-50 p-3 text-violet-900 dark:bg-violet-900/30 dark:text-violet-200">{p.blocked}</p>}

        {steps.length > 0 && (
          <ol className="list-decimal space-y-3 pl-5">
            {steps.map((x, i) => (
              <li key={i}>
                <RevisionBadge revisions={x.revisions} />
                {x.text}
                <SourceNote sources={x.sources} />
              </li>
            ))}
          </ol>
        )}
        {p.images && p.images.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {p.images.map((im) => (
              <figure key={im.src} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                <a href={`${import.meta.env.BASE_URL}${im.src}`} target="_blank" rel="noreferrer">
                  <img src={`${import.meta.env.BASE_URL}${im.src}`} alt={im.alt} loading="lazy" className="w-full rounded" />
                </a>
                <figcaption className="mt-2 text-xs">
                  {im.caption}
                  <SourceNote sources={im.sources} />
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        {(p.steps?.length ?? 0) > 0 && steps.length === 0 && <p className={ui.muted}>No steps for this revision.</p>}

        {p.links && p.links.length > 0 && (
          <div>
            <div className="mb-1 font-semibold">See also</div>
            <ul className="list-disc space-y-1 pl-5">
              {p.links.map((l) => (
                <li key={linkTarget(l)}>
                  <Link className={ui.link} to={linkTarget(l)}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {p.todo && p.todo.length > 0 && (
          <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 p-3 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
            <div className="font-semibold">Still needed</div>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {p.todo.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Disclosure>
  )
}
