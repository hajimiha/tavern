import type { TavernApiAdapter } from './types'

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
