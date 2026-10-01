// Small seeded RNG so scenarios are reproducible in tests but vary run to run.

export type Rng = () => number

/** mulberry32: returns floats in [0, 1). */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const randomSeed = (): number => Math.floor(Math.random() * 2 ** 31)

/** Integer in [min, max] inclusive. */
export const randInt = (rng: Rng, min: number, max: number): number => min + Math.floor(rng() * (max - min + 1))

/** Float in [min, max], rounded to `decimals` places. */
export function randFloat(rng: Rng, min: number, max: number, decimals = 2): number {
  const f = 10 ** decimals
  return Math.round((min + rng() * (max - min)) * f) / f
}

export const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)]

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
