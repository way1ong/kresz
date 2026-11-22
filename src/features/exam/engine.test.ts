import { describe, expect, it } from 'vitest'
import type { Question } from '../../content/types'
import { seededRng } from '../../lib/random'
import { advanceProgram, planExam, questionMsLeft, scoreExam, startExam, type ExamOptions, type ExamRules } from './engine'

const FREE: ExamOptions = { huOnly: false, mode: 'free', perQuestionSec: 60 }
const PROGRAM: ExamOptions = { huOnly: false, mode: 'program', perQuestionSec: 60 }
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

describe('обмеження питань «на розпізнавання»', () => {
  const text = { question: 'q', answers: ['a', 'b', 'c'], explanation: 'e' }
  const recognition: Question[] = Array.from({ length: 100 }, (_, i) => ({
    id: `gen-${i}`, topic: 't', kreszRef: 'r', generated: 'sign', hu: text, ua: text, correct: 0,
  }))

  it('у повний іспит потрапляє не більше заданої кількості', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const plan = planExam([...makePool(20, 80), ...recognition], { ...RULES, maxRecognitionQuestions: 6 }, seededRng(seed))
      expect(plan.questions).toHaveLength(55)
      expect(plan.questions.filter((q) => q.generated).length).toBeLessThanOrEqual(6)
      expect(plan.reduced).toBe(false)
    }
  })

  it('якщо інших питань бракує, запас «розпізнавальних» таки використовується', () => {
    const plan = planExam([...makePool(10, 20), ...recognition], { ...RULES, maxRecognitionQuestions: 6 }, seededRng(6))
    expect(plan.questions).toHaveLength(55)
    expect(plan.questions.filter((q) => q.generated).length).toBe(25)
  })
})

describe('scoreExam', () => {
  const plan = planExam(makePool(10, 45), RULES, seededRng(5))
  const start = 1_000_000

  it('рахує бали з вагою питань і визначає «склав / не склав»', () => {
    const session = startExam(plan, FREE, start, seededRng(6))
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
    const session = startExam(plan, { ...FREE, huOnly: true }, start, seededRng(7))
    const record = scoreExam(session, () => 0, start + 99 * 60_000, true)
    expect(record.score).toBe(0)
    expect(record.timedOut).toBe(true)
    expect(record.durationSec).toBe(55 * 60)
    expect(record.items.every((item) => !item.correct && item.answer === null)).toBe(true)
  })

  it('порядок відповідей — перестановка всіх індексів', () => {
    const session = startExam(plan, FREE, start, seededRng(8))
    for (const item of session.items) expect([...item.order].sort()).toEqual([0, 1, 2])
  })
})

describe('режим «як у програмі»', () => {
  const plan = planExam(makePool(1, 2), { ...RULES, questionCount: 3, maxPoints: 5, passPoints: 4, threePointQuestions: 1 }, seededRng(9))
  const t0 = 5_000_000
  const answer = (session: ReturnType<typeof startExam>, value: number) => ({
    ...session,
    items: session.items.map((item, i) => (i === session.current ? { ...item, answer: value } : item)),
  })

  it('відповідь закриває питання; на питання є 60 секунд', () => {
    let session = startExam(plan, PROGRAM, t0, seededRng(10))
    expect(questionMsLeft(session, t0 + 15_000)).toBe(45_000)
    const step = advanceProgram(answer(session, 0), t0 + 15_000, false)
    session = step.session
    expect(step.done).toBe(false)
    expect(session.current).toBe(1)
    expect(session.items[0]).toMatchObject({ closed: true, spentMs: 15_000, answer: 0 })
    expect(questionMsLeft(session, t0 + 15_000)).toBe(60_000)
  })

  it('пропущене питання повертається в кінці із залишком часу', () => {
    let session = startExam(plan, PROGRAM, t0, seededRng(11))
    session = advanceProgram(session, t0 + 20_000, false).session // пропустили питання 1 (20 с)
    expect(session.items[0]).toMatchObject({ closed: false, spentMs: 20_000 })
    session = advanceProgram(answer(session, 1), t0 + 30_000, false).session // питання 2
    session = advanceProgram(answer(session, 2), t0 + 40_000, false).session // питання 3
    expect(session.current).toBe(0) // повернулися до пропущеного
    expect(questionMsLeft(session, t0 + 40_000)).toBe(40_000)
    const last = advanceProgram(answer(session, 0), t0 + 50_000, false)
    expect(last.done).toBe(true)
    expect(last.session.items.every((item) => item.closed)).toBe(true)
  })

  it('коли час на питання вичерпано, воно закривається без відповіді й більше не повертається', () => {
    let session = startExam(plan, PROGRAM, t0, seededRng(12))
    session = advanceProgram(session, t0 + 61_000, true).session
    expect(session.items[0]).toMatchObject({ closed: true, answer: null, spentMs: 60_000 })
    session = advanceProgram(answer(session, 0), t0 + 70_000, false).session
    const end = advanceProgram(answer(session, 0), t0 + 80_000, false)
    expect(end.done).toBe(true)
    const record = scoreExam(end.session, () => 0, t0 + 80_000, false)
    expect(record.mode).toBe('program')
    expect(record.items.filter((item) => item.correct)).toHaveLength(2)
  })

  it('єдине відкрите питання можна пропускати, доки на нього є час', () => {
    let session = startExam(plan, PROGRAM, t0, seededRng(13))
    session = advanceProgram(answer(session, 0), t0 + 1_000, false).session
    session = advanceProgram(answer(session, 0), t0 + 2_000, false).session
    const skipped = advanceProgram(session, t0 + 12_000, false)
    expect(skipped.done).toBe(false)
    expect(skipped.session.current).toBe(2)
    expect(questionMsLeft(skipped.session, t0 + 12_000)).toBe(50_000)
  })
})
