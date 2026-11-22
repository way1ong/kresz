import { useState } from 'react'
import { ProgressBar, Tile } from '../../components/ui'
import { Link } from '../../app/router'
import { BACKUP_CONFIG } from '../../config/backup'
import { EXAM_CONFIG } from '../../config/exam'
import { DECKS, QUESTIONS } from '../../content'
import { Tx } from '../../i18n'
import { useExamSession } from '../../store/exam'
import { useProgress } from '../../store/progress'
import { updateSettings, useSettings } from '../../store/settings'
import { deckItems, dueItems, MISTAKES_DECK } from '../cards/decks'

export function HomePage() {
  const progress = useProgress()
  const examSession = useExamSession()
  const [now] = useState(() => Date.now())
  const settings = useSettings()

  const DAY_MS = 24 * 60 * 60 * 1000
  const answers = Object.values(progress.questions).reduce((sum, stat) => sum + stat.seen, 0)
  const backupStale =
    settings.lastBackupAt === null || now - settings.lastBackupAt > BACKUP_CONFIG.remindAfterDays * DAY_MS
  const showBackupReminder =
    answers >= BACKUP_CONFIG.minAnswers && backupStale && now >= settings.backupSnoozedUntil

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

      {showBackupReminder && (
        <section className="notice stack">
          <Tx k="home.backup.text" />
          <div className="btn-row">
            <button
              type="button"
              className="btn"
              onClick={() => updateSettings({ backupSnoozedUntil: Date.now() + BACKUP_CONFIG.snoozeDays * DAY_MS })}
            >
              <Tx k="home.backup.later" primaryOnly />
            </button>
            <Link to="/settings" className="btn btn-primary">
              <Tx k="home.backup.go" primaryOnly />
            </Link>
          </div>
        </section>
      )}

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
