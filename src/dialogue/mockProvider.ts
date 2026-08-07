import type { DialogueInput, DialogueProvider } from './provider'

const voices: Record<string, string> = {
  loran: '壁炉上的铜壶轻轻响了一声。洛岚把你的话认真记进随身的薄册：“村庄会记得每一次真诚的选择，而我也是。”',
  daifu: '黛芙拨动悬在药锅上方的五色石：“言语也有五行。你这句话像木，温和，却会沿着心事生长。”',
  rin: '凛放下磨到一半的箭簇：“判断不错。不过到了北林，先听风，再相信眼睛。”',
  chaoyin: '潮音望向泊在雾里的船：“海不会直接回答问题，但它会把真正重要的那一句送回来。”',
}

const wait = (duration: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = setTimeout(resolve, duration)
  signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('已停止', 'AbortError')) }, { once: true })
})

export const mockDialogueProvider: DialogueProvider = {
  async *streamReply(input: DialogueInput, signal: AbortSignal) {
    const memory = input.memoryTags[0] ? `她仍记得${input.memoryTags[0]}。` : ''
    const reply = `${voices[input.npcId] ?? `${input.npcName}稍稍侧过身，耐心听完你的话：“这件事，我会放在心上。”`}${memory}`
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    for (const character of reply) {
      if (signal.aborted) return
      if (!reduced) await wait(28, signal)
      yield { text: character }
    }
    yield { text: '', done: true }
  },
}
