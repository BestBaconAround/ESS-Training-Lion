import { useSyncExternalStore } from 'react'
import {
  emptyProgress,
  loadProgress,
  markLessonDone,
  parseProgress,
  recordQuizAttempt,
  recordSimAttempt,
  saveProgress,
  unmarkLesson,
  type KeyValueStore,
} from './logic'
import type { ProgressData } from './types'

function browserStorage(): KeyValueStore | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null // Accessing localStorage can throw when site data is blocked.
  }
}

const storage = browserStorage()
let state: ProgressData = loadProgress(storage)
const listeners = new Set<() => void>()

function set(next: ProgressData) {
  if (next === state) return
  state = next
  saveProgress(storage, state)
  listeners.forEach((l) => l())
}

export const progressActions = {
  markLessonDone: (moduleId: string, lessonId: string) => set(markLessonDone(state, moduleId, lessonId)),
  unmarkLesson: (moduleId: string, lessonId: string) => set(unmarkLesson(state, moduleId, lessonId)),
  recordQuizAttempt: (moduleId: string, score: number, total: number) =>
    set(recordQuizAttempt(state, moduleId, score, total)),
  recordSimAttempt: (moduleId: string, simId: string, score: number) =>
    set(recordSimAttempt(state, moduleId, simId, score)),
  reset: () => set(emptyProgress()),
  /** Returns false (and changes nothing) if the JSON is not valid progress data. */
  importJson: (json: string): boolean => {
    try {
      const parsed = parseProgress(JSON.parse(json))
      if (!parsed) return false
      set(parsed)
      return true
    } catch {
      return false
    }
  },
}

export const getProgress = () => state

export function useProgress(): ProgressData {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}
