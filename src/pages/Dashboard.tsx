import { Link } from 'react-router-dom'
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
      <section aria-label="On a call" className="space-y-3">
        <h2 className="text-lg font-semibold">On a call</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/troubleshooting', title: 'Troubleshooting', note: 'Ask a question, or find the steps and fault codes.' },
            { to: '/procedures', title: 'Procedures', note: 'Step by step: Wi-Fi, TOU, generator, RMA and more.' },
            { to: '/homeowner', title: 'Homeowner messages', note: 'Simple words to copy and send.' },
            { to: '/reference', title: 'Reference', note: 'Look up a number, a code or a setting.' },
          ].map((x) => (
            <Link key={x.to} to={x.to} className={`${ui.card} block p-4 no-underline hover:border-slate-400 dark:hover:border-slate-600`}>
              <div className="font-semibold">{x.title}</div>
              <p className={`mt-1 text-sm ${ui.muted}`}>{x.note}</p>
            </Link>
          ))}
        </div>
      </section>
      <h2 className="text-lg font-semibold">Training modules</h2>
      <section className="grid gap-4 sm:grid-cols-2" aria-label="Modules">
        {modules.map((m, i) => (
          <ModuleCard key={m.id} module={m} summary={summaries[i]} />
        ))}
      </section>
    </div>
  )
}
