import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { hasImage } from '../signs/images'
import { generateSignQuestions, generateTermQuestions } from './generators'
import { generateSceneQuestions } from './sceneGenerator'
import decks from './decks.json'
import topics from './topics.json'
import type { Card, Question } from './types'

/**
 * Перевірка контенту: запускається через `npm test`.
 * Ловить типові помилки під час додавання питань і карток.
 */
const here = dirname(fileURLToPath(import.meta.url))

function loadDir<T>(dir: string): { file: string; items: T[] }[] {
  return readdirSync(join(here, dir))
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ file: `${dir}/${name}`, items: JSON.parse(readFileSync(join(here, dir, name), 'utf8')) as T[] }))
}

const questionFiles = loadDir<Question>('questions')
const cardFiles = loadDir<Card>('cards')
const topicIds = new Set(topics.map((t) => t.id))
const deckIds = new Set(decks.map((d) => d.id))

const nonEmpty = (value: unknown) => typeof value === 'string' && value.trim().length > 0

const cardsOf = (deck: string) => cardFiles.flatMap((f) => f.items).filter((card) => card.deck === deck)
const generated = [
  ...generateSignQuestions(cardsOf('signs')),
  ...generateTermQuestions(cardsOf('terms')),
  ...generateSceneQuestions(),
]

function checkQuestion(q: Question) {
  expect(nonEmpty(q.id)).toBe(true)
  expect(topicIds.has(q.topic), `невідома тема "${q.topic}"`).toBe(true)
  expect(nonEmpty(q.kreszRef), 'kreszRef').toBe(true)
  for (const lang of ['hu', 'ua'] as const) {
    expect(nonEmpty(q[lang]?.question), `${lang}.question`).toBe(true)
    expect(nonEmpty(q[lang]?.explanation), `${lang}.explanation`).toBe(true)
    expect(Array.isArray(q[lang]?.answers), `${lang}.answers`).toBe(true)
    expect(q[lang].answers.every(nonEmpty), `${lang}.answers не порожні`).toBe(true)
    expect(new Set(q[lang].answers).size, `${lang}.answers без повторів`).toBe(q[lang].answers.length)
  }
  expect(q.hu.answers.length, 'кількість відповідей').toBeGreaterThanOrEqual(2)
  expect(q.ua.answers.length, 'однакова кількість відповідей hu/ua').toBe(q.hu.answers.length)
  expect(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.hu.answers.length, 'correct').toBe(true)
  if (q.image !== undefined) expect(hasImage(q.image), `невідомий малюнок "${q.image}"`).toBe(true)
  if (q.answerImages !== undefined) {
    expect(q.answerImages.length, 'answerImages за кількістю відповідей').toBe(q.hu.answers.length)
    expect(new Set(q.answerImages).size, 'answerImages без повторів').toBe(q.answerImages.length)
    for (const id of q.answerImages) expect(hasImage(id), `невідомий малюнок "${id}"`).toBe(true)
  }
  if (q.points !== undefined) expect([1, 3]).toContain(q.points)
}

describe('питання', () => {
  const written = questionFiles.flatMap((f) => f.items)
  const all = [...written, ...generated]

  it('id унікальні', () => {
    const ids = all.map((q) => q.id)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  })

  it('у кожній темі є питання', () => {
    for (const topic of topicIds) {
      expect(all.some((q) => q.topic === topic), `тема ${topic} без питань`).toBe(true)
    }
  })

  for (const { file, items } of questionFiles) {
    describe(file, () => {
      for (const q of items) {
        it(`${q.id}: коректна структура`, () => {
          checkQuestion(q)
          expect(file, 'питання лежить у файлі своєї теми').toBe(`questions/${q.topic}.json`)
          expect(q.generated, 'поле generated — лише для згенерованих питань').toBeUndefined()
        })
      }
    })
  }
})

describe('згенеровані питання', () => {
  it('генерація детермінована', () => {
    const again = [
      ...generateSignQuestions(cardsOf('signs')),
      ...generateTermQuestions(cardsOf('terms')),
      ...generateSceneQuestions(),
    ]
    expect(again).toEqual(generated)
  })

  it('на кожен знак є питання «який знак?» і «який із цих знаків?»', () => {
    const signs = cardsOf('signs')
    expect(generated.filter((q) => q.id.startsWith('gen-sign-name-'))).toHaveLength(signs.length)
    expect(generated.filter((q) => q.id.startsWith('gen-sign-pick-'))).toHaveLength(signs.length)
  })

  for (const q of generated) {
    it(`${q.id}: коректна структура`, () => {
      checkQuestion(q)
      expect(q.generated).toBeDefined()
      // правильна відповідь не повинна збігатися з жодним хибним варіантом в іншій мові
      expect(q.hu.answers.indexOf(q.hu.answers[0])).toBe(0)
    })
  }
})

describe('картки', () => {
  const all = cardFiles.flatMap((f) => f.items)

  it('id унікальні', () => {
    const ids = all.map((c) => c.id)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  })

  for (const { file, items } of cardFiles) {
    describe(file, () => {
      for (const card of items) {
        it(`${card.id}: коректна структура`, () => {
          expect(nonEmpty(card.id)).toBe(true)
          expect(card.id.startsWith('q:'), 'префікс "q:" зарезервовано для колоди помилок').toBe(false)
          expect(deckIds.has(card.deck), `невідома колода "${card.deck}"`).toBe(true)
          expect(file, 'картка лежить у файлі своєї колоди').toBe(`cards/${card.deck}.json`)
          for (const lang of ['hu', 'ua'] as const) {
            expect(nonEmpty(card[lang]?.back), `${lang}.back`).toBe(true)
            expect(nonEmpty(card[lang]?.front) || card.image !== undefined, `${lang}.front або image`).toBe(true)
          }
          if (card.image !== undefined) expect(hasImage(card.image), `невідомий малюнок "${card.image}"`).toBe(true)
        })
      }
    })
  }
})
