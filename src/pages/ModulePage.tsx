import { Link, useParams } from 'react-router-dom'
import { getModule } from '../content'
import { sourceText } from '../content/labels'
import { getModuleProgress, summarize } from '../progress/logic'
import { useProgress } from '../progress/store'
import ProgressBar from '../components/ProgressBar'

const card = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'

export default function ModulePage() {
  const { moduleId = '' } = useParams()
  const progress = useProgress()
  const module = getModule(moduleId)

  if (!module) {
    return (
      <div>
        <p>Module not found.</p>
        <Link className="text-amber-700 underline dark:text-amber-400" to="/">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const summary = summarize(module, progress)
  const mp = getModuleProgress(progress, module.id)

  return (
    <div className="space-y-6">
      <div>
        <Link className="text-sm text-amber-700 hover:underline dark:text-amber-400" to="/">
          &larr; Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Module {module.number}: {module.title}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{module.summary}</p>
      </div>

      {module.status === 'coming-soon' ? (
        <>
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>Coming soon.</strong> This module is not built yet. Here is what it will cover.
          </div>
          <section className={card}>
            <h2 className="font-semibold">Planned outline</h2>
            <ul className="mt-3 space-y-3">
              {module.outline.map((o, i) => (
                <li key={i} className="text-sm">
                  <div>{o.text}</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Source: {o.sources.map(sourceText).join('; ')}
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className={card}>
            <h2 className="font-semibold">Planned simulator: {module.sim.title}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{module.sim.intro}</p>
          </section>
        </>
      ) : (
        <>
          <ProgressBar percent={summary.percent} label={`${summary.percent}% complete`} />

          <section className={card}>
            <h2 className="font-semibold">Lessons</h2>
            <ol className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {module.lessons.map((l, i) => {
                const done = mp.lessonsDone.includes(l.id)
                return (
                  <li key={l.id}>
                    <Link
                      to={`/module/${module.id}/lesson/${l.id}`}
                      className="flex items-start gap-3 py-3 hover:text-amber-700 dark:hover:text-amber-400"
                    >
                      <span
                        aria-hidden
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                          done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {done ? '✓' : ''}
                      </span>
                      <span>
                        <span className="font-medium">
                          {i + 1}. {l.title}
                        </span>
                        <span className="block text-sm text-slate-600 dark:text-slate-400">{l.summary}</span>
                        <span className="sr-only">{done ? 'Completed' : 'Not completed'}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className={card}>
              <h2 className="font-semibold">Quiz</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {module.quiz?.questions.length} questions. Pass mark {Math.round((module.quiz?.passMark ?? 0) * 100)}%.
                Best: {summary.quizBest === null ? 'not taken' : `${Math.round(summary.quizBest * 100)}%`} (
                {summary.quizAttempts} {summary.quizAttempts === 1 ? 'attempt' : 'attempts'}).
              </p>
              <Link
                to={`/module/${module.id}/quiz`}
                className="mt-3 inline-block rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                {summary.quizAttempts ? 'Retake quiz' : 'Start quiz'}
              </Link>
            </section>
            <section className={card}>
              <h2 className="font-semibold">Simulator: {module.sim.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {module.sim.intro} Best: {summary.simBest === null ? 'not tried' : `${summary.simBest}%`} (
                {summary.simAttempts} {summary.simAttempts === 1 ? 'attempt' : 'attempts'}).
              </p>
              <Link
                to={`/module/${module.id}/sim`}
                className="mt-3 inline-block rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-amber-400"
              >
                {summary.simAttempts ? 'Run again' : 'Open simulator'}
              </Link>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
