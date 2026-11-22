import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Tx } from '../i18n'

/** Повідомлення service worker: «готово до офлайну» та «є нова версія». */
export function PwaToast() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  // «Готово до офлайну» зникає саме; пропозиція оновлення чекає на рішення.
  useEffect(() => {
    if (!offlineReady) return
    const timer = window.setTimeout(() => setOfflineReady(false), 4000)
    return () => window.clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  if (!offlineReady && !needRefresh) return null

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="toast" role="status">
      <span className="grow">
        <Tx k={needRefresh ? 'pwa.updateAvailable' : 'pwa.offlineReady'} />
      </span>
      {needRefresh && (
        <button type="button" onClick={() => void updateServiceWorker(true)}>
          <Tx k="pwa.reload" layout="inline" />
        </button>
      )}
      <button type="button" onClick={close} aria-label="OK">
        ✕
      </button>
    </div>
  )
}
