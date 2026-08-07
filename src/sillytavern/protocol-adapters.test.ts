import { describe, expect, it } from 'vitest'
import { getTavernApiPreset } from './api-config'
import { buildProviderRequest, extractProviderSseDelta, extractProviderText } from './protocol-adapters'
import type { TavernApiConfig, TavernApiProvider, TavernRequest } from './types'

const request: TavernRequest = {
  task: 'story',
  messages: [
    { role: 'system', content: '世界规则' },
    { role: 'user', content: '早上好' },
    { role: 'assistant', content: '早安' },
  ],
}

function config(provider: TavernApiProvider, patch: Partial<TavernApiConfig> = {}): TavernApiConfig {
  return {
    ...getTavernApiPreset(provider),
    temperature: 0.7,
    maxTokens: 512,
    rememberKey: false,
    providerOptions: {},
    ...patch,
  }
}

describe('供应商协议适配', () => {
  it('构造 OpenAI 与 Azure 的不同鉴权请求', () => {
    const openai = buildProviderRequest(config('deepseek'), 'secret', request, true)
    expect(openai.url).toBe('https://api.deepseek.com/chat/completions')
    expect(openai.init.headers).toMatchObject({ Authorization: 'Bearer secret' })
    expect(JSON.parse(openai.init.body as string)).toMatchObject({ stream: true, max_tokens: 512 })

    const azure = buildProviderRequest(config('azure-openai', {
      baseUrl: 'https://mistvale.openai.azure.com/openai/v1',
      model: 'story-deployment',
    }), 'azure-secret', request, true)
    expect(azure.url).toBe('https://mistvale.openai.azure.com/openai/v1/chat/completions')
    expect(azure.init.headers).toMatchObject({ 'api-key': 'azure-secret' })
    expect(azure.init.headers).not.toHaveProperty('Authorization')
  })

  it('构造 Claude Messages 请求并解析 JSON/SSE', () => {
    const built = buildProviderRequest(config('claude'), 'claude-secret', request, true)
    const body = JSON.parse(built.init.body as string)
    expect(built.url).toBe('https://api.anthropic.com/v1/messages')
    expect(built.init.headers).toMatchObject({ 'x-api-key': 'claude-secret', 'anthropic-version': '2023-06-01' })
    expect(body).toMatchObject({ system: '世界规则', stream: true, max_tokens: 512 })
    expect(body.messages).toEqual([
      { role: 'user', content: '早上好' },
      { role: 'assistant', content: '早安' },
    ])
    expect(extractProviderText('anthropic-messages', { content: [{ type: 'text', text: '完整正文' }] })).toBe('完整正文')
    expect(extractProviderSseDelta('anthropic-messages', { type: 'content_block_delta', delta: { type: 'text_delta', text: '增量' } })).toBe('增量')
  })

  it('构造 AI Studio 与 Vertex Gemini 请求并解析候选文本', () => {
    const studio = buildProviderRequest(config('google-ai-studio'), 'google-key', request, true)
    const studioBody = JSON.parse(studio.init.body as string)
    expect(studio.url).toContain('/models/gemini-2.5-flash:streamGenerateContent?alt=sse')
    expect(studio.init.headers).toMatchObject({ 'x-goog-api-key': 'google-key' })
    expect(studioBody.systemInstruction.parts[0].text).toBe('世界规则')
    expect(studioBody.contents[1]).toEqual({ role: 'model', parts: [{ text: '早安' }] })

    const vertex = buildProviderRequest(config('google-vertex-ai', {
      providerOptions: { projectId: 'mistvale-project', location: 'global' },
    }), 'oauth-token', request, true)
    expect(vertex.url).toContain('/projects/mistvale-project/locations/global/publishers/google/models/gemini-2.5-flash:streamGenerateContent?alt=sse')
    expect(vertex.init.headers).toMatchObject({ Authorization: 'Bearer oauth-token' })
    const payload = { candidates: [{ content: { parts: [{ text: '候选正文' }] } }] }
    expect(extractProviderText('gemini', payload)).toBe('候选正文')
    expect(extractProviderSseDelta('vertex-gemini', payload)).toBe('候选正文')
  })

  it('构造 Cohere 与 Cloudflare 请求并解析各自响应', () => {
    const cohere = buildProviderRequest(config('cohere'), 'cohere-key', request, true)
    expect(cohere.url).toBe('https://api.cohere.ai/v2/chat')
    expect(JSON.parse(cohere.init.body as string)).toMatchObject({ messages: request.messages, stream: true })
    expect(extractProviderText('cohere-v2', { message: { content: [{ type: 'text', text: 'Cohere 正文' }] } })).toBe('Cohere 正文')
    expect(extractProviderSseDelta('cohere-v2', { type: 'content-delta', delta: { message: { content: { text: '流片段' } } } })).toBe('流片段')

    const cloudflare = buildProviderRequest(config('cloudflare-workers-ai', {
      providerOptions: { accountId: 'account-123' },
    }), 'cf-token', request, false)
    expect(cloudflare.url).toBe('https://api.cloudflare.com/client/v4/accounts/account-123/ai/run/@cf/meta/llama-3.1-8b-instruct')
    expect(extractProviderText('cloudflare-workers-ai', { result: { response: 'Cloudflare 正文' } })).toBe('Cloudflare 正文')
  })
})
