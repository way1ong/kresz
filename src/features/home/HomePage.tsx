import { Tile } from '../../components/ui'
import { Tx } from '../../i18n'

export function HomePage() {
  return (
    <>
      <div className="stack" style={{ gap: 4 }}>
        <h1>
          <Tx k="home.subtitle" />
        </h1>
      </div>
      <Tile to="/practice" icon="📝" title={<Tx k="nav.practice" />} desc={<Tx k="home.practice.desc" />} />
      <Tile to="/cards" icon="🃏" title={<Tx k="nav.cards" />} desc={<Tx k="home.cards.desc" />} />
      <Tile to="/exam" icon="⏱️" title={<Tx k="nav.exam" />} desc={<Tx k="home.exam.desc" vars={{ count: 55, minutes: 55 }} />} />
      <Tile to="/stats" icon="📊" title={<Tx k="nav.stats" />} desc={<Tx k="home.stats.desc" />} />
    </>
  )
}
