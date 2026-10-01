import { useRef, useState } from 'react'
import { serializeProgress } from '../progress/logic'
import { getProgress, progressActions } from '../progress/store'

const card = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const button =
  'rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300'

export default function BackupPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  const download = () => {
    const blob = new Blob([serializeProgress(getProgress())], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ess-training-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Progress downloaded.')
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const ok = progressActions.importJson(await file.text())
    setMessage(ok ? 'Progress imported.' : 'That file is not valid progress data. Nothing was changed.')
    if (fileRef.current) fileRef.current.value = ''
  }

  const reset = () => {
    if (window.confirm('Erase all lesson, quiz and simulator progress on this browser?')) {
      progressActions.reset()
      setMessage('Progress erased.')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Progress backup</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Progress is saved only in this browser. Clearing site data or switching browsers or devices loses it. Download a
        backup to keep or move it.
      </p>
      <section className={card}>
        <h2 className="font-semibold">Download</h2>
        <button className={`${button} mt-3`} onClick={download}>
          Download progress (.json)
        </button>
      </section>
      <section className={card}>
        <h2 className="font-semibold">Import</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Replaces the progress saved in this browser.</p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="mt-3 block text-sm"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </section>
      <section className={card}>
        <h2 className="font-semibold">Erase</h2>
        <button
          className="mt-3 rounded-md border border-red-600 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          onClick={reset}
        >
          Erase all progress
        </button>
      </section>
      {message && (
        <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      )}
    </div>
  )
}
