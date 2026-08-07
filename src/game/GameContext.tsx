import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { clearGameSave, getBrowserGameStorage, loadGameSave, parseGameSave, saveGameState, serializeGameSave } from './game-save-storage'
import { loadGameRules, saveGameRules } from './game-settings-storage'
import { gameReducer, initialGameState } from './reducer'
import type { GameAction, GameProviderProps, GameState } from './types'

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  saveMeta: { enabled: boolean; restored: boolean; savedAt: number | null }
  exportGameSave(): string
  importGameSave(raw: string): boolean
  resetGameSave(): void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children, initialState, storage }: GameProviderProps) {
  const effectiveStorage = storage === undefined
    ? getBrowserGameStorage()
    : storage ?? undefined
  const persistenceEnabled = initialState === undefined && storage !== null && effectiveStorage !== undefined
  const [bootstrap] = useState(() => {
    if (initialState) return { state: initialState, restored: false, savedAt: null as number | null }
    const saved = loadGameSave(effectiveStorage)
    return saved
      ? { state: saved.state, restored: true, savedAt: saved.savedAt as number | null }
      : { state: { ...initialGameState, rules: loadGameRules(effectiveStorage) }, restored: false, savedAt: null as number | null }
  })
  const [state, dispatch] = useReducer(gameReducer, bootstrap.state)
  const [savedAt, setSavedAt] = useState<number | null>(bootstrap.savedAt)
  const [storageAvailable, setStorageAvailable] = useState(persistenceEnabled)

  useEffect(() => {
    saveGameRules(state.rules, effectiveStorage)
    if (!persistenceEnabled) return
    const envelope = saveGameState(state, effectiveStorage)
    if (envelope) setSavedAt(envelope.savedAt)
    else setStorageAvailable(false)
  }, [state, effectiveStorage, persistenceEnabled])

  const exportGameSave = useCallback(() => serializeGameSave(state), [state])
  const importGameSave = useCallback((raw: string) => {
    const imported = parseGameSave(raw)
    if (!imported) return false
    const envelope = persistenceEnabled ? saveGameState(imported.state, effectiveStorage) : imported
    setSavedAt(envelope?.savedAt ?? null)
    if (persistenceEnabled && !envelope) setStorageAvailable(false)
    dispatch({ type: 'REPLACE_GAME_STATE', state: imported.state })
    return true
  }, [effectiveStorage, persistenceEnabled])
  const resetGameSave = useCallback(() => {
    clearGameSave(effectiveStorage)
    setSavedAt(null)
    dispatch({ type: 'REPLACE_GAME_STATE', state: { ...initialGameState, rules: { ...initialGameState.rules } } })
  }, [effectiveStorage])
  const value = useMemo(() => ({
    state,
    dispatch,
    saveMeta: { enabled: persistenceEnabled && storageAvailable, restored: bootstrap.restored, savedAt },
    exportGameSave,
    importGameSave,
    resetGameSave,
  }), [state, persistenceEnabled, storageAvailable, bootstrap.restored, savedAt, exportGameSave, importGameSave, resetGameSave])
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const value = useContext(GameContext)
  if (!value) throw new Error('useGame 必须在 GameProvider 内使用')
  return value
}
