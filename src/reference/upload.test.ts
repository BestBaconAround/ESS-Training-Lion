import { describe, expect, it } from 'vitest'
import { INBOX, MAX_FILE_BYTES, REPO, listInbox, safeName, toBase64, uploadFile, validateFile } from './upload'

const file = (name: string, content = 'hello') => new File([content], name)

describe('validateFile', () => {
  it('accepts a normal pdf', () => {
    expect(validateFile({ name: 'manual.PDF', size: 1000 })).toBeNull()
  })
  it('rejects empty, oversize and unsupported files', () => {
    expect(validateFile({ name: 'a.pdf', size: 0 })).toMatch(/empty/)
    expect(validateFile({ name: 'a.pdf', size: MAX_FILE_BYTES + 1 })).toMatch(/limit is 25\.0 MB/)
    expect(validateFile({ name: 'a.pdf', size: MAX_FILE_BYTES })).toBeNull()
    expect(validateFile({ name: 'run.exe', size: 10 })).toMatch(/not a supported type/)
    expect(validateFile({ name: 'noext', size: 10 })).toMatch(/not a supported type/)
  })
})

describe('safeName', () => {
  it('keeps names repo-safe and never returns a path or an empty name', () => {
    expect(safeName('Lion Energy – Guide (v2).pdf')).toBe('Lion-Energy-Guide-v2-.pdf')
    expect(safeName('../../etc/passwd')).toBe('passwd')
    expect(safeName('C:\\temp\\notes.txt')).toBe('notes.txt')
    expect(safeName('...')).toBe('file')
    expect(safeName('.env')).toBe('env')
  })
})

describe('toBase64', () => {
  it('matches the known encoding, including bytes over 127', async () => {
    expect(await toBase64(new Blob(['hello']))).toBe('aGVsbG8=')
    expect(await toBase64(new Blob([new Uint8Array([255, 0, 128])]))).toBe('/wCA')
  })
})

const reply = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status })

describe('uploadFile', () => {
  it('puts the file in the inbox on the dev branch with a base64 body', async () => {
    const calls: { url: string; method?: string; body?: string }[] = []
    const f: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), method: init?.method, body: init?.body as string | undefined })
      return init?.method === 'PUT' ? reply(201) : reply(404)
    }
    const r = await uploadFile('tok', file('Guide v2.pdf'), f)
    expect(r).toEqual({ ok: true, path: `${INBOX}/Guide-v2.pdf` })
    const put = calls.find((c) => c.method === 'PUT')!
    const body = JSON.parse(put.body!)
    expect(body.branch).toBe(REPO.branch)
    expect(body.content).toBe('aGVsbG8=')
    expect(put.url).toContain(`/contents/${INBOX}/Guide-v2.pdf`)
  })

  it('never overwrites: a taken name gets -2', async () => {
    const f: typeof fetch = async (url, init) => {
      if (init?.method === 'PUT') return reply(201)
      return String(url).includes('/a.pdf?') ? reply(200) : reply(404)
    }
    expect(await uploadFile('tok', file('a.pdf'), f)).toEqual({ ok: true, path: `${INBOX}/a-2.pdf` })
  })

  it('explains a refused token, an unreachable network and an invalid file without calling GitHub', async () => {
    expect(await uploadFile('tok', file('a.pdf'), async () => reply(401))).toMatchObject({ ok: false, error: expect.stringMatching(/refused the token/) })
    expect(
      await uploadFile('tok', file('a.pdf'), async () => {
        throw new Error('offline')
      }),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/Could not reach GitHub/) })
    let called = false
    const r = await uploadFile('tok', file('a.exe'), async () => ((called = true), reply(404)))
    expect(called).toBe(false)
    expect(r.ok).toBe(false)
  })
})

describe('listInbox', () => {
  it('lists files, hides the readme, and treats a missing folder as empty', async () => {
    const listing = [
      { name: 'a.pdf', size: 10, type: 'file' },
      { name: 'README.md', size: 5, type: 'file' },
      { name: 'sub', size: 0, type: 'dir' },
    ]
    expect(await listInbox(async () => reply(200, listing))).toEqual([{ name: 'a.pdf', size: 10 }])
    expect(await listInbox(async () => reply(404))).toEqual([])
    await expect(listInbox(async () => reply(500))).rejects.toThrow(/500/)
  })
})
