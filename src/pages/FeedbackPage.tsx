import { useState } from 'react'
import { PageHeader, ui } from '../components/ui'
import { FEEDBACK_TYPES, ISSUES_URL, MAX_MESSAGE, buildIssueUrl, type FeedbackType } from '../feedback/issue'

const PAGES = ['Dashboard', 'Troubleshooting', 'Procedures', 'Reference', 'Electricity', 'Solar', 'Codes', 'Competitors', 'A lesson, quiz or simulator', 'The assistant (Ask, Call notes)', 'Something else']

/** Input from other people. Nothing is stored here: the person reviews a pre-filled GitHub issue and submits it there. */
export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>('wrong')
  const [page, setPage] = useState(PAGES[0])
  const [revision, setRevision] = useState('')
  const [source, setSource] = useState('')
  const [message, setMessage] = useState('')
  const [understood, setUnderstood] = useState(false)
  const ready = message.trim().length >= 10 && understood

  const open = () => window.open(buildIssueUrl({ type, page, message, source, revision }), '_blank', 'noopener,noreferrer')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Feedback"
        lead="Tell us what is wrong, missing or unclear. It opens a pre-filled GitHub issue that you review and submit. You need a free GitHub account."
      />

      <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200" role="note">
        <strong>Issues on this repository are public.</strong> Do not include customer names, addresses, serial numbers, phone numbers, login links or anything marked internal.
      </p>

      <form
        className={`${ui.card} space-y-4 p-5`}
        onSubmit={(e) => {
          e.preventDefault()
          if (ready) open()
        }}
      >
        <fieldset>
          <legend className="text-sm font-medium">What kind of feedback?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(FEEDBACK_TYPES) as FeedbackType[]).map((t) => (
              <button
                type="button"
                key={t}
                aria-pressed={type === t}
                onClick={() => setType(t)}
                className={`rounded-full border px-3 py-1 text-sm font-medium ${
                  type === t
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {FEEDBACK_TYPES[t].label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Where?</span>
            <select value={page} onChange={(e) => setPage(e.target.value)} className={`${ui.input} mt-1`}>
              {PAGES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Revision, if it matters</span>
            <input value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="Rev 1, 2, 3 or 4" className={`${ui.input} mt-1`} />
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium">Your message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
            rows={6}
            placeholder={FEEDBACK_TYPES[type].hint}
            className={`${ui.input} mt-1`}
          />
          <span className={`mt-1 block text-xs ${ui.muted}`}>
            {message.length} / {MAX_MESSAGE}. At least 10 characters.
          </span>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Where does the right answer come from? (optional)</span>
          <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Document and page, for example Technical Service Manual p.78" className={`${ui.input} mt-1`} />
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-1" />
          <span>I understand this becomes a public GitHub issue and I have left out customer and internal details.</span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={!ready} className={ui.primary}>
            Open on GitHub
          </button>
          <a href={ISSUES_URL} target="_blank" rel="noreferrer" className={`text-sm ${ui.link}`}>
            See feedback already sent
          </a>
        </div>
      </form>

      <p className={`text-xs ${ui.muted}`}>
        Nothing is sent until you press Submit on GitHub. In a later session, ask Claude to read the open issues and update the app from them.
      </p>
    </div>
  )
}
