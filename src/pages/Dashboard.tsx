import { modules } from '../content'
import ModuleCard from '../components/ModuleCard'
import ProgressBar from '../components/ProgressBar'
import { summarize } from '../progress/logic'
import { useProgress } from '../progress/store'

export default function Dashboard() {
  const progress = useProgress()
  const summaries = modules.map((m) => summarize(m, progress))
  const ready = modules.filter((m) => m.status === 'ready')
  const readyPercents = modules.flatMap((m, i) => (m.status === 'ready' ? [summaries[i].percent] : []))
  const overall = readyPercents.length ? Math.round(readyPercents.reduce((a, b) => a + b, 0) / readyPercents.length) : 0

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Sanctuary 2 support training</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Seven modules. Each has short lessons, a scored quiz, and a simulator you can repeat.
        </p>
        <div className="mt-4 max-w-md">
          <ProgressBar
            percent={overall}
            label={`Overall: ${overall}% across ${ready.length} available ${ready.length === 1 ? 'module' : 'modules'}`}
          />
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2" aria-label="Modules">
        {modules.map((m, i) => (
          <ModuleCard key={m.id} module={m} summary={summaries[i]} />
        ))}
      </section>
    </div>
  )
}
