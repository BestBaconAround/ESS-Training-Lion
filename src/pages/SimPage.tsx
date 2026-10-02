import { Link, useParams } from 'react-router-dom'
import { getModule } from '../content'
import { simRegistry } from '../sims-ui/registry'

export default function SimPage() {
  const { moduleId = '' } = useParams()
  const module = getModule(moduleId)
  if (!module) {
    return (
      <div>
        <p>Module not found.</p>
        <Link className="text-sky-700 underline hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300" to="/">
          Back to dashboard
        </Link>
      </div>
    )
  }
  const Sim = simRegistry[module.sim.kind]
  return (
    <div className="space-y-5">
      <Link className="text-sm text-sky-700 hover:underline dark:text-sky-400" to={`/module/${module.id}`}>
        &larr; Module {module.number}: {module.title}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">{module.sim.title}</h1>
      {Sim ? <Sim module={module} /> : <p className="text-slate-600 dark:text-slate-400">This simulator is not built yet.</p>}
    </div>
  )
}
