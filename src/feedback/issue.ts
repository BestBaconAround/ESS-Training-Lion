import { REPO } from '../reference/upload'

export type FeedbackType = 'wrong' | 'missing' | 'idea'

export const FEEDBACK_TYPES: Record<FeedbackType, { label: string; prefix: string; hint: string }> = {
  wrong: { label: 'Something is wrong', prefix: 'Correction', hint: 'What it says, and what it should say.' },
  missing: { label: 'Something is missing', prefix: 'Missing', hint: 'What you looked for and could not find.' },
  idea: { label: 'A question or idea', prefix: 'Idea', hint: 'What would make this easier to use or learn from.' },
}

/** GitHub allows long query strings, but browsers and proxies do not. Keep the whole link well under 8,000 characters. */
export const MAX_MESSAGE = 3000
export const MAX_FIELD = 300

export interface FeedbackInput {
  type: FeedbackType
  page: string
  message: string
  source: string
  revision: string
}

const clip = (s: string, n: number) => s.trim().slice(0, n)

/** The pre-filled "new issue" link. Nothing is sent from the site itself: the person reviews and submits it on GitHub. */
export function buildIssueUrl(input: FeedbackInput): string {
  const t = FEEDBACK_TYPES[input.type]
  const message = clip(input.message, MAX_MESSAGE)
  const first = message.split(/\n/)[0].slice(0, 70)
  const title = `${t.prefix}: ${first || input.page || 'feedback'}`
  const lines = [
    `**Type:** ${t.label}`,
    `**Page:** ${clip(input.page, MAX_FIELD) || 'not given'}`,
    `**Revision:** ${clip(input.revision, MAX_FIELD) || 'not given'}`,
    `**Source (document and page), if you know it:** ${clip(input.source, MAX_FIELD) || 'not given'}`,
    '',
    message,
    '',
    '_Sent from the Feedback page of the training site._',
  ]
  const q = new URLSearchParams({ title, body: lines.join('\n') })
  return `https://github.com/${REPO.owner}/${REPO.repo}/issues/new?${q.toString()}`
}

export const ISSUES_URL = `https://github.com/${REPO.owner}/${REPO.repo}/issues`
