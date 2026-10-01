import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { sourceText } from '../content/labels'
import SourceNote, { RevisionBadge } from '../components/SourceNote'
import type { RevisionChoice } from '../troubleshooting/filter'
import { buildCorpus, type Chunk } from './corpus'
import { SearchIndex, type Hit } from './search'

const SUGGESTIONS = ["My battery won't address", 'A2_10', 'App cannot connect', 'No light on the inverter', 'Grid over voltage', 'Which pins are the CTs on?']

type Message =
  | { id: number; from: 'user'; text: string }
  | { id: number; from: 'bot'; text: string; hits?: Hit[] }

let index: SearchIndex | null = null
const getIndex = () => (index ??= new SearchIndex(buildCorpus()))

const appliesTo = (revisions: 'all' | readonly string[], rev: RevisionChoice) => rev === 'all' || revisions === 'all' || revisions.includes(rev)

export default function AskPanel({ onOpenEntry, rev }: { onOpenEntry: (entryId: string) => void; rev: RevisionChoice }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: 'bot',
      text: 'Ask me about a battery, inverter or power problem. I answer only from the reference material in this app (troubleshooting entries, lessons and your notes), and I show where each answer comes from. If it is not in there, I will say so.',
    },
  ])
  const [input, setInput] = useState('')
  const nextId = useRef(1)

  const ask = (question: string) => {
    const q = question.trim()
    if (!q) return
    const hits = getIndex().search(q, 3)
    const reply: Message =
      hits.length > 0
        ? { id: nextId.current + 1, from: 'bot', text: 'Here is what the reference material says.', hits }
        : {
            id: nextId.current + 1,
            from: 'bot',
            text: 'I could not find that in the reference material. Try different words: a fault code, a symptom, or a part name. If it should be covered, it needs to be added to the notes.',
          }
    setMessages((m) => [...m, { id: nextId.current, from: 'user', text: q }, reply])
    nextId.current += 2
    setInput('')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    ask(input)
  }

  return (
    <section aria-label="Ask the notes" className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-semibold">Ask the notes</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        This searches the reference material. It does not use AI to write answers, so it cannot make anything up.
      </p>

      <div className="mt-3 max-h-[28rem] space-y-3 overflow-y-auto pr-1" role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((m) =>
          m.from === 'user' ? (
            <div key={m.id} className="ml-auto max-w-[85%] rounded-xl bg-slate-900 px-3 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900">
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="max-w-full space-y-2 rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
              <p>{m.text}</p>
              {m.hits && <Answer hits={m.hits} rev={rev} onOpenEntry={onOpenEntry} />}
            </div>
          ),
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Example questions">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="ask-input">
          Your question
        </label>
        <input
          id="ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question, e.g. battery reads 0 volts"
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          Ask
        </button>
      </form>
    </section>
  )
}

function OpenLink({ chunk, onOpenEntry }: { chunk: Chunk; onOpenEntry: (id: string) => void }) {
  if (chunk.link.type === 'entry') {
    const id = chunk.link.entryId
    return (
      <button type="button" onClick={() => onOpenEntry(id)} className="text-amber-700 underline dark:text-amber-400">
        Open the full entry
      </button>
    )
  }
  if (chunk.link.type === 'lesson') {
    return (
      <Link to={`/module/${chunk.link.moduleId}/lesson/${chunk.link.lessonId}`} className="text-amber-700 underline dark:text-amber-400">
        Open the lesson
      </Link>
    )
  }
  return null
}

function Answer({ hits, rev, onOpenEntry }: { hits: Hit[]; rev: RevisionChoice; onOpenEntry: (id: string) => void }) {
  const [best, ...others] = hits
  const lines = best.chunk.lines.filter((l) => appliesTo(l.revisions, rev)).slice(0, 8)
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="font-semibold">{best.chunk.title}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{best.chunk.where}</div>
        {lines.length > 0 ? (
          <ul className="mt-2 list-disc space-y-2 pl-5">
            {lines.map((l, i) => (
              <li key={i}>
                <RevisionBadge revisions={l.revisions} />
                {l.text}
                <SourceNote sources={l.sources} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs">Nothing in this passage applies to the revision you chose.</p>
        )}
        {best.chunk.lines.length > lines.length && lines.length > 0 && <p className="mt-1 text-xs text-slate-500">More in the full passage.</p>}
        <p className="mt-2 text-xs">
          <OpenLink chunk={best.chunk} onOpenEntry={onOpenEntry} />
        </p>
      </div>
      {others.length > 0 && (
        <div className="text-xs">
          <span className="font-semibold">Also relevant: </span>
          {others.map((h, i) => (
            <span key={h.chunk.id}>
              {i > 0 && ' · '}
              {h.chunk.link.type === 'entry' ? (
                <button type="button" onClick={() => onOpenEntry((h.chunk.link as { entryId: string }).entryId)} className="text-amber-700 underline dark:text-amber-400">
                  {h.chunk.title}
                </button>
              ) : h.chunk.link.type === 'lesson' ? (
                <Link to={`/module/${h.chunk.link.moduleId}/lesson/${h.chunk.link.lessonId}`} className="text-amber-700 underline dark:text-amber-400">
                  {h.chunk.title}
                </Link>
              ) : (
                <span>{h.chunk.title}</span>
              )}
            </span>
          ))}
        </div>
      )}
      <p className="sr-only">{best.chunk.lines.map((l) => l.sources.map(sourceText).join('; ')).join(' ')}</p>
    </div>
  )
}
