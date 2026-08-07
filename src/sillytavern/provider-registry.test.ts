import { describe, expect, it } from 'vitest'
import { TAVERN_PROVIDERS, getTavernProvider } from './provider-registry'

describe('酒馆供应商注册表', () => {
  it('包含参考清单、OpenAI 与自定义兼容接口且 ID 唯一', () => {
    const ids = TAVERN_PROVIDERS.map((provider) => provider.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(expect.arrayContaining([
      'azure-openai', 'chutes', 'claude', 'cloudflare-workers-ai', 'cohere', 'deepseek',
      'electron-hub', 'fireworks', 'groq', 'google-ai-studio', 'google-vertex-ai', 'mistral',
      'minimax', 'moonshot', 'nanogpt', 'openrouter', 'perplexity', 'pollinations',
      'siliconflow', 'xai', 'zai', 'openai', 'openai-compatible',
    ]))
  })

  it('为专用协议与额外配置声明官方路由', () => {
    expect(getTavernProvider('claude')).toMatchObject({
      protocol: 'anthropic-messages',
      baseUrl: 'https://api.anthropic.com',
      chatPath: '/v1/messages',
      auth: 'x-api-key',
    })
    expect(getTavernProvider('google-ai-studio')).toMatchObject({ protocol: 'gemini', auth: 'google-api-key' })
    expect(getTavernProvider('google-vertex-ai')).toMatchObject({
      protocol: 'vertex-gemini',
      requiredOptions: expect.arrayContaining(['projectId', 'location']),
    })
    expect(getTavernProvider('cloudflare-workers-ai')).toMatchObject({
      protocol: 'cloudflare-workers-ai',
      requiredOptions: ['accountId'],
    })
    expect(getTavernProvider('cohere').modelsPath).toBe('/v1/models')
    expect(getTavernProvider('perplexity').baseUrl).toBe('https://api.perplexity.ai')
    expect(getTavernProvider('zai').baseUrl).toBe('https://api.z.ai/api/paas/v4')
  })
})
