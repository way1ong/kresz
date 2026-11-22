import { useState } from 'react'
import { Link } from '../../app/router'
import { DECKS } from '../../content'
import { Bi, Tx } from '../../i18n'
import { shuffle } from '../../lib/random'
import { SignImage } from '../../signs/SignImage'
import { progressStore, recordCardReview, useProgress } from '../../store/progress'
import { deckItems, dueItems, MISTAKES_DECK, type ReviewItem } from './decks'
import { LEITNER } from './leitner'

interface Session {
  queue: ReviewItem[]
  revealed: boolean
  reviewed: number
}

function startSession(deckId: string, all: boolean): Session {
  const progress = progressStore.get()
  const items = deckItems(deckId, progress)
  const queue = all ? items : dueItems(items, progress, Date.now())
  return { queue: shuffle(queue).slice(0, LEITNER.sessionSize), revealed: false, reviewed: 0 }
}

export function CardReviewPage({ deckId }: { deckId: string }) {
  const progress = useProgress()
  const [session, setSession] = useState<Session>(() => startSession(deckId, false))
  const deck = DECKS.find((d) => d.id === deckId)
  const isMistakes = deckId === MISTAKES_DECK

  const title = isMistakes ? (
    <Tx k="cards.mistakes.title" layout="inline" />
  ) : deck ? (
    <Bi hu={deck.hu} ua={deck.ua} layout="inline" />
  ) : null

  const header = (
    <div className="q-head">
      <Link to="/cards" className="icon-btn" aria-label="‹">
        ‹
      </Link>
      <span className="grow" style={{ fontWeight: 700, color: 'var(--text)' }}>
        {title}
      </span>
      {session.queue.length > 0 && <span className="badge badge-muted">{session.queue.length}</span>}
    </div>
  )

  const current = session.queue[0]

  if (!current) {
    const total = deckItems(deckId, progress).length
    return (
      <>
        {header}
        <div className="card stack center">
          {total === 0 && isMistakes ? (
            <Tx k="cards.mistakes.empty" />
          ) : (
            <>
              <h2>
                <Tx k="cards.sessionDone" />
              </h2>
              <p className="muted">
                <Tx k="cards.sessionDone.desc" />
              </p>
              {session.reviewed > 0 && (
                <p className="muted small">
                  <Tx k="cards.reviewed" vars={{ n: session.reviewed }} layout="inline" />
                </p>
              )}
            </>
          )}
        </div>
        {total > 0 && (
          <button type="button" className="btn" onClick={() => setSession(startSession(deckId, true))}>
            <Tx k="cards.reviewAll" layout="inline" />
          </button>
        )}
        <Link to="/cards" className="btn btn-primary">
          <Tx k="cards.toDecks" layout="inline" />
        </Link>
      </>
    )
  }

  const state = progress.cards[current.cardId]

  const answer = (knew: boolean) => {
    recordCardReview(current.cardId, knew)
    setSession((prev) => {
      const [head, ...rest] = prev.queue
      // «Не знав» — картка повертається в кінець черги цього ж сеансу.
      return { queue: knew ? rest : [...rest, head], revealed: false, reviewed: prev.reviewed + 1 }
    })
    window.scrollTo(0, 0)
  }

  return (
    <>
      {header}
      <div className="card flashcard">
        <div>
          <span className="badge badge-muted">
            {state ? <Tx k="cards.box" vars={{ n: state.box }} primaryOnly /> : <Tx k="cards.new" primaryOnly />}
          </span>
        </div>
        {current.image && (
          <div className="q-image">
            <SignImage id={current.image} />
          </div>
        )}
        <div className="flashcard-front">
          {current.front.hu ? <Bi hu={current.front.hu} ua={current.front.ua} /> : <Tx k="cards.signPrompt" />}
        </div>
        {session.revealed && (
          <div className="flashcard-back stack">
            {isMistakes && (
              <div className="muted small">
                <Tx k="cards.correctAnswer" layout="inline" />
              </div>
            )}
            <Bi hu={current.back.hu} ua={current.back.ua} />
            {current.note && (
              <div className="small" style={{ textAlign: 'left' }}>
                <Bi hu={current.note.hu} ua={current.note.ua} className="note" />
              </div>
            )}
            {current.kreszRef && <div className="kresz-ref">{current.kreszRef}</div>}
          </div>
        )}
      </div>
      <div className="sticky-actions">
        {session.revealed ? (
          <div className="btn-row">
            <button type="button" className="btn btn-bad" onClick={() => answer(false)}>
              <Tx k="cards.didntKnow" />
            </button>
            <button type="button" className="btn btn-ok" onClick={() => answer(true)}>
              <Tx k="cards.knew" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setSession((prev) => ({ ...prev, revealed: true }))}
          >
            <Tx k="cards.show" layout="inline" />
          </button>
        )}
      </div>
    </>
  )
}
