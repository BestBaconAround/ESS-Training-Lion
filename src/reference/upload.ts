/**
 * Adds files to the repo's reference-inbox/ folder through the GitHub contents API, so Claude can read them in a
 * later session and update the app. A static site has no backend, so this uses a token the person pastes in.
 * The token stays in memory only and goes only to api.github.com. The repo is PUBLIC: anything added is public.
 */

export const REPO = { owner: 'BestBaconAround', repo: 'ESS-Training-Lion', branch: 'claude/gracious-ramanujan-6os5lz' } as const
export const INBOX = 'reference-inbox'

/**
 * GitHub's own limits: the web upload page takes 25 MB, a git push is blocked at 100 MB and warned at 50 MB.
 * 25 MB keeps every upload method safe, including the base64 JSON request this uses (about a third bigger).
 */
export const MAX_FILE_BYTES = 25 * 1024 * 1024
export const MAX_FILES_PER_BATCH = 10

export const ALLOWED_EXTENSIONS = ['pdf', 'md', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'webp', 'docx', 'xlsx'] as const

export const formatBytes = (n: number): string => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

const extensionOf = (name: string): string => {
  const i = name.lastIndexOf('.')
  return i < 0 ? '' : name.slice(i + 1).toLowerCase()
}

/** A repo-safe file name: letters, digits, dot, dash and underscore only. Never empty, never a path. */
export function safeName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? ''
  const cleaned = base
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[.-]+/, '')
  return cleaned || 'file'
}

/** Returns a reason the file cannot be added, or null when it can. */
export function validateFile(file: { name: string; size: number }): string | null {
  if (file.size === 0) return `${file.name} is empty.`
  if (file.size > MAX_FILE_BYTES) return `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES)} (GitHub's upload limit is 25 MB in the browser and 100 MB for git).`
  if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name) as (typeof ALLOWED_EXTENSIONS)[number])) {
    return `${file.name} is not a supported type. Use: ${ALLOWED_EXTENSIONS.join(', ')}.`
  }
  return null
}

/** Base64 without FileReader so it also runs in tests. Chunked to avoid call stack limits. */
export async function toBase64(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(binary)
}

const api = (path: string) => `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`

export interface InboxFile {
  name: string
  size: number
}

/** Files already in the inbox (the repo is public, so no token is needed). Empty when the folder does not exist yet. */
export async function listInbox(fetchImpl: typeof fetch = fetch): Promise<InboxFile[]> {
  const res = await fetchImpl(`${api(INBOX)}?ref=${encodeURIComponent(REPO.branch)}`, { headers: { Accept: 'application/vnd.github+json' } })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`GitHub answered ${res.status} when listing the inbox.`)
  const data: unknown = await res.json()
  if (!Array.isArray(data)) return []
  return data
    .filter((d): d is { name: string; size: number; type: string } => typeof d?.name === 'string' && d.type === 'file' && d.name !== 'README.md')
    .map((d) => ({ name: d.name, size: d.size }))
}

export type UploadResult = { ok: true; path: string } | { ok: false; error: string }

/** Uploads one file. Never overwrites: if the name is taken it adds -2, -3 and so on. */
export async function uploadFile(token: string, file: File, fetchImpl: typeof fetch = fetch): Promise<UploadResult> {
  const problem = validateFile(file)
  if (problem) return { ok: false, error: problem }
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const name = safeName(file.name)
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  try {
    for (let n = 1; n <= 20; n++) {
      const candidate = `${INBOX}/${n === 1 ? name : `${stem}-${n}${ext}`}`
      const exists = await fetchImpl(`${api(candidate)}?ref=${encodeURIComponent(REPO.branch)}`, { headers })
      if (exists.status === 401 || exists.status === 403) return { ok: false, error: 'GitHub refused the token. It needs Contents: read and write on this repository, and it may have expired.' }
      if (exists.status === 200) continue
      if (exists.status !== 404) return { ok: false, error: `GitHub answered ${exists.status} when checking the file name.` }
      const put = await fetchImpl(api(candidate), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ message: `Add reference file ${candidate.slice(INBOX.length + 1)}`, content: await toBase64(file), branch: REPO.branch }),
      })
      if (put.status === 201 || put.status === 200) return { ok: true, path: candidate }
      if (put.status === 401 || put.status === 403) return { ok: false, error: 'GitHub refused the token. It needs Contents: read and write on this repository, and it may have expired.' }
      if (put.status === 413) return { ok: false, error: 'GitHub says the file is too large for this upload.' }
      return { ok: false, error: `GitHub answered ${put.status} when saving the file.` }
    }
    return { ok: false, error: 'Too many files with that name already exist.' }
  } catch {
    return { ok: false, error: 'Could not reach GitHub. Check the connection and try again.' }
  }
}
