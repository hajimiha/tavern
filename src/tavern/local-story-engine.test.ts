import { describe, expect, it, vi } from 'vitest'
import { createLocalTurn } from './local-story-engine'

describe('本地六标签剧情楼层', () => {
  it('把本地回复解析成正文、选项、总结和变量快照', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const turn = await createLocalTurn({
      npcId: 'loran',
      playerText: '向她问候并询问今日的委托',
      variables: { affinity: 8, money: 1880 },
      memoryTags: [],
    })

    expect(turn.parsed.maintext).toContain('洛岚')
    expect(turn.parsed.options.length).toBeGreaterThanOrEqual(2)
    expect(turn.parsed.sum).toContain('洛岚')
    expect(turn.variablesAfter).toMatchObject({ affinity: 8, money: 1880 })
    expect(turn.raw).toContain('<maintext>')
  })
})
