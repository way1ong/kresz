export type Rng = () => number

/** Тасування Фішера–Єйтса; повертає нову копію масиву. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Випадкова перестановка індексів 0..n-1 (порядок показу відповідей). */
export function shuffledIndices(n: number, rng: Rng = Math.random): number[] {
  return shuffle(
    Array.from({ length: n }, (_, i) => i),
    rng,
  )
}

/** Детермінований генератор для тестів. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
