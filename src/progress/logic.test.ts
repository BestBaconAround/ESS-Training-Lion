import { describe, expect, it } from 'vitest'
import type { Module } from '../content/types'
import {
  STORAGE_KEY,
  emptyProgress,
  loadProgress,
  markLessonDone,
  parseProgress,
  recordQuizAttempt,
  recordSimAttempt,
  saveProgress,
  serializeProgress,
  summarize,
  unmarkLesson,
  type KeyValueStore,
} from './logic'

const mod = {
  id: 'm',
  number: 1,
  title: 't',
  summary: 's',
  status: 'ready',
  outline: [],
  lessons: [
    { id: 'l1', title: '', summary: '', blocks: [] },
    { id: 'l2', title: '', summary: '', blocks: [] },
  ],
  quiz: { passMark: 0.8, questions: [] },
  sim: { id: 'sim1', kind: 'inverter-panel', title: '', intro: '' },
} as Module

describe('progress logic', () => {
  it('marks lessons done idempotently and can unmark', () => {
    const p1 = markLessonDone(emptyProgress(), 'm', 'l1')
    expect(markLessonDone(p1, 'm', 'l1')).toBe(p1)
    expect(p1.modules.m.lessonsDone).toEqual(['l1'])
    expect(unmarkLesson(p1, 'm', 'l1').modules.m.lessonsDone).toEqual([])
  })

  it('keeps the best quiz score and every attempt', () => {
    let p = recordQuizAttempt(emptyProgress(), 'm', 3, 5, 1)
    p = recordQuizAttempt(p, 'm', 5, 5, 2)
    p = recordQuizAttempt(p, 'm', 2, 5, 3)
    expect(p.modules.m.quizBest).toBe(1)
    expect(p.modules.m.quizAttempts.map((a) => a.score)).toEqual([3, 5, 2])
  })

  it('ignores a quiz attempt with no questions', () => {
    const p = emptyProgress()
    expect(recordQuizAttempt(p, 'm', 0, 0)).toBe(p)
  })

  it('tracks sim attempts, best and last, clamped to 0-100', () => {
    let p = recordSimAttempt(emptyProgress(), 'm', 'sim1', 60)
    p = recordSimAttempt(p, 'm', 'sim1', 150)
    p = recordSimAttempt(p, 'm', 'sim1', 40)
    expect(p.modules.m.sims.sim1).toEqual({ attempts: 3, best: 100, last: 40 })
  })

  it('summarizes completion in equal thirds', () => {
    expect(summarize(mod, emptyProgress()).percent).toBe(0)
    let p = markLessonDone(emptyProgress(), 'm', 'l1')
    p = markLessonDone(p, 'm', 'l2')
    p = recordQuizAttempt(p, 'm', 4, 5)
    p = recordSimAttempt(p, 'm', 'sim1', 90)
    const s = summarize(mod, p)
    expect(s.quizPassed).toBe(true)
    expect(s.percent).toBe(97)
  })

  it('ignores progress for lessons that no longer exist', () => {
    const p = markLessonDone(emptyProgress(), 'm', 'gone')
    expect(summarize(mod, p).lessonsDone).toBe(0)
  })

  it('round-trips through JSON and rejects bad data', () => {
    let p = markLessonDone(emptyProgress(), 'm', 'l1')
    p = recordQuizAttempt(p, 'm', 3, 4, 10)
    p = recordSimAttempt(p, 'm', 'sim1', 70)
    expect(parseProgress(JSON.parse(serializeProgress(p)))).toEqual(p)
    expect(parseProgress(null)).toBeNull()
    expect(parseProgress({ version: 2, modules: {} })).toBeNull()
    expect(parseProgress({ version: 1, modules: { m: { lessonsDone: 'x' } } })).toBeNull()
  })

  it('survives corrupt or blocked storage', () => {
    const bad: KeyValueStore = { getItem: () => '{not json', setItem: () => {} }
    expect(loadProgress(bad)).toEqual(emptyProgress())
    const throwing: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadProgress(throwing)).toEqual(emptyProgress())
    expect(() => saveProgress(throwing, emptyProgress())).not.toThrow()
    expect(loadProgress(null)).toEqual(emptyProgress())
  })

  it('saves under the versioned key', () => {
    const data = new Map<string, string>()
    const store: KeyValueStore = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
    const p = markLessonDone(emptyProgress(), 'm', 'l1')
    saveProgress(store, p)
    expect([...data.keys()]).toEqual([STORAGE_KEY])
    expect(loadProgress(store)).toEqual(p)
  })
})
