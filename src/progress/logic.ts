import type { Module } from '../content/types'
import type { ModuleProgress, ProgressData, QuizAttempt, SimProgress } from './types'

export const STORAGE_KEY = 'ess-training:v1'
const MAX_QUIZ_ATTEMPTS = 50

export const emptyModule = (): ModuleProgress => ({
  lessonsDone: [],
  quizAttempts: [],
  quizBest: null,
  sims: {},
})

export const emptyProgress = (): ProgressData => ({ version: 1, modules: {} })

const getModule = (p: ProgressData, id: string): ModuleProgress => p.modules[id] ?? emptyModule()

const withModule = (p: ProgressData, id: string, m: ModuleProgress): ProgressData => ({
  ...p,
  modules: { ...p.modules, [id]: m },
})

export function markLessonDone(p: ProgressData, moduleId: string, lessonId: string): ProgressData {
  const m = getModule(p, moduleId)
  if (m.lessonsDone.includes(lessonId)) return p
  return withModule(p, moduleId, { ...m, lessonsDone: [...m.lessonsDone, lessonId] })
}

export function unmarkLesson(p: ProgressData, moduleId: string, lessonId: string): ProgressData {
  const m = getModule(p, moduleId)
  if (!m.lessonsDone.includes(lessonId)) return p
  return withModule(p, moduleId, { ...m, lessonsDone: m.lessonsDone.filter((l) => l !== lessonId) })
}

export function recordQuizAttempt(
  p: ProgressData,
  moduleId: string,
  score: number,
  total: number,
  at: number = Date.now(),
): ProgressData {
  if (total <= 0) return p
  const m = getModule(p, moduleId)
  const attempt: QuizAttempt = { score, total, at }
  const fraction = score / total
  return withModule(p, moduleId, {
    ...m,
    quizAttempts: [...m.quizAttempts, attempt].slice(-MAX_QUIZ_ATTEMPTS),
    quizBest: m.quizBest === null ? fraction : Math.max(m.quizBest, fraction),
  })
}

export function recordSimAttempt(p: ProgressData, moduleId: string, simId: string, score: number): ProgressData {
  const m = getModule(p, moduleId)
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const prev: SimProgress = m.sims[simId] ?? { attempts: 0, best: null, last: null }
  const next: SimProgress = {
    attempts: prev.attempts + 1,
    best: prev.best === null ? clamped : Math.max(prev.best, clamped),
    last: clamped,
  }
  return withModule(p, moduleId, { ...m, sims: { ...m.sims, [simId]: next } })
}

export interface ModuleSummary {
  lessonsDone: number
  lessonsTotal: number
  quizBest: number | null
  quizPassed: boolean
  quizAttempts: number
  simBest: number | null
  simAttempts: number
  /** 0-100. Equal thirds: lessons done, quiz (full credit once passed), sim best score. */
  percent: number
}

export function summarize(module: Module, p: ProgressData): ModuleSummary {
  const m = getModule(p, module.id)
  const lessonIds = new Set(module.lessons.map((l) => l.id))
  const lessonsDone = m.lessonsDone.filter((id) => lessonIds.has(id)).length
  const lessonsTotal = module.lessons.length
  const quizPassed = !!module.quiz && m.quizBest !== null && m.quizBest >= module.quiz.passMark
  const sim = m.sims[module.sim.id]

  const lessonPart = lessonsTotal ? lessonsDone / lessonsTotal : 0
  const quizPart = quizPassed ? 1 : (m.quizBest ?? 0)
  const simPart = (sim?.best ?? 0) / 100
  return {
    lessonsDone,
    lessonsTotal,
    quizBest: m.quizBest,
    quizPassed,
    quizAttempts: m.quizAttempts.length,
    simBest: sim?.best ?? null,
    simAttempts: sim?.attempts ?? 0,
    percent: Math.round(((lessonPart + quizPart + simPart) / 3) * 100),
  }
}

export const getModuleProgress = getModule

// ---- (de)serialization -------------------------------------------------

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Validates untrusted JSON (localStorage or an imported file). Returns null if invalid. */
export function parseProgress(raw: unknown): ProgressData | null {
  if (!isObj(raw) || raw.version !== 1 || !isObj(raw.modules)) return null
  const modules: ProgressData['modules'] = {}
  for (const [id, mv] of Object.entries(raw.modules)) {
    if (!isObj(mv) || !isStrArr(mv.lessonsDone) || !Array.isArray(mv.quizAttempts) || !isObj(mv.sims)) return null
    if (!(mv.quizBest === null || isNum(mv.quizBest))) return null
    const quizAttempts: QuizAttempt[] = []
    for (const a of mv.quizAttempts) {
      if (!isObj(a) || !isNum(a.score) || !isNum(a.total) || !isNum(a.at)) return null
      quizAttempts.push({ score: a.score, total: a.total, at: a.at })
    }
    const sims: Record<string, SimProgress> = {}
    for (const [sid, sv] of Object.entries(mv.sims)) {
      if (!isObj(sv) || !isNum(sv.attempts)) return null
      if (!(sv.best === null || isNum(sv.best)) || !(sv.last === null || isNum(sv.last))) return null
      sims[sid] = { attempts: sv.attempts, best: sv.best as number | null, last: sv.last as number | null }
    }
    modules[id] = { lessonsDone: [...mv.lessonsDone], quizAttempts, quizBest: mv.quizBest as number | null, sims }
  }
  return { version: 1, modules }
}

export const serializeProgress = (p: ProgressData): string => JSON.stringify(p, null, 2)

/** Minimal Storage surface so tests can pass a fake. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function loadProgress(store: KeyValueStore | null): ProgressData {
  try {
    const raw = store?.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    return parseProgress(JSON.parse(raw)) ?? emptyProgress()
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(store: KeyValueStore | null, p: ProgressData): void {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // Storage can be blocked or full (private mode). The app keeps working in memory.
  }
}
