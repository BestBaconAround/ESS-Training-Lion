import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import SourceNote, { RevisionBadge } from '../components/SourceNote'
import { Disclosure, PageHeader, ui } from '../components/ui'
import { TOPICS, type Topic } from '../content/topics'

/** A knowledge page (electricity, solar, codes, competitors). Sourced facts in folding sections, then what is still needed. */
export default function TopicPage({ topicId }: { topicId?: string }) {
  const params = useParams()
  const id = topicId ?? params.topicId
  const topic: Topic | undefined = useMemo(() => TOPICS.find((t) => t.id === id), [id])
  if (!topic) return <p>That page does not exist.</p>
  return (
    <div className="space-y-6">
      <PageHeader title={topic.title} lead={topic.lead} />

      {topic.sections.length > 0 && (
        <div className="space-y-3">
          {topic.sections.map((s, i) => (
            <Disclosure key={s.title} title={<span className="font-semibold">{s.title}</span>} right={<span className={`text-xs ${ui.muted}`}>{s.facts.length}</span>} defaultOpen={i === 0}>
              <ul className="list-disc space-y-3 pl-5 text-sm">
                {s.facts.map((f, j) => (
                  <li key={j}>
                    <RevisionBadge revisions={f.revisions} />
                    {f.text}
                    <SourceNote sources={f.sources} />
                  </li>
                ))}
              </ul>
            </Disclosure>
          ))}
        </div>
      )}

      {topic.links?.map((g) => (
        <Disclosure key={g.title} title={<span className="font-semibold">{g.title}</span>} right={<span className={`text-xs ${ui.muted}`}>{g.items.length}</span>} defaultOpen>
          <ul className="space-y-3 text-sm">
            {g.items.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer" className={ui.link}>
                  {l.label}
                </a>
                <div className={`text-xs ${ui.muted}`}>{l.note}</div>
              </li>
            ))}
          </ul>
        </Disclosure>
      ))}

      <section className="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
        <h2 className="text-base">Still needed</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {topic.needed.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
