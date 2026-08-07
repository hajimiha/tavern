import { movePromptItem } from '../../../sillytavern/editor-utils'
import { GameIcon } from '../../icons/GameIcon'

export interface PromptOrderItem { identifier: string; name?: string; role?: 'system' | 'user' | 'assistant'; enabled?: boolean }

export function PromptOrderEditor({ value, onChange }: { value: PromptOrderItem[]; onChange(next: PromptOrderItem[]): void }) {
  if (!value.length) return <div className="tavern-empty-state"><GameIcon name="quest" size={24} /><strong>尚未定义提示词顺序</strong><p>当前预设会按默认顺序组装世界书、角色卡与对话历史。</p></div>
  return <ol className="prompt-order-list">{value.map((item, index) => <li key={item.identifier}>
    <span className="prompt-order-index">{String(index + 1).padStart(2, '0')}</span>
    <label><input id={`prompt-enabled-${item.identifier}`} type="checkbox" checked={item.enabled !== false} onChange={(event) => { const next = [...value]; next[index] = { ...item, enabled: event.target.checked }; onChange(next) }} /><code>{item.identifier}</code><span>{item.name ?? item.identifier}</span></label>
    <select id={`prompt-role-${item.identifier}`} aria-label={`${item.name ?? item.identifier}角色`} value={item.role ?? 'system'} onChange={(event) => { const next = [...value]; next[index] = { ...item, role: event.target.value as PromptOrderItem['role'] }; onChange(next) }}><option value="system">系统</option><option value="user">玩家</option><option value="assistant">角色</option></select>
    <button id={`prompt-up-${item.identifier}`} type="button" aria-label={`上移${item.name ?? item.identifier}`} disabled={index === 0} onClick={() => onChange(movePromptItem(value, index, index - 1))}><GameIcon name="panUp" size={15} /></button>
    <button id={`prompt-down-${item.identifier}`} type="button" aria-label={`下移${item.name ?? item.identifier}`} disabled={index === value.length - 1} onClick={() => onChange(movePromptItem(value, index, index + 1))}><GameIcon name="panDown" size={15} /></button>
  </li>)}</ol>
}
