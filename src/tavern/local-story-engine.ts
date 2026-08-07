import { mockDialogueProvider } from '../dialogue/mockProvider'
import { npcs } from '../game/data'
import { DEFAULT_OPAQUE_TAGS, DEFAULT_TAGS, type ParsedTags } from '../sillytavern/types'
import { StreamTagParser, type ParserEvent } from '../sillytavern/stream-parser'
import { aggregateEvents, applyParsedToChat } from '../sillytavern/variables'

export interface LocalTurnInput {
  npcId: string
  playerText: string
  variables?: Record<string, unknown>
  affinity?: number
  memoryTags?: string[]
  signal?: AbortSignal
}

export interface LocalTurnResult {
  raw: string
  parsed: ParsedTags
  variablesAfter: Record<string, unknown>
}

const localOptionsByRole: Record<string, string[]> = {
  村长: ['询问今日委托', '聊聊村庄近况', '暂时告辞'],
  草药师: ['请教草药知识', '询问她的近况', '暂时告辞'],
  风信使: ['打听新的消息', '分享农场见闻', '暂时告辞'],
  铁匠: ['请她检查工具', '询问矿洞情报', '暂时告辞'],
  五行魔女: ['请教五行魔法', '询问药剂配方', '暂时告辞'],
  猎人: ['请求战斗指导', '询问魔物踪迹', '暂时告辞'],
  医师: ['询问身体状态', '了解精力恢复', '暂时告辞'],
}

function createTaggedReply(npcName: string, role: string, playerText: string, reply: string): string {
  const options = localOptionsByRole[role] ?? ['继续这段话题', '询问她今天的近况', '暂时告辞']
  const safeTopic = playerText.replace(/\s+/g, ' ').slice(0, 28)
  return [
    '<thinking>本地叙事引擎依据角色卡、好感与当前记忆组织回应；未调用任何模型。</thinking>',
    `<maintext>${reply}</maintext>`,
    `<option>${options.join('\n')}</option>`,
    `<sum>${npcName}回应了你关于“${safeTopic}”的话题。</sum>`,
    '<vars>{}</vars>',
  ].join('')
}

export async function createLocalTurn(input: LocalTurnInput): Promise<LocalTurnResult> {
  const npc = npcs.find((candidate) => candidate.id === input.npcId)
  if (!npc) throw new Error(`找不到 NPC：${input.npcId}`)

  const ownController = input.signal ? null : new AbortController()
  const signal = input.signal ?? ownController!.signal
  let reply = ''
  for await (const chunk of mockDialogueProvider.streamReply({
    npcId: npc.id,
    npcName: npc.name,
    playerMessage: input.playerText,
    affinity: input.affinity ?? Number(input.variables?.affinity ?? 0),
    memoryTags: input.memoryTags ?? [],
  }, signal)) {
    reply += chunk.text
  }

  const raw = createTaggedReply(npc.name, npc.role, input.playerText, reply)
  const parser = new StreamTagParser([...DEFAULT_TAGS], [...DEFAULT_OPAQUE_TAGS])
  const events: ParserEvent[] = []
  const chunkSize = 19
  for (let cursor = 0; cursor < raw.length; cursor += chunkSize) {
    events.push(...parser.feed(raw.slice(cursor, cursor + chunkSize)))
  }
  events.push(...parser.finish())

  const parsed = aggregateEvents(events)
  const { nextVariables } = applyParsedToChat(input.variables ?? {}, parsed)
  return { raw, parsed, variablesAfter: nextVariables }
}
