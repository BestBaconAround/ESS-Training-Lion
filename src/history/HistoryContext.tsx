import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { MIN_PASSPHRASE, VaultError, createVault, destroyVault, unlockVault, vaultExists, type TextStore, type Vault } from './vault'
import { addEntry, newId, removeEntry } from './entries'
import type { AskAnswerSnapshot, HistoryData, HistoryEntry } from './types'

export const IDLE_LOCK_MS = 15 * 60 * 1000

export type HistoryStatus = 'none' | 'locked' | 'unlocked'

export interface HistoryApi {
  status: HistoryStatus
  entries: HistoryEntry[]
  /** Set when saving to browser storage failed. */
  saveError: string | null
  /** Each returns an error message, or null on success. */
  create(passphrase: string, confirm: string): Promise<string | null>
  unlock(passphrase: string): Promise<string | null>
  lock(): void
  erase(): void
  recordAsk(question: string, answer: AskAnswerSnapshot | null): void
  recordNotes(text: string, ideas: { kind: string; title: string }[]): void
  remove(id: string): void
  /** Call on user activity so the idle timer restarts. */
  touch(): void
}

const Ctx = createContext<HistoryApi | null>(null)

export function useHistory(): HistoryApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useHistory must be used inside HistoryProvider')
  return v
}

function browserStore(): TextStore | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

/**
 * Holds the unlocked history in memory only. The decrypted data and the key never touch storage; leaving the page,
 * pressing Lock, or 15 minutes of inactivity drops them, and the passphrase is needed again.
 */
export function HistoryProvider({ children, store = browserStore(), idleMs = IDLE_LOCK_MS }: { children: ReactNode; store?: TextStore | null; idleMs?: number }) {
  const [status, setStatus] = useState<HistoryStatus>(() => (vaultExists(store) ? 'locked' : 'none'))
  const [data, setData] = useState<HistoryData | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const vault = useRef<Vault | null>(null)
  const dataRef = useRef<HistoryData | null>(null)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const lastActive = useRef(Date.now())

  const open = (v: Vault) => {
    vault.current = v
    dataRef.current = v.data
    setData(v.data)
    setSaveError(null)
    lastActive.current = Date.now()
    setStatus('unlocked')
  }

  const lock = useCallback(() => {
    vault.current = null
    dataRef.current = null
    setData(null)
    setStatus((s) => (s === 'none' ? 'none' : 'locked'))
  }, [])

  const commit = useCallback((next: HistoryData) => {
    const v = vault.current
    if (!v) return
    dataRef.current = next
    setData(next)
    // Saves are queued so two quick actions cannot overwrite each other.
    queue.current = queue.current
      .then(() => v.save(next))
      .then(() => setSaveError(null))
      .catch(() => setSaveError('Could not save to this browser (storage may be full or blocked). Recent history is not saved.'))
  }, [])

  const api = useMemo<HistoryApi>(
    () => ({
      status,
      entries: data?.entries ?? [],
      saveError,
      async create(passphrase, confirm) {
        if (store === null) return 'This browser is blocking storage, so private history is not available.'
        if (passphrase.length < MIN_PASSPHRASE) return `Use at least ${MIN_PASSPHRASE} characters.`
        if (passphrase !== confirm) return 'The two passphrases do not match.'
        try {
          open(await createVault(store, passphrase))
          return null
        } catch (e) {
          return e instanceof VaultError ? e.message : 'Could not create the private history.'
        }
      },
      async unlock(passphrase) {
        if (store === null) return 'This browser is blocking storage, so private history is not available.'
        try {
          const v = await unlockVault(store, passphrase)
          if (!v) return 'That passphrase is not right.'
          open(v)
          return null
        } catch (e) {
          return e instanceof VaultError ? e.message : 'Could not open the private history.'
        }
      },
      lock,
      erase() {
        if (store) destroyVault(store)
        vault.current = null
        dataRef.current = null
        setData(null)
        setStatus('none')
      },
      recordAsk(question, answer) {
        const d = dataRef.current
        if (d) commit(addEntry(d, { id: newId(), at: Date.now(), kind: 'ask', question, answer }))
      },
      recordNotes(text, ideas) {
        const d = dataRef.current
        if (d) commit(addEntry(d, { id: newId(), at: Date.now(), kind: 'notes', text, ideas }))
      },
      remove(id) {
        const d = dataRef.current
        if (d) commit(removeEntry(d, id))
      },
      touch() {
        lastActive.current = Date.now()
      },
    }),
    // `open` only uses refs and setters, so it is safe to leave out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, data, saveError, store, lock, commit],
  )

  useEffect(() => {
    if (status !== 'unlocked') return
    const timer = window.setInterval(() => {
      if (Date.now() - lastActive.current > idleMs) lock()
    }, Math.min(30_000, Math.max(50, idleMs / 2)))
    return () => window.clearInterval(timer)
  }, [status, idleMs, lock])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
