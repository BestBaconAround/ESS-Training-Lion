import { Link } from 'react-router-dom'
import { PageHeader, ui } from '../components/ui'
import { TOPICS } from '../content/topics'

/** One place for the background knowledge pages, so the top menu stays short. */
export default function KnowledgePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Learn more" lead="Background knowledge: electricity, solar panels, codes and competitors." />
      <div className="grid gap-4 sm:grid-cols-2">
        {TOPICS.map((t) => (
          <Link key={t.id} to={`/${t.id}`} className={`${ui.card} block p-4 no-underline hover:border-slate-400 dark:hover:border-slate-600`}>
            <div className="font-semibold">{t.title}</div>
            <p className={`mt-1 text-sm ${ui.muted}`}>{t.lead}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
