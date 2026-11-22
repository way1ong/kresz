import { seededRng, shuffle } from '../lib/random'
import type { Card, Question } from './types'

/**
 * Питання, згенеровані з уже звірених даних (карток знаків і термінів).
 * Генерація детермінована: ті самі картки завжди дають ті самі питання з тими самими id,
 * тож прогрес користувача за ними зберігається.
 */

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const sectionOf = (card: Card) => /KRESZ (\d+)\. §/.exec(card.kreszRef ?? '')?.[1] ?? ''

/** Угорський означений артикль: «az» перед голосною, «a» перед приголосною. */
function article(word: string): string {
  const first = word.replace(/^[^A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]+/, '').charAt(0)
  return /[aáeéiíoóöőuúüű]/i.test(first) ? 'az' : 'a'
}

/** Хибні варіанти: спершу з тієї самої категорії знаків, назви не повторюються. */
function pickDistractors(card: Card, pool: Card[], count: number, key: string): Card[] {
  const rng = seededRng(hash(key))
  const usable = pool.filter((c) => c.id !== card.id && c.hu.title !== card.hu.title && c.ua.title !== card.ua.title)
  const same = shuffle(usable.filter((c) => sectionOf(c) === sectionOf(card)), rng)
  const other = shuffle(usable.filter((c) => sectionOf(c) !== sectionOf(card)), rng)
  const picked: Card[] = []
  for (const candidate of [...same, ...other]) {
    if (picked.length === count) break
    if (picked.some((p) => p.hu.title === candidate.hu.title || p.ua.title === candidate.ua.title)) continue
    picked.push(candidate)
  }
  return picked
}

/** Два питання на кожен знак: «який знак на малюнку?» і «який із цих знаків — …?». */
export function generateSignQuestions(signCards: Card[]): Question[] {
  const signs = signCards.filter((card) => card.image && card.hu.title && card.ua.title)
  const questions: Question[] = []
  for (const card of signs) {
    const image = card.image!
    const huTitle = card.hu.title!
    const uaTitle = card.ua.title!

    const byName = pickDistractors(card, signs, 2, `name:${card.id}`)
    if (byName.length === 2) {
      questions.push({
        id: `gen-sign-name-${image}`,
        topic: 'signs',
        kreszRef: card.kreszRef ?? '',
        image,
        generated: 'sign',
        hu: {
          question: 'Melyik tábla látható a képen?',
          answers: [huTitle, ...byName.map((c) => c.hu.title!)],
          explanation: card.hu.back,
        },
        ua: {
          question: 'Який знак зображено на малюнку?',
          answers: [uaTitle, ...byName.map((c) => c.ua.title!)],
          explanation: card.ua.back,
        },
        correct: 0,
      })
    }

    const byImage = pickDistractors(card, signs, 2, `pick:${card.id}`)
    if (byImage.length === 2) {
      questions.push({
        id: `gen-sign-pick-${image}`,
        topic: 'signs',
        kreszRef: card.kreszRef ?? '',
        generated: 'sign',
        answerImages: [image, ...byImage.map((c) => c.image!)],
        hu: {
          question: `Melyik tábla ${article(huTitle)} „${huTitle}”?`,
          answers: [huTitle, ...byImage.map((c) => c.hu.title!)],
          explanation: card.hu.back,
        },
        ua: {
          question: `Який із цих знаків — «${uaTitle}»?`,
          answers: [uaTitle, ...byImage.map((c) => c.ua.title!)],
          explanation: card.ua.back,
        },
        correct: 0,
      })
    }
  }
  return questions
}

/** Перше речення (до крапки чи крапки з комою) — щоб означення не підказувало термін. */
const firstClause = (text: string) => text.split(/[.;]/)[0].trim()

const groupOf = (card: Card) => /függelék (I+)\./.exec(card.kreszRef ?? '')?.[1] ?? ''

/** Питання «який термін KRESZ визначає так?» — з колоди термінів. */
export function generateTermQuestions(termCards: Card[]): Question[] {
  const questions: Question[] = []
  for (const card of termCards) {
    const definitionHu = firstClause(card.hu.back)
    const definitionUa = firstClause(card.ua.back)
    // Якщо означення містить сам термін — питання було б підказкою самому собі.
    const stem = card.hu.front.toLowerCase().slice(0, 5)
    if (definitionHu.toLowerCase().includes(stem)) continue

    const rng = seededRng(hash(`term:${card.id}`))
    const others = termCards.filter((c) => c.id !== card.id)
    const candidates = [
      ...shuffle(others.filter((c) => groupOf(c) === groupOf(card)), rng),
      ...shuffle(others.filter((c) => groupOf(c) !== groupOf(card)), rng),
    ].slice(0, 2)
    if (candidates.length < 2) continue

    questions.push({
      id: `gen-${card.id}`,
      topic: 'terms',
      kreszRef: card.kreszRef ?? '',
      generated: 'term',
      hu: {
        question: `Melyik fogalmat határozza meg így a KRESZ? „${definitionHu}.”`,
        answers: [card.hu.front, ...candidates.map((c) => c.hu.front)],
        explanation: `${card.hu.front}: ${card.hu.back}`,
      },
      ua: {
        question: `Який термін KRESZ визначає так: «${definitionUa}»?`,
        answers: [card.ua.front, ...candidates.map((c) => c.ua.front)],
        explanation: `${card.ua.front}: ${card.ua.back}`,
      },
      correct: 0,
    })
  }
  return questions
}
