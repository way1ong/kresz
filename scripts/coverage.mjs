// Звіт про покриття KRESZ питаннями, написаними вручну: скільки питань посилається на кожен параграф.
// Запуск: npm run coverage
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sections = JSON.parse(readFileSync(join(root, 'scripts/kresz-sections.json'), 'utf8'))
const dir = join(root, 'src/content/questions')

const counts = new Map(sections.map((s) => [s.section, 0]))
let total = 0
let other = 0
for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
  for (const question of JSON.parse(readFileSync(join(dir, file), 'utf8'))) {
    total += 1
    const refs = new Set([...question.kreszRef.matchAll(/(\d+(?:\/[A-Z])?)\. §/g)].map((m) => m[1]))
    // «1. számú függelék» (означення термінів) рахуємо разом із 2. § «Fogalmak».
    if (/függelék/.test(question.kreszRef)) refs.add('2')
    const known = [...refs].filter((ref) => counts.has(ref))
    if (!question.kreszRef.startsWith('KRESZ') || known.length === 0) other += 1
    for (const ref of known) counts.set(ref, counts.get(ref) + 1)
  }
}

const bar = (n) => '█'.repeat(Math.min(n, 30))
console.log(`Питань у файлах тем: ${total} (з них без посилання на параграф KRESZ: ${other})\n`)
for (const { section, title, minor } of sections) {
  const n = counts.get(section)
  console.log(`${(section + '. §').padEnd(9)} ${String(n).padStart(3)} ${bar(n).padEnd(31)} ${title}${minor ? '  (другорядний для категорії B)' : ''}`)
}
const gaps = sections.filter((s) => !s.minor && counts.get(s.section) <= 1)
console.log(`\nПараграфи з 0–1 питанням (${gaps.length}):`)
for (const { section, title } of gaps) console.log(`  ${section}. § — ${title} (${counts.get(section)})`)
console.log('\nЗгенеровані питання (знаки 11–17. §, терміни, ситуації 28. і 31. §) сюди не входять.')
