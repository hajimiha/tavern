import { describe, expect, it, vi } from 'vitest'
import { createMistvaleDefaults } from '../sillytavern/defaults'
import type { TavernApiAdapter } from '../sillytavern/types'
import { createRemoteTurn } from './remote-story-engine'

function createAdapter(response: string) {
  const prepare = vi.fn((request) => ({
    id: 'prepared-request',
    request,
    status: 'preview' as const,
    createdAt: 1,
  }))
  const adapter: TavernApiAdapter = {
    mode: 'remote',
    label: 'DeepSeek · deepseek-v4-flash',
    prepare,
    async *stream() {
      yield { type: 'delta' as const, text: response.slice(0, 23) }
      yield { type: 'delta' as const, text: response.slice(23) }
      yield { type: 'done' as const }
    },
  }
  return { adapter, prepare }
}

describe('远程酒馆剧情引擎', () => {
  it('将角色卡、世界书、历史和变量组装后解析模型六标签响应', async () => {
    const defaults = createMistvaleDefaults()
    const card = defaults.characters.find((item) => item.npcId === 'loran')!
    const response = [
      '<thinking>查看新人的状态</thinking>',
      '<maintext>洛岚把今日的委托簿推到你面前。</maintext>',
      '<option>查看委托详情\n询问村庄近况</option>',
      '<sum>洛岚向新人展示委托。</sum>',
      '<vars>{"lastTopic":"委托"}</vars>',
    ].join('')
    const { adapter, prepare } = createAdapter(response)

    const result = await createRemoteTurn({
      api: adapter,
      playerText: '今天有什么委托？',
      history: [],
      preset: defaults.presets[0],
      lorebooks: defaults.lorebooks,
      character: card,
      userName: '旅行者',
      variables: { affinity: 0, money: 500 },
      formatPrompt: defaults.settings.formatPromptTemplate,
    })

    expect(result.parsed.maintext).toBe('洛岚把今日的委托簿推到你面前。')
    expect(result.parsed.options).toEqual(['查看委托详情', '询问村庄近况'])
    expect(result.variablesAfter).toMatchObject({ affinity: 0, money: 500, lastTopic: '委托' })
    expect(result.matchedEntryIds.length).toBeGreaterThan(0)
    expect(prepare).toHaveBeenCalledWith(expect.objectContaining({
      task: 'story',
      messages: expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.stringContaining(card.description) }),
        { role: 'user', content: '今天有什么委托？' },
      ]),
    }))
  })

  it('模型未输出标签时仍将原始文字作为正文', async () => {
    const defaults = createMistvaleDefaults()
    const { adapter } = createAdapter('洛岚抬眼看向你，示意你在壁炉边坐下。')

    const result = await createRemoteTurn({
      api: adapter,
      playerText: '我可以坐这里吗？',
      history: [],
      preset: defaults.presets[0],
      lorebooks: [],
      character: defaults.characters[0],
      userName: '旅行者',
      variables: {},
      formatPrompt: defaults.settings.formatPromptTemplate,
    })

    expect(result.parsed.maintext).toBe('洛岚抬眼看向你，示意你在壁炉边坐下。')
  })
})
