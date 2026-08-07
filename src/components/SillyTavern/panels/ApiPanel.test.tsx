import 'fake-indexeddb/auto'
import '../../../test/setup'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearSessionApiKey } from '../../../sillytavern/api-credentials'
import { createTavernDatabase, type MistvaleTavernDatabase } from '../../../sillytavern/database'
import { createTavernRepository } from '../../../sillytavern/repository'
import { TavernProvider } from '../../../tavern/TavernContext'
import { ApiPanel } from './ApiPanel'

let database: MistvaleTavernDatabase | undefined

afterEach(async () => {
  clearSessionApiKey()
  vi.unstubAllGlobals()
  if (!database) return
  database.close()
  await database.delete()
  database = undefined
})

describe('酒馆 API 控制台', () => {
  it('支持配置、显隐并按玩家选择在本机保存密钥', async () => {
    const user = userEvent.setup()
    database = createTavernDatabase(`mistvale-api-panel-${crypto.randomUUID()}`)
    const repository = createTavernRepository(database)

    render(<TavernProvider repository={repository}><ApiPanel /></TavernProvider>)

    const keyInput = await screen.findByLabelText('API 密钥')
    expect(keyInput).toHaveAttribute('id', 'tavern-api-key')
    expect(keyInput).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: '显示 API 密钥' }))
    expect(keyInput).toHaveAttribute('type', 'text')
    await user.type(keyInput, 'player-secret')
    await user.click(screen.getByLabelText('仅在这台设备上记住密钥'))
    await user.click(screen.getByRole('button', { name: '保存接口配置' }))

    expect(await screen.findByText('接口配置已保存。')).toBeVisible()
    await waitFor(async () => expect(await repository.getSettings()).toMatchObject({
      api: { rememberKey: true, persistedApiKey: 'player-secret' },
    }))
    expect(await repository.getSettings()).not.toHaveProperty('adapterMode')
  })

  it('请求模型列表并在内部状态框展示连接结果', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [{ id: 'deepseek-v4-flash' }, { id: 'deepseek-v4-pro' }],
    }), { headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    database = createTavernDatabase(`mistvale-api-test-${crypto.randomUUID()}`)

    render(<TavernProvider repository={createTavernRepository(database)}><ApiPanel /></TavernProvider>)

    const keyInput = await screen.findByLabelText('API 密钥')
    await user.type(keyInput, 'session-secret')
    const testButton = screen.getByRole('button', { name: '测试连接' })
    expect(testButton).toHaveAttribute('id', 'tavern-api-test')
    await user.click(testButton)

    expect(await screen.findByText('连接成功，发现 2 个可用模型。')).toBeVisible()
    expect(fetchMock).toHaveBeenCalledWith('https://api.deepseek.com/models', expect.any(Object))
  })

  it('按注册表展示全部供应商与云平台专属字段', async () => {
    const user = userEvent.setup()
    database = createTavernDatabase(`mistvale-api-provider-${crypto.randomUUID()}`)
    render(<TavernProvider repository={createTavernRepository(database)}><ApiPanel /></TavernProvider>)

    const providerSelect = await screen.findByLabelText('聊天补全来源')
    expect(providerSelect.querySelectorAll('option')).toHaveLength(23)
    expect(screen.queryByLabelText('对话生成方式')).not.toBeInTheDocument()

    await user.selectOptions(providerSelect, 'claude')
    expect(screen.getByDisplayValue('https://api.anthropic.com')).toBeVisible()
    expect(screen.getByRole('link', { name: '查看 Claude 官方文档' })).toHaveAttribute('href', expect.stringContaining('claude.com'))

    await user.selectOptions(providerSelect, 'cloudflare-workers-ai')
    expect(screen.getByLabelText('Account ID')).toHaveAttribute('id', 'tavern-api-option-account-id')

    await user.selectOptions(providerSelect, 'google-vertex-ai')
    expect(screen.getByLabelText('项目 ID')).toHaveAttribute('id', 'tavern-api-option-project-id')
    expect(screen.getByLabelText('区域')).toHaveAttribute('id', 'tavern-api-option-location')
    expect(screen.getAllByText(/OAuth access token/).length).toBeGreaterThan(0)
  })

  it('阻止保存缺少供应商专属字段的配置', async () => {
    const user = userEvent.setup()
    database = createTavernDatabase(`mistvale-api-validation-${crypto.randomUUID()}`)
    render(<TavernProvider repository={createTavernRepository(database)}><ApiPanel /></TavernProvider>)

    await user.selectOptions(await screen.findByLabelText('聊天补全来源'), 'cloudflare-workers-ai')
    await user.type(screen.getByLabelText('API 密钥'), 'cloudflare-token')
    await user.click(screen.getByRole('button', { name: '保存接口配置' }))

    expect(await screen.findByText(/请填写 Account ID/)).toHaveAttribute('role', 'alert')
  })
})
