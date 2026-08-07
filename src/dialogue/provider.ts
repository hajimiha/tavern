export interface DialogueInput {
  npcId: string
  npcName: string
  playerMessage: string
  affinity: number
  memoryTags: string[]
}

export interface DialogueChunk { text: string; done?: boolean }

export interface DialogueProvider {
  streamReply(input: DialogueInput, signal: AbortSignal): AsyncGenerator<DialogueChunk>
}
