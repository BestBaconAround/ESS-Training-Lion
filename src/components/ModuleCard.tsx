import { Link } from 'react-router-dom'
import type { Module } from '../content/types'
import type { ModuleSummary } from '../progress/logic'
import ProgressBar from './ProgressBar'

export default function ModuleCard({ module, summary }: { module: Module; summary: ModuleSummary }) {
  const ready = module.status === 'ready'
  return (
    <Link
      to={`/module/${module.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-400 hover:shadow dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            {module.number}
          </span>
          <h2 className="text-base font-semibold leading-snug">{module.title}</h2>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            ready
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {ready ? 'Ready' : 'Coming soon'}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{module.summary}</p>
      <div className="mt-4">
        {ready ? (
          <>
            <ProgressBar percent={summary.percent} label={`${summary.percent}% complete`} />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Lessons {summary.lessonsDone}/{summary.lessonsTotal}
              </span>
              <span>Quiz best {summary.quizBest === null ? '-' : `${Math.round(summary.quizBest * 100)}%`}</span>
              <span>
                Sim best {summary.simBest === null ? '-' : `${summary.simBest}%`} ({summary.simAttempts} tries)
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {module.outline.length} planned topics. Open to see the outline.
          </p>
        )}
      </div>
    </Link>
  )
}
