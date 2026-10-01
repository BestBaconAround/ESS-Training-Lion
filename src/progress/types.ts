export interface QuizAttempt {
  /** Number of correct answers. */
  score: number
  total: number
  /** Epoch ms. */
  at: number
}

export interface SimProgress {
  attempts: number
  /** Best score 0-100, null until the first completed attempt. */
  best: number | null
  /** Most recent score 0-100. */
  last: number | null
}

export interface ModuleProgress {
  lessonsDone: string[]
  quizAttempts: QuizAttempt[]
  /** Best quiz score as a fraction 0-1, null until the first attempt. */
  quizBest: number | null
  /** Keyed by sim id. */
  sims: Record<string, SimProgress>
}

export interface ProgressData {
  version: 1
  /** Keyed by module id. Ids are stable; never rename or reuse. */
  modules: Record<string, ModuleProgress>
}
