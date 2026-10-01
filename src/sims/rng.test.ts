import { describe, expect, it } from 'vitest'
import { createRng, pick, randFloat, randInt, shuffle } from './rng'

describe('rng', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(createRng(1)()).not.toBe(createRng(2)())
  })

  it('randInt stays in range and hits both ends', () => {
    const rng = createRng(7)
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(randInt(rng, 1, 3))
    expect([...seen].sort()).toEqual([1, 2, 3])
  })

  it('randFloat rounds and stays in range', () => {
    const rng = createRng(9)
    for (let i = 0; i < 200; i++) {
      const v = randFloat(rng, 50, 56, 1)
      expect(v).toBeGreaterThanOrEqual(50)
      expect(v).toBeLessThanOrEqual(56)
      expect(Math.round(v * 10) / 10).toBe(v)
    }
  })

  it('shuffle keeps the same items and does not mutate', () => {
    const input = [1, 2, 3, 4, 5]
    const out = shuffle(createRng(3), input)
    expect(input).toEqual([1, 2, 3, 4, 5])
    expect([...out].sort()).toEqual(input)
  })

  it('pick returns an element', () => {
    expect(['a', 'b']).toContain(pick(createRng(5), ['a', 'b']))
  })
})
