import { useState } from 'react'
import { Link } from '../../app/router'
import { cardsByDeck } from '../../content'
import type { Card } from '../../content/types'
import { Bi, Tx, type TKey } from '../../i18n'
import { SignImage } from '../../signs/SignImage'

/** Категорії знаків відповідають параграфам KRESZ, у яких знаки описано. */
const CATEGORIES: { section: number; title: TKey }[] = [
  { section: 12, title: 'gallery.cat.12' },
  { section: 16, title: 'gallery.cat.16' },
  { section: 14, title: 'gallery.cat.14' },
  { section: 15, title: 'gallery.cat.15' },
  { section: 13, title: 'gallery.cat.13' },
  { section: 17, title: 'gallery.cat.17' },
  { section: 11, title: 'gallery.cat.11' },
]

function sectionOf(card: Card): number | null {
  const match = /KRESZ (\d+)\. §/.exec(card.kreszRef ?? '')
  return match ? Number(match[1]) : null
}

/** Довідник знаків: усі знаки з колоди «Знаки» за категоріями, значення — за дотиком. */
export function SignGuidePage() {
  const [openId, setOpenId] = useState<string | null>(null)
  const signs = cardsByDeck('signs').filter((card) => card.image)

  return (
    <>
      <div className="q-head">
        <Link to="/cards" className="icon-btn" aria-label="‹">
          ‹
        </Link>
        <span className="grow" style={{ fontWeight: 700, color: 'var(--text)' }}>
          <Tx k="gallery.title" layout="inline" />
        </span>
        <span className="badge badge-muted">{signs.length}</span>
      </div>
      {CATEGORIES.map(({ section, title }) => {
        const items = signs.filter((card) => sectionOf(card) === section)
        if (items.length === 0) return null
        const open = items.find((card) => card.id === openId)
        return (
          <section key={section} className="stack">
            <h2>
              <Tx k={title} />
            </h2>
            <div className="sign-grid">
              {items.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={card.id === openId ? 'sign-cell open' : 'sign-cell'}
                  aria-expanded={card.id === openId}
                  onClick={() => setOpenId(card.id === openId ? null : card.id)}
                >
                  <SignImage id={card.image!} size={64} />
                  <span className="sign-name">
                    <Bi hu={card.hu.title ?? ''} ua={card.ua.title ?? ''} />
                  </span>
                </button>
              ))}
            </div>
            {open && (
              <div className="card stack sign-detail">
                <div className="row">
                  <SignImage id={open.image!} size={88} />
                  <div className="grow">
                    <Bi hu={open.hu.back} ua={open.ua.back} />
                  </div>
                </div>
                {open.kreszRef && <div className="kresz-ref">{open.kreszRef}</div>}
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}
