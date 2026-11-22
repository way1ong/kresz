import { useSyncExternalStore } from 'react'

/**
 * Мінімальне сховище поверх localStorage: синхронне читання, підписка для React.
 * Усі дані застосунку лежать лише на пристрої користувача.
 */
export interface Store<T> {
  get(): T
  set(next: T | ((prev: T) => T)): void
  subscribe(listener: () => void): () => void
  reset(): void
}

export function createStore<T>(key: string, initial: () => T, revive?: (raw: unknown) => T): Store<T> {
  let value = load()
  const listeners = new Set<() => void>()

  function load(): T {
    try {
      const raw = globalThis.localStorage?.getItem(key)
      if (raw == null) return initial()
      const parsed: unknown = JSON.parse(raw)
      return revive ? revive(parsed) : (parsed as T)
    } catch {
      return initial()
    }
  }

  function persist() {
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(value))
    } catch {
      // Сховище недоступне або переповнене — працюємо далі в пам'яті.
    }
  }

  function emit() {
    for (const listener of listeners) listener()
  }

  if (typeof window !== 'undefined') {
    // Синхронізація між вкладками.
    window.addEventListener('storage', (event) => {
      if (event.key === key) {
        value = load()
        emit()
      }
    })
  }

  return {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
      persist()
      emit()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    reset() {
      value = initial()
      persist()
      emit()
    },
  }
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
