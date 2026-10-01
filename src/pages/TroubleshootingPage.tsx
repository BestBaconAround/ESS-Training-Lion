import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getModule } from '../content'
import { FAULT_FOOTNOTE } from '../content/data/faults'
import { REVISIONS, REVISION_LABELS, sourceText } from '../content/labels'
import { AREA_LABELS, ESCALATION, TROUBLESHOOTING, type TroubleshootingArea, type TroubleshootingEntry } from '../content/troubleshooting'
import SourceNote, { RevisionBadge } from '../components/SourceNote'
import { filterEntries, stepsFor, type RevisionChoice } from '../troubleshooting/filter'

const AREAS = Object.keys(AREA_LABELS) as TroubleshootingArea[]
const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm font-medium ${
    active
      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
      : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export default function TroubleshootingPage() {
  const [area, setArea] = useState<TroubleshootingArea | 'all'>('all')
  const [query, setQuery] = useState('')
  const [rev, setRev] = useState<RevisionChoice>('all')
  const entries = useMemo(() => filterEntries(TROUBLESHOOTING, area, query), [area, query])
  const count = (a: TroubleshootingArea | 'all') => filterEntries(TROUBLESHOOTING, a, query).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Troubleshooting</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Steps for battery, inverter and power problems, taken from the manuals, the EMS-C manual, the commissioning video and the course author. Every step shows
          its source.
        </p>
      </div>

      <aside className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        <div className="font-semibold">When you cannot fix it on the call</div>
        <p className="mt-1">{ESCALATION.text}</p>
        <p className="mt-1">{ESCALATION.rule}</p>
        <p className="mt-1 text-xs opacity-80">Source: {[...ESCALATION.sources, ...ESCALATION.ruleSources].map(sourceText).join('; ')}</p>
      </aside>

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
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="font-medium">Search</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="A2_10, no light, 51 V, app offline..."
              className="w-72 max-w-full rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="font-medium">Revision</span>
            <select
              value={rev}
              onChange={(e) => setRev(e.target.value as RevisionChoice)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="all">All revisions</option>
              {REVISIONS.map((r) => (
                <option key={r} value={r}>
                  {REVISION_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-4 text-slate-600 dark:border-slate-700 dark:text-slate-400">
          Nothing matches. Try fewer words, or clear the area filter.
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Troubleshooting entries">
          {entries.map((e) => (
            <Entry key={e.id} entry={e} rev={rev} />
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">Fault code table note: {FAULT_FOOTNOTE}</p>
    </div>
  )
}

function Entry({ entry, rev }: { entry: TroubleshootingEntry; rev: RevisionChoice }) {
  const steps = stepsFor(entry, rev)
  return (
    <li>
      <details className="group rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-4 font-medium">
          <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {AREA_LABELS[entry.area]}
          </span>
          <span>{entry.title}</span>
        </summary>
        <div className="space-y-3 border-t border-slate-100 p-4 dark:border-slate-800">
          {entry.customerSays && <p className="border-l-4 border-amber-400 pl-3 italic">&ldquo;{entry.customerSays}&rdquo;</p>}
          {entry.description && <p className="text-sm">{entry.description}</p>}
          {steps.length > 0 ? (
            <ol className="list-decimal space-y-3 pl-5">
              {steps.map((s, i) => (
                <li key={i}>
                  <RevisionBadge revisions={s.revisions} />
                  {s.text}
                  <SourceNote sources={s.sources} />
                </li>
              ))}
            </ol>
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
                    <Link className="text-amber-700 underline dark:text-amber-400" to={`/module/${r.moduleId}/lesson/${r.lessonId}`}>
                      {lesson?.title ?? r.lessonId}
                    </Link>
                  </span>
                )
              })}
            </p>
          )}
        </div>
      </details>
    </li>
  )
}
