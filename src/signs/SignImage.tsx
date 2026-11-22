import { IMAGES } from './images'

/** Малюнок (знак, схема перехрестя чи світлофор) за id. Невідомий id нічого не показує. */
export function SignImage({ id, label, size }: { id: string; label?: string; size?: number }) {
  const render = IMAGES[id]
  if (!render) return null
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label ?? id}
      style={{ maxWidth: '100%' }}
    >
      {render()}
    </svg>
  )
}
