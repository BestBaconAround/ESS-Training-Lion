import { modules } from '../content'
import ModuleCard from '../components/ModuleCard'
import ProgressBar from '../components/ProgressBar'
import { PageHeader, ui } from '../components/ui'
import { summarize } from '../progress/logic'
import { useProgress } from '../progress/store'

export default function Dashboard() {
  const progress = useProgress()
  const summaries = modules.map((m) => summarize(m, progress))
  const ready = modules.filter((m) => m.status === 'ready')
  const readyPercents = modules.flatMap((m, i) => (m.status === 'ready' ? [summaries[i].percent] : []))
  const overall = readyPercents.length ? Math.round(readyPercents.reduce((a, b) => a + b, 0) / readyPercents.length) : 0

  return (
    <div className="space-y-8">
      <section className={`${ui.card} p-5 sm:p-6`}>
        <PageHeader
          title="Sanctuary 2 support training"
          lead="Seven modules. Each has short lessons, a scored quiz and a simulator you can repeat."
          right={
            <div className="w-full sm:w-64">
              <ProgressBar percent={overall} label={`Overall ${overall}% across ${ready.length} available ${ready.length === 1 ? 'module' : 'modules'}`} />
            </div>
          }
        />
      </section>
      <section className="grid gap-4 sm:grid-cols-2" aria-label="Modules">
        {modules.map((m, i) => (
          <ModuleCard key={m.id} module={m} summary={summaries[i]} />
        ))}
      </section>
    </div>
  )
}
