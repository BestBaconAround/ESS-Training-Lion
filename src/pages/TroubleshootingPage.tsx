import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getModule } from '../content'
import { FAULT_FOOTNOTE } from '../content/data/faults'
import { REVISION_LABELS, sourceText } from '../content/labels'
import { AREA_LABELS, ESCALATION, TROUBLESHOOTING, type TroubleshootingArea, type TroubleshootingEntry } from '../content/troubleshooting'
import RevisionSelect from '../components/RevisionSelect'
import SourceNote, { RevisionBadge } from '../components/SourceNote'
import { Disclosure, PageHeader, ui } from '../components/ui'
import AssistantPanel from '../ask/AssistantPanel'
import { filterEntries, stepsFor, type RevisionChoice } from '../troubleshooting/filter'

const AREAS = Object.keys(AREA_LABELS) as TroubleshootingArea[]
const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm font-medium ${
    active
      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
      : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export default function TroubleshootingPage() {
  const [area, setArea] = useState<TroubleshootingArea | 'all'>('all')
  const [query, setQuery] = useState('')
  const [rev, setRev] = useState<RevisionChoice>('all')
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [scrollTo, setScrollTo] = useState<string | null>(null)
  const entries = useMemo(() => filterEntries(TROUBLESHOOTING, area, query), [area, query])
  const count = (a: TroubleshootingArea | 'all') => filterEntries(TROUBLESHOOTING, a, query).length

  // From the chat: show the whole list, open that entry and scroll to it.
  const openEntry = (id: string) => {
    setArea('all')
    setQuery('')
    setOpenIds((s) => new Set(s).add(id))
    setScrollTo(id)
  }
  useEffect(() => {
    if (!scrollTo) return
    document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setScrollTo(null)
  }, [scrollTo, entries])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Troubleshooting"
        lead="Steps for battery, inverter and power problems, from the manuals, the commissioning video and the course author. Every step shows its source."
      />

      <Disclosure title={<span className="font-semibold">When you cannot fix it on the call</span>} className="border-amber-300 dark:border-amber-800/70">
        <div className="space-y-1 text-sm">
          <p>{ESCALATION.text}</p>
          <p>{ESCALATION.rule}</p>
          <p className={`text-xs ${ui.muted}`}>Source: {[...ESCALATION.sources, ...ESCALATION.ruleSources].map(sourceText).join('; ')}</p>
        </div>
      </Disclosure>

      <AssistantPanel onOpenEntry={openEntry} rev={rev} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Area">
          <button className={chip(area === 'all')} aria-pressed={area === 'all'} onClick={() => setArea('all')}>
            All ({count('all')})
          </button>
          {AREAS.map((a) => (
            <button key={a} className={chip(area === a)} aria-pressed={area === a} onClick={() => setArea(a)}>
              {AREA_LABELS[a]} ({count(a)})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="ts-search">
            Search troubleshooting
          </label>
          <input
            id="ts-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search, e.g. A2_10, no light, 51 V, app offline"
            className={`${ui.input} max-w-md flex-1`}
          />
          <RevisionSelect value={rev} onChange={setRev} />
        </div>
      </div>

      {entries.length === 0 ? (
        <p className={`${ui.card} border-dashed p-4 text-sm ${ui.muted}`}>
          Nothing matches. Try fewer words, or clear the area filter.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Troubleshooting entries">
          {entries.map((e) => (
            <Entry
              key={e.id}
              entry={e}
              rev={rev}
              open={openIds.has(e.id)}
              onToggle={(isOpen) =>
                setOpenIds((s) => {
                  const next = new Set(s)
                  if (isOpen) next.add(e.id)
                  else next.delete(e.id)
                  return next
                })
              }
            />
          ))}
        </ul>
      )}

      <p className={`text-xs ${ui.muted}`}>Fault code table note: {FAULT_FOOTNOTE}</p>
    </div>
  )
}

function Entry({ entry, rev, open, onToggle }: { entry: TroubleshootingEntry; rev: RevisionChoice; open: boolean; onToggle: (open: boolean) => void }) {
  const steps = stepsFor(entry, rev)
  return (
    <li>
      <Disclosure
        id={entry.id}
        open={open}
        onToggle={onToggle}
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{AREA_LABELS[entry.area]}</span>
            <span>{entry.title}</span>
          </span>
        }
      >
        <div className="space-y-3">
          {entry.customerSays && <p className="border-l-4 border-amber-400 pl-3 italic">&ldquo;{entry.customerSays}&rdquo;</p>}
          {entry.description && <p className="text-sm">{entry.description}</p>}
          {steps.length > 0 ? (
            entry.ordered === false ? (
              <ul className="list-disc space-y-3 pl-5">
                {steps.map((s, i) => (
                  <li key={i}>
                    <RevisionBadge revisions={s.revisions} />
                    {s.text}
                    <SourceNote sources={s.sources} />
                  </li>
                ))}
              </ul>
            ) : (
              <ol className="list-decimal space-y-3 pl-5">
                {steps.map((s, i) => (
                  <li key={i}>
                    <RevisionBadge revisions={s.revisions} />
                    {s.text}
                    <SourceNote sources={s.sources} />
                  </li>
                ))}
              </ol>
            )
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">No steps for {rev === 'all' ? 'this entry' : REVISION_LABELS[rev]} yet.</p>
          )}
          {entry.todo?.map((t, i) => (
            <p key={i} className="rounded-lg border border-dashed border-amber-400 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
              <span className="font-semibold">TODO: </span>
              {t}
            </p>
          ))}
          {entry.related && entry.related.length > 0 && (
            <p className="text-sm">
              <span className="font-semibold">Background: </span>
              {entry.related.map((r, i) => {
                const lesson = getModule(r.moduleId)?.lessons.find((l) => l.id === r.lessonId)
                return (
                  <span key={r.lessonId}>
                    {i > 0 && ', '}
                    <Link className="text-sky-700 underline hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300" to={`/module/${r.moduleId}/lesson/${r.lessonId}`}>
                      {lesson?.title ?? r.lessonId}
                    </Link>
                  </span>
                )
              })}
            </p>
          )}
        </div>
      </Disclosure>
    </li>
  )
}
