import { getTavernProvider } from './provider-registry'
import {
  buildProviderModelsRequest,
  buildProviderRequest,
  extractProviderModels,
  extractProviderSseDelta,
  extractProviderText,
} from './protocol-adapters'
import type { TavernApiAdapter, TavernApiConfig, TavernApiProtocol, TavernPreparedRequest, TavernStreamEvent } from './types'

export type TavernApiErrorCode =
  | 'TAVERN_API_KEY_MISSING'
  | 'TAVERN_API_UNAUTHORIZED'
  | 'TAVERN_API_RATE_LIMITED'
  | 'TAVERN_API_HTTP_ERROR'
  | 'TAVERN_API_NETWORK_ERROR'
  | 'TAVERN_API_INVALID_RESPONSE'

export class TavernApiRequestError extends Error {
  constructor(
    message: string,
    readonly code: TavernApiErrorCode,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'TavernApiRequestError'
  }
}

type TavernFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export class TavernApiDisabledError extends Error {
  readonly code = 'TAVERN_API_DISABLED' as const

  constructor() {
    super('酒馆 API 接口已预留，但当前未接入任何模型。')
    this.name = 'TavernApiDisabledError'
  }
}

export function createDisabledTavernApi(): TavernApiAdapter {
  return {
    mode: 'disabled',
    label: '接口已预留 · 模型未接入',
    prepare: (request) => ({
      id: crypto.randomUUID(),
      request,
      status: 'preview',
      createdAt: Date.now(),
    }),
    async *stream() {
      throw new TavernApiDisabledError()
    },
  }
}

function requireApiKey(apiKey: string): string {
  const key = apiKey.trim()
  if (!key) {
    throw new TavernApiRequestError(
      '尚未填写 API 密钥。请前往酒馆控制台的“接口”页完成配置。',
      'TAVERN_API_KEY_MISSING',
    )
  }
  return key
}

async function providerError(response: Response): Promise<TavernApiRequestError> {
  let detail = ''
  try {
    const payload = await response.json() as { error?: { message?: string }; message?: string }
    detail = payload.error?.message || payload.message || ''
  } catch {
    detail = ''
  }
  if (response.status === 401 || response.status === 403) {
    return new TavernApiRequestError(
      'API 鉴权失败，请检查密钥是否有效以及是否有权使用所选模型。',
      'TAVERN_API_UNAUTHORIZED',
      response.status,
    )
  }
  if (response.status === 429) {
    return new TavernApiRequestError(
      'API 请求过于频繁或额度不足，请稍后再试并检查服务商账户余额。',
      'TAVERN_API_RATE_LIMITED',
      response.status,
    )
  }
  return new TavernApiRequestError(
    `模型服务返回 ${response.status}${detail ? `：${detail}` : '，请检查接口地址和模型名称。'}`,
    'TAVERN_API_HTTP_ERROR',
    response.status,
  )
}

async function fetchProvider(fetchImpl: TavernFetch, input: string, init: RequestInit): Promise<Response> {
  try {
    return await fetchImpl(input, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new TavernApiRequestError(
      '无法连接模型服务。请检查网络、接口地址，以及该服务是否允许浏览器跨域访问。',
      'TAVERN_API_NETWORK_ERROR',
    )
  }
}

async function* streamSse(response: Response, protocol: TavernApiProtocol): AsyncGenerator<TavernStreamEvent> {
  if (!response.body) {
    throw new TavernApiRequestError('模型服务没有返回可读取的响应内容。', 'TAVERN_API_INVALID_RESPONSE')
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finished = false

  while (!finished) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const lines = buffer.split(/\r?\n/)
    buffer = done ? '' : lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data) continue
      if (data === '[DONE]') {
        finished = true
        break
      }
      try {
        const content = extractProviderSseDelta(protocol, JSON.parse(data))
        if (content) yield { type: 'delta', text: content }
      } catch {
        throw new TavernApiRequestError('模型服务返回了无法解析的流式数据。', 'TAVERN_API_INVALID_RESPONSE')
      }
    }
    if (done) finished = true
  }
  yield { type: 'done' }
}

async function* streamResponse(response: Response, protocol: TavernApiProtocol): AsyncGenerator<TavernStreamEvent> {
  if (response.headers.get('content-type')?.toLowerCase().includes('text/event-stream')) {
    yield* streamSse(response, protocol)
    return
  }
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new TavernApiRequestError('模型服务返回的内容不是有效 JSON。', 'TAVERN_API_INVALID_RESPONSE')
  }
  const content = extractProviderText(protocol, payload)
  if (!content) throw new TavernApiRequestError('模型响应中没有可显示的正文。', 'TAVERN_API_INVALID_RESPONSE')
  yield { type: 'delta', text: content }
  yield { type: 'done' }
}

export function createRemoteTavernApi(
  config: TavernApiConfig,
  apiKey: string,
  fetchImpl: TavernFetch = globalThis.fetch.bind(globalThis),
): TavernApiAdapter {
  const provider = getTavernProvider(config.provider)
  return {
    mode: 'remote',
    label: `${provider.label} · ${config.model}`,
    prepare: (request) => ({
      id: crypto.randomUUID(),
      request,
      status: 'preview',
      createdAt: Date.now(),
    }),
    async *stream(prepared: TavernPreparedRequest, signal?: AbortSignal) {
      const key = requireApiKey(apiKey)
      const built = buildProviderRequest(config, key, prepared.request, true)
      const response = await fetchProvider(fetchImpl, built.url, { ...built.init, signal })
      if (!response.ok) throw await providerError(response)
      yield* streamResponse(response, provider.protocol)
    },
  }
}

export async function testTavernApiConnection(
  config: TavernApiConfig,
  apiKey: string,
  fetchImpl: TavernFetch = globalThis.fetch.bind(globalThis),
): Promise<{ models: string[] }> {
  const key = requireApiKey(apiKey)
  const modelsRequest = buildProviderModelsRequest(config, key)
  if (!modelsRequest) {
    const check = buildProviderRequest(config, key, { task: 'story', messages: [{ role: 'user', content: '请只回复“连接成功”。' }] }, false)
    const response = await fetchProvider(fetchImpl, check.url, check.init)
    if (!response.ok) throw await providerError(response)
    let payload: unknown
    try { payload = await response.json() } catch { throw new TavernApiRequestError('连接成功，但响应格式无法识别。', 'TAVERN_API_INVALID_RESPONSE') }
    if (!extractProviderText(getTavernProvider(config.provider).protocol, payload)) {
      throw new TavernApiRequestError('连接成功，但模型没有返回可识别的正文。', 'TAVERN_API_INVALID_RESPONSE')
    }
    return { models: [] }
  }
  const response = await fetchProvider(fetchImpl, modelsRequest.url, modelsRequest.init)
  if (!response.ok) throw await providerError(response)
  try {
    return { models: extractProviderModels(await response.json()) }
  } catch {
    throw new TavernApiRequestError('连接成功，但模型列表格式无法识别。', 'TAVERN_API_INVALID_RESPONSE')
  }
}
