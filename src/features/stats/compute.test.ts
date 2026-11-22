import { describe, expect, it } from 'vitest'
import type { Question, Topic } from '../../content/types'
import { applyAnswer, applyCardReview, reviveProgress, type Progress } from '../../store/progress'
import { boxDistribution, overallStats, topicStats } from './compute'

const text = { question: 'q', answers: ['a', 'b'], explanation: 'e' }
const q = (id: string, topic: string): Question => ({ id, topic, kreszRef: 'r', hu: text, ua: text, correct: 0 })
const topics: Topic[] = [
  { id: 'a', icon: '', hu: 'A', ua: 'A' },
  { id: 'b', icon: '', hu: 'B', ua: 'B' },
]
const questions = [q('a1', 'a'), q('a2', 'a'), q('b1', 'b')]
const empty = (): Progress => reviveProgress(null)

describe('статистика', () => {
  it('рахує прогрес і точність за темами, визначає слабкі теми', () => {
    let progress = empty()
    // тема a: 6 відповідей, 2 правильні → слабка; тема b: без відповідей
    for (const correct of [false, false, true]) progress = applyAnswer(progress, 'a1', correct, 1)
    for (const correct of [false, false, true]) progress = applyAnswer(progress, 'a2', correct, 1)
    const [a, b] = topicStats(topics, questions, progress)
    expect(a).toMatchObject({ total: 2, seen: 2, mastered: 2, answers: 6, correctAnswers: 2, weak: true })
    expect(a.accuracy).toBeCloseTo(1 / 3)
    expect(b).toMatchObject({ total: 1, seen: 0, accuracy: null, weak: false })
    expect(overallStats([a, b])).toMatchObject({ total: 3, seen: 2, answers: 6 })
  })

  it('помилка додає питання в «Мої помилки», а картка «випускається» з 4-ї коробки', () => {
    let progress = applyAnswer(empty(), 'a1', false, 1)
    expect(progress.mistakes).toEqual(['a1'])
    progress = applyAnswer(progress, 'a1', false, 2)
    expect(progress.mistakes).toEqual(['a1'])
    progress = applyCardReview(progress, 'q:a1', true, 3) // коробка 2
    progress = applyCardReview(progress, 'q:a1', true, 4) // коробка 3
    expect(progress.mistakes).toEqual(['a1'])
    progress = applyCardReview(progress, 'q:a1', true, 5) // коробка 4 → випуск
    expect(progress.mistakes).toEqual([])
    expect(progress.cards['q:a1']).toBeUndefined()
  })

  it('розподіл карток за коробками', () => {
    let progress = empty()
    progress = applyCardReview(progress, 'c1', true, 1)
    progress = applyCardReview(progress, 'c2', false, 1)
    expect(boxDistribution(['c1', 'c2', 'c3'], progress, 5)).toEqual([1, 1, 1, 0, 0, 0])
  })
})
