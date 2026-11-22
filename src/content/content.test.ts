import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { IMAGE_IDS } from '../signs/images'
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

describe('питання', () => {
  const all = questionFiles.flatMap((f) => f.items)

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
          expect(nonEmpty(q.id)).toBe(true)
          expect(topicIds.has(q.topic), `невідома тема "${q.topic}"`).toBe(true)
          expect(file, 'питання лежить у файлі своєї теми').toBe(`questions/${q.topic}.json`)
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
          if (q.image !== undefined) expect(IMAGE_IDS, `невідомий малюнок "${q.image}"`).toContain(q.image)
          if (q.points !== undefined) expect([1, 3]).toContain(q.points)
        })
      }
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
          if (card.image !== undefined) expect(IMAGE_IDS, `невідомий малюнок "${card.image}"`).toContain(card.image)
        })
      }
    })
  }
})
