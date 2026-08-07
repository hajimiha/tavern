import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadGameRules, saveGameRules } from './game-settings-storage'
import { gameReducer, initialGameState } from './reducer'
import type { GameAction, GameProviderProps, GameState } from './types'

interface GameContextValue { state: GameState; dispatch: React.Dispatch<GameAction> }

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children, initialState }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState, (provided) => ({
    ...(provided ?? initialGameState),
    rules: provided?.rules ?? loadGameRules(),
  }))
  useEffect(() => saveGameRules(state.rules), [state.rules])
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const value = useContext(GameContext)
  if (!value) throw new Error('useGame 必须在 GameProvider 内使用')
  return value
}
