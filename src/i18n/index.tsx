import { useCallback } from 'react'
import { useSettings, type LangMode } from '../store/settings'
import hu from './hu.json'
import ua from './ua.json'

export type Lang = 'hu' | 'ua'
export type TKey = keyof typeof hu
export type TVars = Record<string, string | number>

// Перевірка на етапі компіляції: обидва файли перекладів мають однакові ключі.
const DICT: Record<Lang, Record<TKey, string>> = { hu, ua }
const _noExtraKeys: Record<keyof typeof ua, string> = hu
void _noExtraKeys

/** Атрибут lang для HTML (українська — "uk"). */
export const HTML_LANG: Record<Lang, string> = { hu: 'hu', ua: 'uk' }

export function translate(lang: Lang, key: TKey, vars?: TVars): string {
  const template = DICT[lang][key] ?? key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
}

export function primaryLang(mode: LangMode): Lang {
  return mode === 'ua' ? 'ua' : 'hu'
}

/** Друга мова показується лише в режимі HU+UA. */
export function secondaryLang(mode: LangMode): Lang | null {
  return mode === 'both' ? 'ua' : null
}

/** Переклад рядком — для атрибутів (aria-label, title). Повертає основну мову. */
export function useT() {
  const { lang } = useSettings()
  const primary = primaryLang(lang)
  return useCallback((key: TKey, vars?: TVars) => translate(primary, key, vars), [primary])
}

interface BiProps {
  hu: string
  ua: string
  /** inline — «HU · UA» в один рядок; block — український текст окремим рядком під угорським. */
  layout?: 'block' | 'inline'
  /** Примусовий режим мови (наприклад, іспит лише угорською). */
  mode?: LangMode
  /** У режимі HU+UA показати лише основну (угорську) мову — для тісних місць. */
  primaryOnly?: boolean
  className?: string
}

/** Двомовний текст: угорський основний, український під ним (у режимі HU+UA). */
export function Bi({ hu: huText, ua: uaText, layout = 'block', mode, primaryOnly, className }: BiProps) {
  const settings = useSettings()
  const requested = mode ?? settings.lang
  const lang = primaryOnly && requested === 'both' ? 'hu' : requested
  const cls = ['bi', `bi-${layout}`, className].filter(Boolean).join(' ')
  if (lang === 'hu') {
    return (
      <span className={cls} lang="hu">
        {huText}
      </span>
    )
  }
  if (lang === 'ua') {
    return (
      <span className={cls} lang="uk">
        {uaText}
      </span>
    )
  }
  return (
    <span className={cls}>
      <span className="bi-main" lang="hu">
        {huText}
      </span>
      {layout === 'inline' && <span className="bi-sep"> · </span>}
      <span className="bi-sub" lang="uk">
        {uaText}
      </span>
    </span>
  )
}

/** Рядок інтерфейсу з файлів перекладів з урахуванням режиму мови. */
export function Tx({
  k,
  vars,
  layout = 'block',
  mode,
  primaryOnly,
  className,
}: {
  k: TKey
  vars?: TVars
  layout?: 'block' | 'inline'
  mode?: LangMode
  primaryOnly?: boolean
  className?: string
}) {
  return (
    <Bi
      hu={translate('hu', k, vars)}
      ua={translate('ua', k, vars)}
      layout={layout}
      mode={mode}
      primaryOnly={primaryOnly}
      className={className}
    />
  )
}
