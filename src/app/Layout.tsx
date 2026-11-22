import type { ReactNode } from 'react'
import { Tx, useT, type TKey } from '../i18n'
import { LangSwitch } from '../components/LangSwitch'
import { Link } from './router'

const NAV: { to: string; section: string; icon: string; label: TKey }[] = [
  { to: '/', section: '', icon: '🏠', label: 'nav.home' },
  { to: '/practice', section: 'practice', icon: '📝', label: 'nav.practice' },
  { to: '/cards', section: 'cards', icon: '🃏', label: 'nav.cards' },
  { to: '/exam', section: 'exam', icon: '⏱️', label: 'nav.exam' },
  { to: '/stats', section: 'stats', icon: '📊', label: 'nav.stats' },
]

interface LayoutProps {
  /** Перший сегмент шляху — для підсвічування активної вкладки. */
  section: string
  children: ReactNode
}

export function Layout({ section, children }: LayoutProps) {
  const t = useT()
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="topbar-title">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
          <span>{t('app.title')}</span>
        </Link>
        <LangSwitch compact />
        <Link to="/settings" className="icon-btn" aria-label={t('nav.settings')} title={t('nav.settings')}>
          ⚙️
        </Link>
      </header>
      <main className="main">{children}</main>
      <nav className="bottomnav" aria-label="Menu">
        <div className="bottomnav-inner">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="navitem"
              aria-current={item.section === section ? 'page' : undefined}
            >
              <span className="navicon" aria-hidden="true">
                {item.icon}
              </span>
              <Tx k={item.label} />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
