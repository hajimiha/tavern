import type {
  TavernApiAuth,
  TavernApiProtocol,
  TavernApiProvider,
  TavernProviderOptionKey,
} from './types'

export type TavernProviderGroup = 'official' | 'gateway' | 'cloud' | 'custom'

export interface TavernProviderDefinition {
  id: TavernApiProvider
  label: string
  group: TavernProviderGroup
  protocol: TavernApiProtocol
  auth: TavernApiAuth
  baseUrl: string
  chatPath: string
  modelsPath?: string
  defaultModel: string
  docsUrl: string
  requiredOptions: TavernProviderOptionKey[]
  note: string
}

export const TAVERN_PROVIDERS: readonly TavernProviderDefinition[] = [
  { id: 'openai', label: 'OpenAI', group: 'official', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.openai.com/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: '', docsUrl: 'https://platform.openai.com/docs/api-reference/chat', requiredOptions: [], note: 'OpenAI 官方 Chat Completions 接口。' },
  { id: 'deepseek', label: 'DeepSeek', group: 'official', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.deepseek.com', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: 'deepseek-v4-flash', docsUrl: 'https://api-docs.deepseek.com/', requiredOptions: [], note: 'DeepSeek 官方兼容接口。' },
  { id: 'claude', label: 'Claude', group: 'official', protocol: 'anthropic-messages', auth: 'x-api-key', baseUrl: 'https://api.anthropic.com', chatPath: '/v1/messages', modelsPath: '/v1/models', defaultModel: 'claude-opus-4-8', docsUrl: 'https://platform.claude.com/docs/en/api/messages/create', requiredOptions: [], note: 'Anthropic Messages 原生协议。' },
  { id: 'google-ai-studio', label: 'Google AI Studio', group: 'official', protocol: 'gemini', auth: 'google-api-key', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', chatPath: '/models/{model}:streamGenerateContent?alt=sse', modelsPath: '/models', defaultModel: 'gemini-2.5-flash', docsUrl: 'https://ai.google.dev/api/generate-content', requiredOptions: [], note: 'Gemini 原生 GenerateContent 协议。' },
  { id: 'mistral', label: 'MistralAI', group: 'official', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.mistral.ai/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: 'mistral-small-latest', docsUrl: 'https://docs.mistral.ai/api/', requiredOptions: [], note: 'Mistral 官方兼容接口。' },
  { id: 'minimax', label: 'MiniMax', group: 'official', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.minimax.io/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: 'MiniMax-M2.7', docsUrl: 'https://platform.minimax.io/docs/api-reference/api-overview', requiredOptions: [], note: 'MiniMax 国际站 OpenAI 兼容入口。' },
  { id: 'moonshot', label: 'Moonshot AI', group: 'official', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.moonshot.ai/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: 'kimi-k2.6', docsUrl: 'https://platform.kimi.ai/docs/api/overview', requiredOptions: [], note: 'Kimi/Moonshot 官方兼容接口。' },
  { id: 'perplexity', label: 'Perplexity', group: 'official', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.perplexity.ai', chatPath: '/chat/completions', defaultModel: 'sonar', docsUrl: 'https://docs.perplexity.ai/docs/getting-started/quickstart', requiredOptions: [], note: 'Perplexity Sonar Chat Completions。' },
  { id: 'xai', label: 'xAI (Grok)', group: 'official', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.x.ai/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: 'grok-4-fast', docsUrl: 'https://api.x.ai/docs/', requiredOptions: [], note: 'xAI 官方 OpenAI 兼容接口。' },
  { id: 'zai', label: 'Z.AI (GLM)', group: 'official', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.z.ai/api/paas/v4', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: 'glm-5.1', docsUrl: 'https://docs.z.ai/api-reference/llm/chat-completion', requiredOptions: [], note: 'Z.AI GLM 官方 Chat Completions。' },
  { id: 'chutes', label: 'Chutes', group: 'gateway', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://llm.chutes.ai/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: '', docsUrl: 'https://chutes.ai/docs/getting-started/running-a-chute', requiredOptions: [], note: '模型变化频繁，建议先读取模型列表。' },
  { id: 'electron-hub', label: 'Electron Hub', group: 'gateway', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.electronhub.ai/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: '', docsUrl: 'https://docs.electronhub.ai/api-reference/chat/completions', requiredOptions: [], note: '统一模型推理网关。' },
  { id: 'fireworks', label: 'Fireworks AI', group: 'gateway', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.fireworks.ai/inference/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: '', docsUrl: 'https://docs.fireworks.ai/api-reference/post-chatcompletions', requiredOptions: [], note: 'Fireworks OpenAI 兼容推理接口。' },
  { id: 'groq', label: 'Groq', group: 'gateway', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.groq.com/openai/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: '', docsUrl: 'https://console.groq.com/docs/api-reference', requiredOptions: [], note: '低延迟推理网关，建议读取模型列表。' },
  { id: 'nanogpt', label: 'NanoGPT', group: 'gateway', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://nano-gpt.com/api/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: '', docsUrl: 'https://docs.nano-gpt.com/', requiredOptions: [], note: '多模型 OpenAI 兼容网关。' },
  { id: 'openrouter', label: 'OpenRouter', group: 'gateway', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://openrouter.ai/api/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: '', docsUrl: 'https://openrouter.ai/docs/api/reference/chat-completion', requiredOptions: [], note: '跨供应商模型路由。' },
  { id: 'pollinations', label: 'Pollinations', group: 'gateway', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://gen.pollinations.ai/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: 'openai', docsUrl: 'https://github.com/pollinations/pollinations/blob/main/APIDOCS.md', requiredOptions: [], note: 'Pollinations 统一生成接口。' },
  { id: 'siliconflow', label: 'SiliconFlow', group: 'gateway', protocol: 'openai-chat', auth: 'bearer', baseUrl: 'https://api.siliconflow.cn/v1', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: '', docsUrl: 'https://docs.siliconflow.cn/cn/userguide/capabilities/text-generation', requiredOptions: [], note: '硅基流动兼容接口。' },
  { id: 'azure-openai', label: 'Azure OpenAI', group: 'cloud', protocol: 'azure-openai', auth: 'api-key', baseUrl: 'https://YOUR-RESOURCE-NAME.openai.azure.com/openai/v1', chatPath: '/chat/completions', defaultModel: '', docsUrl: 'https://learn.microsoft.com/zh-cn/rest/api/microsoft-foundry/azureopenai/chat', requiredOptions: [], note: '将资源名替换为自己的 Azure 终结点，模型填写部署名。' },
  { id: 'cloudflare-workers-ai', label: 'Cloudflare Workers AI', group: 'cloud', protocol: 'cloudflare-workers-ai', auth: 'bearer', baseUrl: 'https://api.cloudflare.com/client/v4', chatPath: '/accounts/{accountId}/ai/run/{model}', defaultModel: '@cf/meta/llama-3.1-8b-instruct', docsUrl: 'https://developers.cloudflare.com/workers-ai/get-started/rest-api/', requiredOptions: ['accountId'], note: '需要 Cloudflare Account ID。' },
  { id: 'cohere', label: 'Cohere', group: 'cloud', protocol: 'cohere-v2', auth: 'bearer', baseUrl: 'https://api.cohere.ai', chatPath: '/v2/chat', modelsPath: '/v1/models', defaultModel: 'command-a-03-2025', docsUrl: 'https://docs.cohere.com/v2/reference/chat', requiredOptions: [], note: 'Cohere v2 Chat 原生协议。' },
  { id: 'google-vertex-ai', label: 'Google Vertex AI', group: 'cloud', protocol: 'vertex-gemini', auth: 'bearer', baseUrl: 'https://aiplatform.googleapis.com/v1', chatPath: '/projects/{projectId}/locations/{location}/publishers/google/models/{model}:streamGenerateContent?alt=sse', defaultModel: 'gemini-2.5-flash', docsUrl: 'https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart', requiredOptions: ['projectId', 'location'], note: '密钥字段填写 OAuth access token。' },
  { id: 'openai-compatible', label: '自定义（兼容 OpenAI）', group: 'custom', protocol: 'openai-chat', auth: 'bearer', baseUrl: '', chatPath: '/chat/completions', modelsPath: '/models', defaultModel: '', docsUrl: 'https://platform.openai.com/docs/api-reference/chat', requiredOptions: [], note: '填写兼容 OpenAI Chat Completions 的基础地址。' },
] as const

const byId = new Map<TavernApiProvider, TavernProviderDefinition>(TAVERN_PROVIDERS.map((provider) => [provider.id, provider]))

export function getTavernProvider(id: TavernApiProvider): TavernProviderDefinition {
  const provider = byId.get(id)
  if (!provider) throw new Error(`未知的模型供应商：${id}`)
  return provider
}

export function isTavernApiProvider(value: unknown): value is TavernApiProvider {
  return typeof value === 'string' && byId.has(value as TavernApiProvider)
}
