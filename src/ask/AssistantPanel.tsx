import { useState } from 'react'
import { HistoryProvider, useHistory } from '../history/HistoryContext'
import HistoryTab from '../history/HistoryTab'
import { ui } from '../components/ui'
import type { RevisionChoice } from '../troubleshooting/filter'
import AskPanel from './AskPanel'
import CallNotes from './CallNotes'

type Tab = 'ask' | 'notes' | 'history'

const TABS: { id: Tab; label: string }[] = [
  { id: 'ask', label: 'Ask' },
  { id: 'notes', label: 'Call notes' },
  { id: 'history', label: 'History' },
]

/** Ask, Call notes and the locked History share one unlock: while History is unlocked, chats are saved to it. */
export default function AssistantPanel({ onOpenEntry, rev }: { onOpenEntry: (entryId: string) => void; rev: RevisionChoice }) {
  return (
    <HistoryProvider>
      <Panel onOpenEntry={onOpenEntry} rev={rev} />
    </HistoryProvider>
  )
}

function Panel({ onOpenEntry, rev }: { onOpenEntry: (entryId: string) => void; rev: RevisionChoice }) {
  const [tab, setTab] = useState<Tab>('ask')
  const history = useHistory()
  const unlocked = history.status === 'unlocked'
  return (
    <section aria-label="Assistant" className={`${ui.card} p-4 sm:p-5`} onPointerDown={history.touch} onKeyDown={history.touch}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2>Assistant</h2>
        <div role="tablist" aria-label="Assistant" className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1 text-sm font-medium ${
                tab === t.id ? 'bg-white shadow-sm dark:bg-slate-950' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {t.label}
              {t.id === 'history' && (
                <>
                  <span aria-hidden> {unlocked ? '\u{1F513}' : '\u{1F512}'}</span>
                  <span className="sr-only">{unlocked ? ' (unlocked)' : ' (locked)'}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
      {/* All panels stay mounted so a typed question or note is not lost when you switch tabs. */}
      <div className="mt-4">
        <div role="tabpanel" id="panel-ask" aria-labelledby="tab-ask" hidden={tab !== 'ask'}>
          <AskPanel onOpenEntry={onOpenEntry} rev={rev} />
        </div>
        <div role="tabpanel" id="panel-notes" aria-labelledby="tab-notes" hidden={tab !== 'notes'}>
          <CallNotes onOpenEntry={onOpenEntry} />
        </div>
        <div role="tabpanel" id="panel-history" aria-labelledby="tab-history" hidden={tab !== 'history'}>
          <HistoryTab />
        </div>
      </div>
    </section>
  )
}
