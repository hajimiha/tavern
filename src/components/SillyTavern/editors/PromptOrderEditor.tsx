import { useMemo, useState } from 'react'
import { movePromptItem } from '../../../sillytavern/editor-utils'
import { normalizePresetPromptRole, type PresetPromptDefinition, type PresetPromptOrderItem } from '../../../sillytavern/preset-compat'
import { GameIcon } from '../../icons/GameIcon'

export type PromptOrderItem = PresetPromptOrderItem

interface PromptOrderEditorProps {
  value: PromptOrderItem[]
  prompts?: PresetPromptDefinition[]
  onChange(next: PromptOrderItem[]): void
  onPromptChange?(identifier: string, patch: Partial<PresetPromptDefinition>): void
}

const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || 'prompt'

export function PromptOrderEditor({ value, prompts = [], onChange, onPromptChange }: PromptOrderEditorProps) {
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const promptMap = useMemo(() => new Map(prompts.map((prompt) => [prompt.identifier, prompt])), [prompts])
  const enabledCount = value.filter((item) => item.enabled !== false).length
  const shownItems = value
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => !showOnlyEnabled || item.enabled !== false)

  if (!value.length) return <div className="tavern-empty-state"><GameIcon name="quest" size={24} /><strong>尚未定义提示词顺序</strong><p>当前预设会按默认顺序组装世界书、角色卡与对话历史。</p></div>

  return <div className="prompt-order-editor">
    <div className="prompt-order-toolbar">
      <div aria-label="提示词顺序统计"><strong>{value.length} 个顺序项</strong><span>{enabledCount} 个已启用</span></div>
      <label htmlFor="prompt-order-enabled-filter"><input id="prompt-order-enabled-filter" type="checkbox" checked={showOnlyEnabled} onChange={(event) => setShowOnlyEnabled(event.target.checked)} /><span>仅看启用</span></label>
    </div>
    <ol className="prompt-order-list">{shownItems.map(({ item, originalIndex }) => {
      const prompt = promptMap.get(item.identifier)
      const name = prompt?.name ?? item.name ?? item.identifier
      const rowKey = `${item.identifier}-${originalIndex}`
      const controlId = `${safeId(item.identifier)}-${originalIndex}`
      const expanded = expandedKey === rowKey
      const itemHasRole = item.role !== undefined
      const role = normalizePresetPromptRole(item.role) ?? prompt?.role ?? 'system'
      return <li key={rowKey} className={expanded ? 'is-expanded' : undefined}>
        <div className="prompt-order-row">
          <span className="prompt-order-index">{String(originalIndex + 1).padStart(2, '0')}</span>
          <label className="prompt-order-identity" htmlFor={`prompt-enabled-${controlId}`}>
            <input id={`prompt-enabled-${controlId}`} aria-label={`启用${name}`} type="checkbox" checked={item.enabled !== false} onChange={(event) => {
              const next = [...value]
              next[originalIndex] = { ...item, enabled: event.target.checked }
              onChange(next)
            }} />
            <span><strong>{name}</strong><code>{item.identifier}</code></span>
          </label>
          <select id={`prompt-role-${controlId}`} aria-label={`${name}消息角色`} value={role} onChange={(event) => {
            const nextRole = event.target.value as PresetPromptDefinition['role']
            if (!itemHasRole && prompt && onPromptChange) onPromptChange(item.identifier, { role: nextRole })
            else {
              const next = [...value]
              next[originalIndex] = { ...item, role: nextRole }
              onChange(next)
            }
          }}><option value="system">系统</option><option value="user">玩家</option><option value="assistant">角色</option></select>
          <button id={`prompt-up-${controlId}`} type="button" aria-label={`上移${name}`} disabled={originalIndex === 0 || showOnlyEnabled} onClick={() => onChange(movePromptItem(value, originalIndex, originalIndex - 1))}><GameIcon name="panUp" size={15} /></button>
          <button id={`prompt-down-${controlId}`} type="button" aria-label={`下移${name}`} disabled={originalIndex === value.length - 1 || showOnlyEnabled} onClick={() => onChange(movePromptItem(value, originalIndex, originalIndex + 1))}><GameIcon name="panDown" size={15} /></button>
          <button id={`prompt-expand-${controlId}`} className="prompt-expand-button" type="button" aria-label={`${expanded ? '收起' : '展开'}${name}`} aria-expanded={expanded} onClick={() => setExpandedKey(expanded ? null : rowKey)}><GameIcon name={expanded ? 'panUp' : 'panDown'} size={15} /></button>
        </div>
        {expanded && <section className="prompt-order-detail" aria-label={`${name}详情`}>
          <div><span>{prompt?.marker ? '上下文标记' : '提示词正文'}</span><code>{item.identifier}</code></div>
          {prompt?.marker && !prompt.content
            ? <p>这是 SillyTavern 上下文占位标记，运行时会注入对应的角色卡、世界书或聊天历史。</p>
            : <label htmlFor={`prompt-content-${controlId}`}><span>提示词正文</span><textarea id={`prompt-content-${controlId}`} rows={7} value={prompt?.content ?? ''} disabled={!prompt || !onPromptChange} onChange={(event) => onPromptChange?.(item.identifier, { content: event.target.value })} /></label>}
        </section>}
      </li>
    })}</ol>
  </div>
}
