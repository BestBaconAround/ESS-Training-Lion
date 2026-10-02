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

      {topic.sections.some((x) => x.fromWeb) && (
        <p className="rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100" role="note">
          <strong>Sections marked "From the web" are not Lion material.</strong> They come from public web pages found by search on 10/2/2026 and were read as search summaries, not
          the full pages. Open the source link and check it before you rely on it, especially codes, dates and numbers.
        </p>
      )}

      {topic.sections.length > 0 && (
        <div className="space-y-3">
          {topic.sections.map((s, i) => (
            <Disclosure key={s.title} title={
                <span className="font-semibold">
                  {s.title}
                  {s.fromWeb && <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 align-middle text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">From the web</span>}
                </span>
              } right={<span className={`text-xs ${ui.muted}`}>{s.facts.length}</span>} defaultOpen={i === 0}>
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
