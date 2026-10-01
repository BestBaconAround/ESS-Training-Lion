import { emptyHistory, type HistoryData } from './types'

// A passphrase-locked store for chat history, kept in this browser only.
//
// This is NOT an account system: the site is static and has no server, so there is nothing to log in to.
// What it does provide is real encryption at rest: the history is AES-GCM encrypted with a key derived from the
// passphrase (PBKDF2-SHA-256). Without the passphrase the stored data is unreadable. There is no recovery: a forgotten
// passphrase means the history is gone. The code is public, so nothing secret is in it; the passphrase is the only secret.

export const VAULT_KEY = 'ess-training:history-vault'
export const MIN_PASSPHRASE = 8
export const DEFAULT_ITERATIONS = 600_000
const AAD = new TextEncoder().encode('ess-training-history-v1')

export interface TextStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface VaultFile {
  v: 1
  iter: number
  salt: string
  iv: string
  ct: string
}

export interface Vault {
  data: HistoryData
  /** Encrypts and stores `data` with a fresh IV. */
  save(data: HistoryData): Promise<void>
}

export class VaultError extends Error {}

const subtle = (): SubtleCrypto => {
  const s = globalThis.crypto?.subtle
  if (!s) throw new VaultError('This browser does not support the encryption needed for private history.')
  return s
}

const toB64 = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}
const fromB64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iter: number): Promise<CryptoKey> {
  const base = await subtle().importKey('raw', new TextEncoder().encode(passphrase.normalize('NFKC')), 'PBKDF2', false, ['deriveKey'])
  return subtle().deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

async function encrypt(key: CryptoKey, data: HistoryData): Promise<{ iv: string; ct: string }> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const ct = await subtle().encrypt({ name: 'AES-GCM', iv, additionalData: AAD }, key, new TextEncoder().encode(JSON.stringify(data)))
  return { iv: toB64(iv), ct: toB64(ct) }
}

const isHistory = (v: unknown): v is HistoryData =>
  typeof v === 'object' && v !== null && (v as HistoryData).version === 1 && Array.isArray((v as HistoryData).entries)

export const vaultExists = (store: TextStore | null): boolean => {
  try {
    return !!store?.getItem(VAULT_KEY)
  } catch {
    return false
  }
}

function makeVault(store: TextStore, key: CryptoKey, file: Pick<VaultFile, 'iter' | 'salt'>, data: HistoryData): Vault {
  return {
    data,
    async save(next) {
      const { iv, ct } = await encrypt(key, next)
      const out: VaultFile = { v: 1, iter: file.iter, salt: file.salt, iv, ct }
      store.setItem(VAULT_KEY, JSON.stringify(out))
    },
  }
}

/** Creates a new, empty, encrypted history. Throws if one already exists or the passphrase is too short. */
export async function createVault(store: TextStore, passphrase: string, iterations = DEFAULT_ITERATIONS): Promise<Vault> {
  if (passphrase.length < MIN_PASSPHRASE) throw new VaultError(`Use at least ${MIN_PASSPHRASE} characters.`)
  if (vaultExists(store)) throw new VaultError('A private history already exists on this device.')
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(passphrase, salt, iterations)
  const vault = makeVault(store, key, { iter: iterations, salt: toB64(salt) }, emptyHistory())
  await vault.save(vault.data)
  return vault
}

/** Returns the unlocked vault, or null when the passphrase is wrong (or the data was altered). */
export async function unlockVault(store: TextStore, passphrase: string): Promise<Vault | null> {
  const raw = store.getItem(VAULT_KEY)
  if (!raw) throw new VaultError('There is no private history on this device yet.')
  let file: VaultFile
  try {
    file = JSON.parse(raw) as VaultFile
    if (file.v !== 1 || !file.salt || !file.iv || !file.ct || !(file.iter >= 1)) throw new Error('bad')
  } catch {
    throw new VaultError('The saved history is damaged and cannot be opened.')
  }
  const key = await deriveKey(passphrase, fromB64(file.salt), file.iter)
  let plain: ArrayBuffer
  try {
    plain = await subtle().decrypt({ name: 'AES-GCM', iv: fromB64(file.iv), additionalData: AAD }, key, fromB64(file.ct))
  } catch {
    return null // wrong passphrase, or the stored data was changed (GCM authenticates it)
  }
  const data = JSON.parse(new TextDecoder().decode(plain)) as unknown
  if (!isHistory(data)) throw new VaultError('The saved history is damaged and cannot be opened.')
  return makeVault(store, key, file, data)
}

/** Permanently deletes the stored history. There is no undo. */
export function destroyVault(store: TextStore): void {
  store.removeItem(VAULT_KEY)
}
