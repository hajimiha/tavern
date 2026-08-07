import './test/setup'
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('全局可测试性与应用内反馈', () => {
  afterEach(() => vi.restoreAllMocks())

  it('当前界面的所有 ID 唯一且不调用浏览器原生对话框', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false)
    const { container } = render(<App />)
    const ids = Array.from(container.querySelectorAll<HTMLElement>('[id]')).map((element) => element.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(alertSpy).not.toHaveBeenCalled()
    expect(confirmSpy).not.toHaveBeenCalled()
  })
})
