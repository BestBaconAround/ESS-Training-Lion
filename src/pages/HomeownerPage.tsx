import { useState } from 'react'
import SourceNote, { RevisionBadge } from '../components/SourceNote'
import { PageHeader, ui } from '../components/ui'
import { HOMEOWNER_MESSAGES } from '../content/homeowner'

/** Copy text. Falls back to a hidden textarea where the clipboard API is blocked. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle')
  const click = async () => {
    setState((await copyText(text)) ? 'done' : 'failed')
    window.setTimeout(() => setState('idle'), 2000)
  }
  return (
    <button type="button" className={ui.primary} onClick={click}>
      {state === 'done' ? 'Copied' : state === 'failed' ? 'Could not copy: select the text' : 'Copy message'}
    </button>
  )
}

/** Plain-language messages to paste to homeowners. Short sentences, no technical words, big readable text. */
export default function HomeownerPage() {
  const groups = Array.from(new Set(HOMEOWNER_MESSAGES.map((m) => m.group)))
  return (
    <div className="space-y-8">
      <PageHeader
        title="Messages for homeowners"
        lead="Copy a message and paste it into a text, email or chat. Each one is short and uses everyday words. The sources and gaps are for you, and are not copied."
      />
      {groups.map((g) => (
        <section key={g} className="space-y-4">
          <h2 className="text-lg font-semibold">{g}</h2>
          {HOMEOWNER_MESSAGES.filter((m) => m.group === g).map((m) => (
            <article key={m.id} className={`${ui.card} space-y-3 p-4`}>
              <div>
                <h3 className="text-base font-semibold">{m.title}</h3>
                <p className={`text-sm ${ui.muted}`}>Customer says: {m.customerSays}</p>
              </div>
              <div className="whitespace-pre-line rounded-lg bg-slate-50 p-4 text-base leading-relaxed dark:bg-slate-950">{m.text}</div>
              <div className="flex flex-wrap items-center gap-3">
                <CopyButton text={m.text} />
                <RevisionBadge revisions={m.revisions} />
              </div>
              <div className="text-xs">
                <SourceNote sources={m.sources} />
              </div>
              {m.todo && m.todo.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-xs text-amber-800 dark:text-amber-300">
                  {m.todo.map((t) => (
                    <li key={t}>Still needed: {t}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      ))}
    </div>
  )
}
