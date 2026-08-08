import { useCallback, useEffect } from 'react'
import { useGame } from '../../game/GameContext'
import type { ToastMessage } from '../../game/types'
import { GameIcon } from '../icons/GameIcon'

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), 2000)
    return () => window.clearTimeout(timer)
  }, [toast.id, onDismiss])

  return <article id={`toast-${toast.id}`} className={`toast toast-${toast.tone}`}>
    <span className="toast-marker" aria-hidden="true" />
    <div><strong>{toast.title}</strong><p>{toast.message}</p></div>
    <button id={`toast-dismiss-${toast.id}`} className="icon-button toast-close" type="button" aria-label={`关闭“${toast.title}”通知`} onClick={() => onDismiss(toast.id)}>
      <GameIcon name="close" size={16} />
    </button>
  </article>
}

export function ToastRegion() {
  const { state, dispatch } = useGame()
  const dismiss = useCallback((id: string) => dispatch({ type: 'DISMISS_TOAST', id }), [dispatch])

  return (
    <section className="toast-region" role="status" aria-live="polite" aria-label="游戏通知">
      {state.toasts.slice(-3).map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />)}
    </section>
  )
}
