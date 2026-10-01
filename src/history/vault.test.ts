import { describe, expect, it } from 'vitest'
import { DEFAULT_ITERATIONS, VAULT_KEY, VaultError, createVault, destroyVault, unlockVault, vaultExists, type TextStore } from './vault'
import { emptyHistory, type HistoryData } from './types'

const fakeStore = () => {
  const m = new Map<string, string>()
  const s: TextStore & { raw: Map<string, string> } = {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    raw: m,
  }
  return s
}
const FAST = 1000 // PBKDF2 iterations for tests that are not about the cost
const sample = (text: string): HistoryData => ({
  version: 1,
  entries: [{ id: 'e1', at: 1, kind: 'notes', text, ideas: [{ kind: 'match', title: 'Red light' }] }],
})

describe('private history vault', () => {
  it('creates an empty history and reopens it with the same passphrase', async () => {
    const s = fakeStore()
    const v = await createVault(s, 'correct horse battery', FAST)
    expect(v.data).toEqual(emptyHistory())
    const again = await unlockVault(s, 'correct horse battery')
    expect(again?.data).toEqual(emptyHistory())
  })

  it('saves and reloads data across a lock', async () => {
    const s = fakeStore()
    const v = await createVault(s, 'correct horse battery', FAST)
    await v.save(sample('battery 2 reads 50.2V'))
    const again = await unlockVault(s, 'correct horse battery')
    expect(again?.data).toEqual(sample('battery 2 reads 50.2V'))
  })

  it('rejects a wrong passphrase without revealing anything', async () => {
    const s = fakeStore()
    const v = await createVault(s, 'correct horse battery', FAST)
    await v.save(sample('secret customer note'))
    expect(await unlockVault(s, 'wrong passphrase!')).toBeNull()
    expect(await unlockVault(s, 'Correct horse battery')).toBeNull() // case matters
  })

  it('never stores the text, the passphrase, or the entries in the clear', async () => {
    const s = fakeStore()
    const v = await createVault(s, 'correct horse battery', FAST)
    await v.save(sample('Jane Doe 123 Main Street battery 2 reads 50.2V'))
    const stored = s.raw.get(VAULT_KEY)!
    for (const needle of ['Jane', 'Main Street', '50.2', 'correct horse', 'entries', 'Red light']) {
      expect(stored).not.toContain(needle)
    }
  })

  it('uses a fresh salt per vault and a fresh IV per save', async () => {
    const a = fakeStore()
    const b = fakeStore()
    const va = await createVault(a, 'correct horse battery', FAST)
    await createVault(b, 'correct horse battery', FAST)
    expect(JSON.parse(a.raw.get(VAULT_KEY)!).salt).not.toBe(JSON.parse(b.raw.get(VAULT_KEY)!).salt)
    await va.save(sample('x'))
    const iv1 = JSON.parse(a.raw.get(VAULT_KEY)!).iv
    await va.save(sample('x'))
    const iv2 = JSON.parse(a.raw.get(VAULT_KEY)!).iv
    expect(iv1).not.toBe(iv2)
  })

  it('detects tampering with the stored data', async () => {
    const s = fakeStore()
    const v = await createVault(s, 'correct horse battery', FAST)
    await v.save(sample('note'))
    const file = JSON.parse(s.raw.get(VAULT_KEY)!)
    const ct = atob(file.ct)
    file.ct = btoa(String.fromCharCode(ct.charCodeAt(0) ^ 1) + ct.slice(1))
    s.setItem(VAULT_KEY, JSON.stringify(file))
    expect(await unlockVault(s, 'correct horse battery')).toBeNull()
  })

  it('reports damaged storage clearly', async () => {
    const s = fakeStore()
    s.setItem(VAULT_KEY, '{not json')
    await expect(unlockVault(s, 'correct horse battery')).rejects.toBeInstanceOf(VaultError)
  })

  it('refuses short passphrases and does not overwrite an existing vault', async () => {
    const s = fakeStore()
    await expect(createVault(s, 'short', FAST)).rejects.toThrow(/at least 8/)
    await createVault(s, 'correct horse battery', FAST)
    await expect(createVault(s, 'another long passphrase', FAST)).rejects.toThrow(/already exists/)
  })

  it('cannot unlock a vault that does not exist', async () => {
    await expect(unlockVault(fakeStore(), 'correct horse battery')).rejects.toBeInstanceOf(VaultError)
  })

  it('destroy removes everything', async () => {
    const s = fakeStore()
    await createVault(s, 'correct horse battery', FAST)
    expect(vaultExists(s)).toBe(true)
    destroyVault(s)
    expect(vaultExists(s)).toBe(false)
    expect(s.raw.size).toBe(0)
  })

  it('uses a strong default key-derivation cost', async () => {
    const s = fakeStore()
    await createVault(s, 'correct horse battery')
    expect(JSON.parse(s.raw.get(VAULT_KEY)!).iter).toBe(DEFAULT_ITERATIONS)
    expect(DEFAULT_ITERATIONS).toBeGreaterThanOrEqual(600_000)
  })

  it('treats equivalent unicode forms of a passphrase as the same', async () => {
    const s = fakeStore()
    await createVault(s, 'café au lait 123', FAST) // precomposed é
    expect(await unlockVault(s, 'café au lait 123')).not.toBeNull() // e + combining accent
  })
})
