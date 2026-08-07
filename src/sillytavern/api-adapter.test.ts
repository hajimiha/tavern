import { describe, expect, it, vi } from 'vitest'
import { createDisabledTavernApi } from './api-adapter'

async function collect<T>(source: AsyncIterable<T>) {
  const result: T[] = []
  for await (const event of source) result.push(event)
  return result
}

describe('本地优先酒馆 API 适配器', () => {
  it('只生成请求预览且不会发出网络请求', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const api = createDisabledTavernApi()

    const preview = api.prepare({
      task: 'story',
      messages: [{ role: 'user', content: '你好' }],
    })

    expect(api.mode).toBe('disabled')
    expect(preview.status).toBe('preview')
    expect(preview.request.messages[0].content).toBe('你好')
    await expect(collect(api.stream(preview))).rejects.toMatchObject({
      code: 'TAVERN_API_DISABLED',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
