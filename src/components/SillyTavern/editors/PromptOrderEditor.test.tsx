import '../../../test/setup'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PromptOrderEditor } from './PromptOrderEditor'

describe('PromptOrderEditor', () => {
  it('shows imported SillyTavern entries, enabled count and expandable content', () => {
    const onChange = vi.fn()
    const onPromptChange = vi.fn()
    render(<PromptOrderEditor
      value={[
        { identifier: 'main', enabled: true },
        { identifier: 'jailbreak', enabled: false },
      ]}
      prompts={[
        { identifier: 'main', name: '主提示词', role: 'system', content: '主提示词正文' },
        { identifier: 'jailbreak', name: '后历史指令', role: 'system', content: '补充正文' },
      ]}
      onChange={onChange}
      onPromptChange={onPromptChange}
    />)

    expect(screen.getByText('2 个顺序项')).toBeInTheDocument()
    expect(screen.getByText('1 个已启用')).toBeInTheDocument()
    expect(screen.getByText('主提示词')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '展开主提示词' }))
    expect(screen.getByDisplayValue('主提示词正文')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: '启用后历史指令' }))
    expect(onChange).toHaveBeenCalledWith([
      { identifier: 'main', enabled: true },
      { identifier: 'jailbreak', enabled: true },
    ])
  })

  it('shows and edits an order item role before the prompt definition role', () => {
    const onChange = vi.fn()
    const onPromptChange = vi.fn()
    render(<PromptOrderEditor
      value={[{ identifier: 'geminiReply', role: 'model', enabled: true }]}
      prompts={[{ identifier: 'geminiReply', name: '模型回复', role: 'system', content: '正文' }]}
      onChange={onChange}
      onPromptChange={onPromptChange}
    />)

    const roleSelect = screen.getByRole('combobox', { name: '模型回复消息角色' })
    expect(roleSelect).toHaveValue('assistant')
    fireEvent.change(roleSelect, { target: { value: 'user' } })
    expect(onChange).toHaveBeenCalledWith([{ identifier: 'geminiReply', role: 'user', enabled: true }])
    expect(onPromptChange).not.toHaveBeenCalled()
  })
})
