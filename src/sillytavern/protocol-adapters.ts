import { normalizeApiBaseUrl } from './api-config'
import { getTavernProvider } from './provider-registry'
import type { TavernApiConfig, TavernApiProtocol, TavernRequest } from './types'

export interface BuiltProviderRequest {
  url: string
  init: RequestInit
}

function joinUrl(baseUrl: string, path: string): string {
  return `${normalizeApiBaseUrl(baseUrl)}${path}`
}

function systemAndMessages(request: TavernRequest) {
  const system = request.messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n\n')
  const messages = request.messages.filter((message) => message.role !== 'system')
  return { system, messages }
}

function geminiContents(request: TavernRequest) {
  const { system, messages } = systemAndMessages(request)
  return {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents: messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
  }
}

function providerHeaders(config: TavernApiConfig, apiKey: string): Record<string, string> {
  const provider = getTavernProvider(config.provider)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (provider.auth === 'bearer') headers.Authorization = `Bearer ${apiKey}`
  if (provider.auth === 'api-key') headers['api-key'] = apiKey
  if (provider.auth === 'x-api-key') {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
  }
  if (provider.auth === 'google-api-key') headers['x-goog-api-key'] = apiKey
  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://github.com/hajimiha/tavern'
    headers['X-Title'] = '雾灯谷纪事'
  }
  return headers
}

function resolveChatPath(config: TavernApiConfig, stream: boolean): string {
  const definition = getTavernProvider(config.provider)
  let path = definition.chatPath
    .replace('{model}', config.model.replace(/^models\//, ''))
    .replace('{accountId}', encodeURIComponent(config.providerOptions.accountId ?? ''))
    .replace('{projectId}', encodeURIComponent(config.providerOptions.projectId ?? ''))
    .replace('{location}', encodeURIComponent(config.providerOptions.location ?? ''))
  if (!stream && (definition.protocol === 'gemini' || definition.protocol === 'vertex-gemini')) {
    path = path.replace(':streamGenerateContent?alt=sse', ':generateContent')
  }
  return path
}

export function buildProviderRequest(
  config: TavernApiConfig,
  apiKey: string,
  request: TavernRequest,
  stream: boolean,
): BuiltProviderRequest {
  const provider = getTavernProvider(config.provider)
  const url = joinUrl(config.baseUrl, resolveChatPath(config, stream))
  const common = { model: config.model, temperature: config.temperature }
  const openAiSampling = {
    top_p: config.topP,
    frequency_penalty: config.frequencyPenalty,
    presence_penalty: config.presencePenalty,
  }
  let body: Record<string, unknown>

  if (provider.protocol === 'anthropic-messages') {
    const { system, messages } = systemAndMessages(request)
    body = { ...common, max_tokens: config.maxResponseLength, top_p: config.topP, stream, messages, ...(system ? { system } : {}) }
  } else if (provider.protocol === 'gemini' || provider.protocol === 'vertex-gemini') {
    body = {
      ...geminiContents(request),
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxResponseLength,
        topP: config.topP,
        frequencyPenalty: config.frequencyPenalty,
        presencePenalty: config.presencePenalty,
      },
    }
  } else if (provider.protocol === 'cohere-v2') {
    body = {
      ...common,
      max_tokens: config.maxResponseLength,
      p: config.topP,
      frequency_penalty: config.frequencyPenalty,
      presence_penalty: config.presencePenalty,
      stream,
      messages: request.messages,
    }
  } else if (provider.protocol === 'cloudflare-workers-ai') {
    body = { messages: request.messages, temperature: config.temperature, top_p: config.topP, max_tokens: config.maxResponseLength, stream }
  } else {
    body = { ...common, ...openAiSampling, messages: request.messages, max_tokens: config.maxResponseLength, stream }
  }

  return {
    url,
    init: {
      method: 'POST',
      headers: providerHeaders(config, apiKey),
      body: JSON.stringify(body),
    },
  }
}

export function buildProviderModelsRequest(config: TavernApiConfig, apiKey: string): BuiltProviderRequest | null {
  const provider = getTavernProvider(config.provider)
  if (!provider.modelsPath) return null
  return {
    url: joinUrl(config.baseUrl, provider.modelsPath),
    init: { method: 'GET', headers: providerHeaders(config, apiKey) },
  }
}

function partsText(parts: unknown): string {
  if (!Array.isArray(parts)) return ''
  return parts.map((part) => {
    if (!part || typeof part !== 'object') return ''
    return typeof (part as { text?: unknown }).text === 'string' ? (part as { text: string }).text : ''
  }).join('')
}

export function extractProviderText(protocol: TavernApiProtocol, payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const value = payload as Record<string, any>
  if (protocol === 'anthropic-messages') return partsText(value.content)
  if (protocol === 'gemini' || protocol === 'vertex-gemini') {
    return (Array.isArray(value.candidates) ? value.candidates : [])
      .map((candidate: any) => partsText(candidate?.content?.parts))
      .join('')
  }
  if (protocol === 'cohere-v2') return partsText(value.message?.content)
  if (protocol === 'cloudflare-workers-ai') {
    if (typeof value.result?.response === 'string') return value.result.response
    if (typeof value.response === 'string') return value.response
  }
  return value.choices?.[0]?.message?.content ?? value.choices?.[0]?.delta?.content ?? ''
}

export function extractProviderSseDelta(protocol: TavernApiProtocol, payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const value = payload as Record<string, any>
  if (protocol === 'anthropic-messages') {
    return value.type === 'content_block_delta' && value.delta?.type === 'text_delta' && typeof value.delta.text === 'string'
      ? value.delta.text
      : ''
  }
  if (protocol === 'cohere-v2') {
    return value.type === 'content-delta' && typeof value.delta?.message?.content?.text === 'string'
      ? value.delta.message.content.text
      : ''
  }
  if (protocol === 'cloudflare-workers-ai') {
    if (typeof value.response === 'string') return value.response
    if (typeof value.result?.response === 'string') return value.result.response
  }
  return extractProviderText(protocol, payload)
}

export function extractProviderModels(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return []
  const value = payload as Record<string, any>
  const source = Array.isArray(value.data) ? value.data : Array.isArray(value.models) ? value.models : []
  return source.map((model: any) => {
    const id = typeof model?.id === 'string' ? model.id : typeof model?.name === 'string' ? model.name : ''
    return id.replace(/^models\//, '').trim()
  }).filter(Boolean)
}
