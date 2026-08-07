import { useGame } from '../../game/GameContext'
import { GameIcon } from '../icons/GameIcon'

export function ToastRegion() {
  const { state, dispatch } = useGame()

  return (
    <section className="toast-region" role="status" aria-live="polite" aria-label="游戏通知">
      {state.toasts.map((toast) => (
        <article id={`toast-${toast.id}`} className={`toast toast-${toast.tone}`} key={toast.id}>
          <span className="toast-marker" aria-hidden="true" />
          <div><strong>{toast.title}</strong><p>{toast.message}</p></div>
          <button id={`toast-dismiss-${toast.id}`} className="icon-button toast-close" aria-label={`关闭“${toast.title}”通知`} onClick={() => dispatch({ type: 'DISMISS_TOAST', id: toast.id })}>
            <GameIcon name="close" size={16} />
          </button>
        </article>
      ))}
    </section>
  )
}
