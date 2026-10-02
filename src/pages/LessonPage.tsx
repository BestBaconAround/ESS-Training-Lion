import { Link, useParams } from 'react-router-dom'
import BlockRenderer from '../components/BlockRenderer'
import { getModule } from '../content'
import { getModuleProgress } from '../progress/logic'
import { progressActions, useProgress } from '../progress/store'

export default function LessonPage() {
  const { moduleId = '', lessonId = '' } = useParams()
  const progress = useProgress()
  const module = getModule(moduleId)
  const index = module?.lessons.findIndex((l) => l.id === lessonId) ?? -1
  const lesson = module && index >= 0 ? module.lessons[index] : undefined

  if (!module || !lesson) {
    return (
      <div>
        <p>Lesson not found.</p>
        <Link className="text-sky-700 underline hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300" to="/">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const done = getModuleProgress(progress, module.id).lessonsDone.includes(lesson.id)
  const prev = module.lessons[index - 1]
  const next = module.lessons[index + 1]
  const nav = 'rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'

  return (
    <article className="space-y-5">
      <div>
        <Link className="text-sm text-sky-700 hover:underline dark:text-sky-400" to={`/module/${module.id}`}>
          &larr; Module {module.number}: {module.title}
        </Link>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Lesson {index + 1} of {module.lessons.length}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{lesson.summary}</p>
      </div>

      {lesson.blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <button
          className={
            done
              ? 'rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400'
              : 'rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700'
          }
          aria-pressed={done}
          onClick={() =>
            done ? progressActions.unmarkLesson(module.id, lesson.id) : progressActions.markLessonDone(module.id, lesson.id)
          }
        >
          {done ? '✓ Completed (click to undo)' : 'Mark lesson complete'}
        </button>
        <div className="flex gap-2">
          {prev && (
            <Link className={nav} to={`/module/${module.id}/lesson/${prev.id}`}>
              &larr; Previous
            </Link>
          )}
          {next ? (
            <Link className={nav} to={`/module/${module.id}/lesson/${next.id}`}>
              Next &rarr;
            </Link>
          ) : (
            <Link className={nav} to={`/module/${module.id}/quiz`}>
              Take the quiz &rarr;
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
