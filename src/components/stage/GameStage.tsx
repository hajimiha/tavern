import { useGame } from '../../game/GameContext'
import { FarmStage } from './FarmStage'
import { LocationStage } from './LocationStage'

export function GameStage() {
  const { state } = useGame()
  return state.location === 'farm' ? <FarmStage /> : <LocationStage />
}
