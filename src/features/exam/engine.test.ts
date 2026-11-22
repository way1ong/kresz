import { describe, expect, it } from 'vitest'
import type { Question } from '../../content/types'
import { seededRng } from '../../lib/random'
import { planExam, scoreExam, startExam, type ExamRules } from './engine'

const RULES: ExamRules = { questionCount: 55, durationMinutes: 55, maxPoints: 75, passPoints: 65, threePointQuestions: 10 }

function makePool(threeCount: number, oneCount: number): Question[] {
  const text = { question: 'q', answers: ['a', 'b', 'c'], explanation: 'e' }
  const make = (id: string, points?: 1 | 3): Question => ({ id, topic: 't', kreszRef: 'r', points, hu: text, ua: text, correct: 0 })
  return [
    ...Array.from({ length: threeCount }, (_, i) => make(`three-${i}`, 3)),
    ...Array.from({ length: oneCount }, (_, i) => make(`one-${i}`)),
  ]
}

describe('planExam', () => {
  it('повний іспит: 55 питань, 10 по 3 бали, максимум 75, поріг 65, 55 хвилин', () => {
    const plan = planExam(makePool(20, 80), RULES, seededRng(1))
    expect(plan.questions).toHaveLength(55)
    expect(plan.questions.filter((q) => q.points === 3)).toHaveLength(10)
    expect(new Set(plan.questions.map((q) => q.id)).size).toBe(55)
    expect(plan).toMatchObject({ maxScore: 75, passScore: 65, timeLimitSec: 55 * 60, reduced: false })
  })

  it('мала база: беремо все, час і поріг зменшуються пропорційно', () => {
    const plan = planExam(makePool(2, 9), RULES, seededRng(2))
    expect(plan.questions).toHaveLength(11)
    expect(plan.maxScore).toBe(2 * 3 + 9)
    expect(plan.passScore).toBe(Math.ceil((15 * 65) / 75))
    expect(plan.timeLimitSec).toBe(11 * 60)
    expect(plan.reduced).toBe(true)
  })

  it('якщо бракує трибальних питань — добирає однобальні, і навпаки', () => {
    const fewThree = planExam(makePool(3, 100), RULES, seededRng(3))
    expect(fewThree.questions).toHaveLength(55)
    expect(fewThree.reduced).toBe(true)
    const fewOne = planExam(makePool(40, 20), RULES, seededRng(4))
    expect(fewOne.questions).toHaveLength(55)
    expect(fewOne.questions.filter((q) => q.points === 3)).toHaveLength(35)
  })
})

describe('scoreExam', () => {
  const plan = planExam(makePool(10, 45), RULES, seededRng(5))
  const start = 1_000_000

  it('рахує бали з вагою питань і визначає «склав / не склав»', () => {
    const session = startExam(plan, false, start, seededRng(6))
    // правильна відповідь усюди 0; помиляємося в усіх трибальних (−30 балів)
    for (const item of session.items) item.answer = item.points === 3 ? 1 : 0
    const failed = scoreExam(session, () => 0, start + 600_000, false)
    expect(failed).toMatchObject({ score: 45, maxScore: 75, passed: false, durationSec: 600 })

    // 10 помилок в однобальних → рівно 65 балів, склав
    let wrong = 0
    for (const item of session.items) item.answer = item.points === 1 && wrong++ < 10 ? 2 : 0
    const passed = scoreExam(session, () => 0, start + 600_000, false)
    expect(passed).toMatchObject({ score: 65, passed: true })
  })

  it('питання без відповіді не дає балів; час не перевищує ліміт', () => {
    const session = startExam(plan, true, start, seededRng(7))
    const record = scoreExam(session, () => 0, start + 99 * 60_000, true)
    expect(record.score).toBe(0)
    expect(record.timedOut).toBe(true)
    expect(record.durationSec).toBe(55 * 60)
    expect(record.items.every((item) => !item.correct && item.answer === null)).toBe(true)
  })

  it('порядок відповідей — перестановка всіх індексів', () => {
    const session = startExam(plan, false, start, seededRng(8))
    for (const item of session.items) expect([...item.order].sort()).toEqual([0, 1, 2])
  })
})
