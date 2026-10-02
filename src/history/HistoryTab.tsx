import { useState, type FormEvent } from 'react'
import { Chevron, ui } from '../components/ui'
import { MIN_PASSPHRASE } from './vault'
import { useHistory } from './HistoryContext'
import type { HistoryEntry } from './types'

const input = ui.input
const primary = ui.primary
const secondary = ui.ghost

const when = (at: number) => new Date(at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

export default function HistoryTab() {
  const h = useHistory()
  if (h.status === 'none') return <Create />
  if (h.status === 'locked') return <Locked />
  return <Unlocked />
}

function Notice() {
  return (
    <details className="group text-xs">
      <summary className={`inline-flex cursor-pointer items-center gap-1 ${ui.muted}`}>
        <Chevron className="h-3 w-3" />
        How privacy works
      </summary>
      <ul className={`mt-2 list-disc space-y-1 pl-8 ${ui.muted}`}>
        <li>History is encrypted with your passphrase and stored only in this browser on this device. Nothing is sent anywhere.</li>
        <li>There is no account and no recovery. If you forget the passphrase, the history cannot be opened and has to be erased.</li>
        <li>It does not sync between browsers or devices. Clearing this site&apos;s data deletes it.</li>
        <li>It locks when you leave this page, when you press Lock, and after 15 minutes of inactivity.</li>
      </ul>
    </details>
  )
}

function Create() {
  const h = useHistory()
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(await h.create(pass, confirm))
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="font-semibold">Set up private history</h3>
      <p className="text-sm">Choose a passphrase to keep a record of your chats and call notes. Only someone with the passphrase can read them.</p>
      <Notice />
      <label className="block text-sm font-medium" htmlFor="hist-new">
        Passphrase (at least {MIN_PASSPHRASE} characters; a few words is best)
      </label>
      <input id="hist-new" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} className={input} />
      <label className="block text-sm font-medium" htmlFor="hist-confirm">
        Type it again
      </label>
      <input id="hist-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
      {error && (
        <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || !pass || !confirm} className={primary}>
        {busy ? 'Creating...' : 'Create private history'}
      </button>
    </form>
  )
}

function Locked() {
  const h = useHistory()
  const [pass, setPass] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmErase, setConfirmErase] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const err = await h.unlock(pass)
    setBusy(false)
    if (err) {
      setError(err)
      setPass('')
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">History is locked</h3>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="hist-pass">
          Passphrase
        </label>
        <input id="hist-pass" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} className={input} />
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy || !pass} className={primary}>
          {busy ? 'Unlocking...' : 'Unlock'}
        </button>
      </form>
      <Notice />
      <div className="text-xs">
        {!confirmErase ? (
          <button type="button" onClick={() => setConfirmErase(true)} className="text-red-700 underline dark:text-red-400">
            Forgot the passphrase? Erase the history
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
            <p>This permanently deletes the saved history on this device. It cannot be undone.</p>
            <div className="flex gap-2">
              <button type="button" onClick={h.erase} className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800">
                Erase everything
              </button>
              <button type="button" onClick={() => setConfirmErase(false)} className={secondary}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Unlocked() {
  const h = useHistory()
  const [confirmErase, setConfirmErase] = useState(false)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Private history</h3>
        <div className="flex gap-2">
          <button type="button" onClick={h.lock} className={secondary}>
            Lock now
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Unlocked. New questions in the Ask tab are saved here automatically. Call notes are saved when you press Save. It locks again after 15 minutes of inactivity or
        when you leave this page.
      </p>
      {h.saveError && (
        <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {h.saveError}
        </p>
      )}
      {h.entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
          Nothing saved yet. Ask a question in the Ask tab, or save your call notes.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Saved history">
          {h.entries.map((e) => (
            <Entry key={e.id} entry={e} onDelete={() => h.remove(e.id)} />
          ))}
        </ul>
      )}
      <div className="border-t border-slate-200 pt-3 text-xs dark:border-slate-800">
        {!confirmErase ? (
          <button type="button" onClick={() => setConfirmErase(true)} className="text-red-700 underline dark:text-red-400">
            Erase all history...
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
            <p>This permanently deletes all saved history and the passphrase setup on this device. It cannot be undone.</p>
            <div className="flex gap-2">
              <button type="button" onClick={h.erase} className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800">
                Erase everything
              </button>
              <button type="button" onClick={() => setConfirmErase(false)} className={secondary}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Entry({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  const title = entry.kind === 'ask' ? entry.question : entry.text.split('\n')[0].slice(0, 90) || 'Call notes'
  return (
    <li>
      <details className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-3 text-sm">
          <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {entry.kind === 'ask' ? 'Question' : 'Call notes'}
          </span>
          <span className="font-medium">{title}</span>
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{when(entry.at)}</span>
        </summary>
        <div className="space-y-2 border-t border-slate-100 p-3 text-sm dark:border-slate-800">
          {entry.kind === 'ask' ? (
            entry.answer ? (
              <>
                <div className="font-semibold">{entry.answer.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{entry.answer.where}</div>
                <ul className="list-disc space-y-2 pl-5">
                  {entry.answer.lines.map((l, i) => (
                    <li key={i}>
                      {l.text}
                      <span className="block text-xs text-slate-500 dark:text-slate-400">Source: {l.sources}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>No match was found in the reference material.</p>
            )
          ) : (
            <>
              <p className="whitespace-pre-wrap">{entry.text}</p>
              {entry.ideas.length > 0 && (
                <div>
                  <div className="text-xs font-semibold">Ideas shown at the time</div>
                  <ul className="list-disc pl-5 text-xs">
                    {entry.ideas.map((i, k) => (
                      <li key={k}>{i.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <button type="button" onClick={onDelete} className="text-xs text-red-700 underline dark:text-red-400">
            Delete this entry
          </button>
        </div>
      </details>
    </li>
  )
}
