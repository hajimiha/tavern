import type { Npc } from '../../game/types'
import { TavernDialogue } from '../SillyTavern/TavernDialogue'

export function DialogueView({ npc }: { npc: Npc }) {
  return <TavernDialogue npc={npc} />
}
