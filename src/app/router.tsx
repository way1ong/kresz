import { useSyncExternalStore, type AnchorHTMLAttributes } from 'react'

/**
 * Простий hash-роутер: працює на GitHub Pages без серверних редиректів
 * і в офлайні (сторінка завжди одна — index.html).
 */
function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, '')
  return hash.startsWith('/') ? hash : '/'
}

/** Сегменти шляху: "#/practice/signs" → ["practice", "signs"]. */
export function useRoute(): string[] {
  const path = useSyncExternalStore(subscribe, currentPath, currentPath)
  return path.split('/').filter(Boolean).map(decodeURIComponent)
}

export function navigate(path: string, options: { replace?: boolean } = {}) {
  const target = `#${path}`
  if (options.replace) window.location.replace(target)
  else window.location.hash = path
  window.scrollTo(0, 0)
}

export function Link({ to, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a href={`#${to}`} {...rest} />
}
