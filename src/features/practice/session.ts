import type { Question } from '../../content/types'
import { shuffle, type Rng } from '../../lib/random'
import type { Progress } from '../../store/progress'

/**
 * Черга питань для раунду практики: спершу ті, що ще не траплялися,
 * потім ті, де остання відповідь була хибною, наприкінці — вже засвоєні.
 */
export function buildPracticeQueue(pool: Question[], progress: Progress, limit: number, rng: Rng = Math.random): string[] {
  const unseen: Question[] = []
  const wrong: Question[] = []
  const known: Question[] = []
  for (const question of pool) {
    const stat = progress.questions[question.id]
    if (!stat) unseen.push(question)
    else if (!stat.lastCorrect) wrong.push(question)
    else known.push(question)
  }
  const ordered = [...shuffle(unseen, rng), ...shuffle(wrong, rng), ...shuffle(known, rng)]
  // Усередині раунду порядок знову випадковий, щоб теми не йшли блоками.
  return shuffle(ordered.slice(0, limit), rng).map((q) => q.id)
}
