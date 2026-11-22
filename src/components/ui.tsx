import type { ReactNode } from 'react'
import { Link } from '../app/router'

/** Велика плитка-посилання для меню й списків. */
export function Tile({
  to,
  icon,
  title,
  desc,
  right,
}: {
  to: string
  icon: ReactNode
  title: ReactNode
  desc?: ReactNode
  right?: ReactNode
}) {
  return (
    <Link to={to} className="tile">
      <span className="tile-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="grow">
        <span className="tile-title">{title}</span>
        {desc && <span className="tile-desc bi-block">{desc}</span>}
      </span>
      {right ?? (
        <span className="tile-chevron" aria-hidden="true">
          ›
        </span>
      )}
    </Link>
  )
}

export function ProgressBar({ value, max, tone }: { value: number; max: number; tone?: 'ok' | 'bad' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div
      className={tone ? `progress ${tone}` : 'progress'}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1>{children}</h1>
}
