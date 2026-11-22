import { useState } from 'react'
import { ProgressBar, Tile } from '../../components/ui'
import { EXAM_CONFIG } from '../../config/exam'
import { DECKS, QUESTIONS } from '../../content'
import { Tx } from '../../i18n'
import { useExamSession } from '../../store/exam'
import { useProgress } from '../../store/progress'
import { deckItems, dueItems, MISTAKES_DECK } from '../cards/decks'

export function HomePage() {
  const progress = useProgress()
  const examSession = useExamSession()
  const [now] = useState(() => Date.now())

  const done = QUESTIONS.filter((q) => progress.questions[q.id]).length
  const dueCards = [...DECKS.map((deck) => deck.id), MISTAKES_DECK].reduce(
    (sum, deckId) => sum + dueItems(deckItems(deckId, progress), progress, now).length,
    0,
  )

  return (
    <>
      <h1>
        <Tx k="home.subtitle" />
      </h1>

      <section className="card stack" style={{ gap: 8 }}>
        <ProgressBar value={done} max={QUESTIONS.length} tone="ok" />
        <span className="small">
          <Tx k="home.progress" vars={{ done, total: QUESTIONS.length }} />
        </span>
      </section>

      {examSession && (
        <Tile to="/exam" icon="▶️" title={<Tx k="home.resumeExam" />} />
      )}

      <Tile
        to="/practice"
        icon="📝"
        title={<Tx k="nav.practice" layout="inline" />}
        desc={<Tx k="home.practice.desc" />}
      />
      <Tile
        to="/cards"
        icon="🃏"
        title={<Tx k="nav.cards" layout="inline" />}
        desc={
          <>
            <Tx k="home.cards.desc" />
            {dueCards > 0 && (
              <span className="badge" style={{ marginTop: 6 }}>
                <Tx k="home.dueCards" vars={{ n: dueCards }} primaryOnly />
              </span>
            )}
          </>
        }
      />
      <Tile
        to="/exam"
        icon="⏱️"
        title={<Tx k="nav.exam" layout="inline" />}
        desc={
          <Tx k="home.exam.desc" vars={{ count: EXAM_CONFIG.questionCount, minutes: EXAM_CONFIG.durationMinutes }} />
        }
      />
      <Tile to="/stats" icon="📊" title={<Tx k="nav.stats" layout="inline" />} desc={<Tx k="home.stats.desc" />} />
    </>
  )
}
