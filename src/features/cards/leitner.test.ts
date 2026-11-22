import { describe, expect, it } from 'vitest'
import { isDue, LEITNER, reviewCard } from './leitner'

const NOW = new Date(2026, 0, 10, 15, 30).getTime()
const DAY = 24 * 60 * 60 * 1000
const midnight = new Date(2026, 0, 10).getTime()

describe('Leitner', () => {
  it('нова картка, яку знаєш, переходить у коробку 2 і повертається завтра', () => {
    const state = reviewCard(undefined, true, NOW)
    expect(state.box).toBe(2)
    expect(state.due).toBe(midnight + DAY)
    expect(state.reviews).toBe(1)
    expect(state.lapses).toBe(0)
  })

  it('картка, яку не знаєш, повертається в коробку 1 і одразу знову на повторенні', () => {
    const state = reviewCard({ box: 4, due: 0, reviews: 5, lapses: 0 }, false, NOW)
    expect(state.box).toBe(1)
    expect(isDue(state, NOW)).toBe(true)
    expect(state.lapses).toBe(1)
  })

  it('інтервали зростають від коробки до коробки, остання коробка — стеля', () => {
    let state = reviewCard(undefined, true, NOW)
    const intervals = [(state.due - midnight) / DAY]
    for (let i = 0; i < 5; i++) {
      state = reviewCard(state, true, NOW)
      intervals.push((state.due - midnight) / DAY)
    }
    expect(intervals).toEqual([1, 3, 7, 14, 14, 14])
    expect(state.box).toBe(LEITNER.boxCount)
  })

  it('картка без стану завжди на повторенні; з майбутньою датою — ні', () => {
    expect(isDue(undefined, NOW)).toBe(true)
    expect(isDue({ box: 2, due: NOW + 1, reviews: 1, lapses: 0 }, NOW)).toBe(false)
  })
})
