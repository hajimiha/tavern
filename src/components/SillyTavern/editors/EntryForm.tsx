import { useState } from 'react'
import { clampNumber } from '../../../sillytavern/editor-utils'
import type { LorebookEntry } from '../../../sillytavern/types'
import { GameIcon } from '../../icons/GameIcon'

const positions: Array<{ value: LorebookEntry['position']; label: string }> = [
  { value: 'before_char', label: '角色卡之前' },
  { value: 'after_char', label: '角色卡之后' },
  { value: 'before_example', label: '示例对话之前' },
  { value: 'after_example', label: '示例对话之后' },
  { value: 'at_depth', label: '按历史深度插入' },
  { value: 'example_msg_top', label: '示例消息顶部' },
  { value: 'example_msg_bottom', label: '示例消息底部' },
  { value: 'outlet', label: '扩展出口' },
]

function ChipInput({ id, value, onChange, label }: { id: string; value: string[]; onChange(next: string[]): void; label: string }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const next = draft.trim()
    if (!next || value.includes(next)) { setDraft(''); return }
    onChange([...value, next])
    setDraft('')
  }
  return (
    <div className="tavern-chip-input">
      {value.map((keyword, index) => (
        <span key={`${keyword}-${index}`}>{keyword}<button id={`${id}-remove-${index}`} type="button" aria-label={`移除关键词${keyword}`} onClick={() => onChange(value.filter((_, current) => current !== index))}><GameIcon name="close" size={12} /></button></span>
      ))}
      <input id={id} aria-label={label} value={draft} placeholder="输入后按回车添加" onChange={(event) => setDraft(event.target.value)} onBlur={add} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add() } }} />
    </div>
  )
}

export function EntryForm({ value, onChange }: { value: LorebookEntry; onChange(patch: Partial<LorebookEntry>): void }) {
  const prefix = `lore-entry-${value.id}`
  return (
    <div className="tavern-entry-form">
      <div className="tavern-form-grid two-column">
        <label><span>主关键词</span><ChipInput id={`${prefix}-keys`} label="主关键词" value={value.keys} onChange={(keys) => onChange({ keys })} /></label>
        <label><span>次级关键词</span><ChipInput id={`${prefix}-secondary-keys`} label="次级关键词" value={value.secondaryKeys} onChange={(secondaryKeys) => onChange({ secondaryKeys })} /></label>
      </div>
      <label><span>条目备注</span><input id={`${prefix}-comment`} value={value.comment ?? ''} onChange={(event) => onChange({ comment: event.target.value })} /></label>
      <label><span>注入内容</span><textarea id={`${prefix}-content`} rows={7} value={value.content} onChange={(event) => onChange({ content: event.target.value })} /></label>
      <div className="tavern-form-grid three-column">
        <label><span>注入位置</span><select id={`${prefix}-position`} value={value.position} onChange={(event) => onChange({ position: event.target.value as LorebookEntry['position'] })}>{positions.map((position) => <option key={position.value} value={position.value}>{position.label}</option>)}</select></label>
        <label><span>优先级</span><input id={`${prefix}-order`} type="number" inputMode="numeric" value={value.order} onChange={(event) => onChange({ order: clampNumber(event.target.value, 0, 9999, 100) })} /></label>
        <label><span>触发概率</span><input id={`${prefix}-probability`} type="number" inputMode="numeric" min="0" max="100" value={value.probability} onChange={(event) => onChange({ probability: clampNumber(event.target.value, 0, 100, 100), useProbability: true })} /></label>
      </div>
      <fieldset className="tavern-toggle-fieldset"><legend>匹配行为</legend>
        <label><input id={`${prefix}-constant`} type="checkbox" checked={value.constant} onChange={(event) => onChange({ constant: event.target.checked })} />常驻条目</label>
        <label><input id={`${prefix}-selective`} type="checkbox" checked={value.selective} onChange={(event) => onChange({ selective: event.target.checked })} />启用次级匹配</label>
        <label><input id={`${prefix}-case`} type="checkbox" checked={value.caseSensitive ?? false} onChange={(event) => onChange({ caseSensitive: event.target.checked })} />区分大小写</label>
        <label><input id={`${prefix}-whole`} type="checkbox" checked={value.matchWholeWords ?? false} onChange={(event) => onChange({ matchWholeWords: event.target.checked })} />全词匹配</label>
      </fieldset>
      <details className="tavern-advanced"><summary>高级扫描设置</summary><div className="tavern-form-grid three-column">
        <label><span>扫描深度</span><input id={`${prefix}-scan-depth`} type="number" value={value.scanDepth ?? 0} onChange={(event) => onChange({ scanDepth: clampNumber(event.target.value, 0, 999, 0) })} /></label>
        <label><span>粘滞回合</span><input id={`${prefix}-sticky`} type="number" value={value.sticky ?? 0} onChange={(event) => onChange({ sticky: clampNumber(event.target.value, 0, 9999, 0) })} /></label>
        <label><span>冷却回合</span><input id={`${prefix}-cooldown`} type="number" value={value.cooldown ?? 0} onChange={(event) => onChange({ cooldown: clampNumber(event.target.value, 0, 9999, 0) })} /></label>
      </div></details>
    </div>
  )
}
