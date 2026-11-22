import { useState } from 'react'
import { Tile } from '../../components/ui'
import { DECKS } from '../../content'
import { Bi, Tx } from '../../i18n'
import { useProgress } from '../../store/progress'
import { deckItems, dueItems, MISTAKES_DECK } from './decks'

function Counts({ total, due }: { total: number; due: number }) {
  return (
    <span className="row" style={{ gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
      <span className={due > 0 ? 'badge' : 'badge badge-muted'}>
        <Tx k="cards.due" vars={{ n: due }} primaryOnly />
      </span>
      <span className="badge badge-muted">
        <Tx k="cards.total" vars={{ n: total }} primaryOnly />
      </span>
    </span>
  )
}

export function CardDecksPage() {
  const progress = useProgress()
  const [now] = useState(() => Date.now())
  const mistakes = deckItems(MISTAKES_DECK, progress)

  return (
    <>
      <h1>
        <Tx k="cards.title" />
      </h1>
      {DECKS.map((deck) => {
        const items = deckItems(deck.id, progress)
        return (
          <Tile
            key={deck.id}
            to={`/cards/${deck.id}`}
            icon={deck.icon}
            title={<Bi hu={deck.hu} ua={deck.ua} layout="inline" />}
            desc={<Counts total={items.length} due={dueItems(items, progress, now).length} />}
          />
        )
      })}
      <Tile
        to={`/cards/${MISTAKES_DECK}`}
        icon="❗"
        title={<Tx k="cards.mistakes.title" layout="inline" />}
        desc={
          <>
            <Tx k="cards.mistakes.desc" />
            <Counts total={mistakes.length} due={dueItems(mistakes, progress, now).length} />
          </>
        }
      />
      <Tile to="/cards/guide" icon="🗂️" title={<Tx k="gallery.title" layout="inline" />} desc={<Tx k="gallery.desc" />} />
      <p className="muted small">
        <Tx k="cards.leitnerInfo" />
      </p>
    </>
  )
}
