import { useCallback, useEffect, useRef, useState } from 'react'
import { Disclosure, ui } from '../components/ui'
import {
  ALLOWED_EXTENSIONS,
  INBOX,
  MAX_FILES_PER_BATCH,
  MAX_FILE_BYTES,
  REPO,
  formatBytes,
  listInbox,
  uploadFile,
  validateFile,
  type InboxFile,
} from '../reference/upload'

const input = ui.input
const button = ui.primary
const UPLOAD_PAGE = `https://github.com/${REPO.owner}/${REPO.repo}/upload/${REPO.branch}/${INBOX}`

type Outcome = { name: string; ok: boolean; message: string }

/**
 * Lets the author add manuals and notes to the repo's reference-inbox folder, for Claude to read later and use to update
 * the app. The token is kept in memory only. The repo is public, so the screen says so before anything is sent.
 */
export default function AddFiles() {
  const [files, setFiles] = useState<File[]>([])
  const [token, setToken] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [busy, setBusy] = useState(false)
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [inbox, setInbox] = useState<InboxFile[] | null>(null)
  const [inboxError, setInboxError] = useState('')
  const picker = useRef<HTMLInputElement>(null)

  const refresh = useCallback(() => {
    setInboxError('')
    listInbox()
      .then(setInbox)
      .catch((e: Error) => {
        setInbox(null)
        setInboxError(e.message)
      })
  }, [])

  useEffect(refresh, [refresh])

  const problems = files.map((f) => validateFile(f))
  const tooMany = files.length > MAX_FILES_PER_BATCH
  const ready = files.length > 0 && !tooMany && problems.every((p) => p === null) && token.trim().length > 0 && understood && !busy

  const pick = (list: FileList | null) => {
    setOutcomes([])
    setFiles(list ? Array.from(list) : [])
  }

  const send = async () => {
    setBusy(true)
    setOutcomes([])
    const results: Outcome[] = []
    for (const f of files) {
      const r = await uploadFile(token.trim(), f)
      results.push({ name: f.name, ok: r.ok, message: r.ok ? `Added as ${r.path}` : r.error })
      setOutcomes([...results])
      if (!r.ok && /refused the token/.test(r.error)) break
    }
    setBusy(false)
    if (results.every((r) => r.ok)) {
      setFiles([])
      if (picker.current) picker.current.value = ''
    }
    refresh()
  }

  return (
    <Disclosure
      title={<span className="font-semibold">Add files for Claude to learn from</span>}
      right={
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">In development</span>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" role="note">
          <strong>Still in development and may not work.</strong> If an upload fails, add the file directly on GitHub instead:{' '}
          <a href={UPLOAD_PAGE} target="_blank" rel="noreferrer" className={ui.link}>
            open the inbox upload page
          </a>
          .
        </p>

        <p>
          Files go into the <code>{INBOX}</code> folder of the GitHub repo. In a later session, ask Claude to read the inbox and update the app.
          Nothing in the app changes by itself.
        </p>

        <p className="rounded-lg bg-red-50 p-3 text-red-900 dark:bg-red-900/30 dark:text-red-200" role="note">
          <strong>This repository is public.</strong> Anyone can read what you add. Do not add customer details, anything marked internal or
          confidential, or login links. If it should not be on the internet, do not add it here.
        </p>

        <div>
          <label className="font-medium" htmlFor="gh-token">
            GitHub token
          </label>
          <input
            id="gh-token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className={`${input} mt-1`}
            placeholder="github_pat_..."
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            A static website has no server, so it needs your own token to write to GitHub. Create a fine-grained token (GitHub, Settings,
            Developer settings, Personal access tokens) for only the <code>{REPO.repo}</code> repository, with Contents set to read and write and the
            shortest expiry. It is kept in this page's memory only, never saved, and sent only to api.github.com.
          </p>
        </div>

        <div>
          <label className="font-medium" htmlFor="gh-files">
            Files
          </label>
          <input
            id="gh-files"
            ref={picker}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
            onChange={(e) => pick(e.target.files)}
            className={`${input} mt-1`}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Up to {formatBytes(MAX_FILE_BYTES)} each and {MAX_FILES_PER_BATCH} at a time. Types: {ALLOWED_EXTENSIONS.join(', ')}. GitHub itself allows 25 MB in
            the browser and blocks files over 100 MB, so bigger files have to be compressed or split first.
          </p>
        </div>

        {files.length > 0 && (
          <ul className="space-y-1" aria-label="Selected files">
            {files.map((f, i) => (
              <li key={f.name + i} className={problems[i] ? 'text-red-700 dark:text-red-300' : ''}>
                {f.name} ({formatBytes(f.size)}){problems[i] ? `: ${problems[i]}` : ''}
              </li>
            ))}
            {tooMany && <li className="text-red-700 dark:text-red-300">Choose {MAX_FILES_PER_BATCH} files or fewer.</li>}
          </ul>
        )}

        <label className="flex items-start gap-2">
          <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-1" />
          <span>I understand everything I add here is public.</span>
        </label>

        <button type="button" className={button} disabled={!ready} onClick={send}>
          {busy ? 'Adding...' : files.length > 1 ? `Add ${files.length} files` : 'Add file'}
        </button>

        {outcomes.length > 0 && (
          <ul className="space-y-1" role="status" aria-label="Upload results">
            {outcomes.map((o, i) => (
              <li key={o.name + i} className={o.ok ? 'text-green-800 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                {o.name}: {o.message}
              </li>
            ))}
          </ul>
        )}

        <div>
          <div className="flex items-center gap-3">
            <h4 className="font-medium">Waiting in the inbox</h4>
            <button type="button" onClick={refresh} className={`text-xs ${ui.link}`}>
              Refresh
            </button>
          </div>
          {inboxError && <p className="text-xs text-red-700 dark:text-red-300">{inboxError}</p>}
          {inbox && inbox.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">Nothing yet.</p>}
          {inbox && inbox.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-xs">
              {inbox.map((f) => (
                <li key={f.name}>
                  {f.name} ({formatBytes(f.size)})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Disclosure>
  )
}
