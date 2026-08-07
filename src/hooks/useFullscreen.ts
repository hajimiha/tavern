import { useCallback, useEffect, useState } from 'react'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement))
  const supported = typeof document.documentElement.requestFullscreen === 'function' && typeof document.exitFullscreen === 'function'

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const toggle = useCallback(async () => {
    if (!supported) return false
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
      setIsFullscreen(Boolean(document.fullscreenElement))
      return true
    } catch {
      return false
    }
  }, [supported])

  return { isFullscreen, supported, toggle }
}
