import { useEffect, useMemo, useState } from 'react'
import { createDefaultPreset } from '../../../sillytavern/types'
import type { ChatPreset } from '../../../sillytavern/types'
import { useTavern } from '../../../tavern/TavernContext'
import { GameIcon } from '../../icons/GameIcon'
import { PromptOrderEditor, type PromptOrderItem } from '../editors/PromptOrderEditor'

const textSetting = (preset: ChatPreset, key: string) => typeof preset.settings[key] === 'string' ? preset.settings[key] as string : ''

export function PresetPanel() {
  const tavern = useTavern()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const original = tavern.presets.find((preset) => preset.id === selectedId) ?? null
  const [draft, setDraft] = useState<ChatPreset | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  useEffect(() => { if (!selectedId && tavern.presets[0]) setSelectedId(tavern.presets[0].id) }, [selectedId, tavern.presets])
  useEffect(() => { if (original) setDraft(structuredClone(original)) }, [original?.id])
  const dirty = useMemo(() => !!draft && (!original || JSON.stringify(draft) !== JSON.stringify(original)), [draft, original])
  const patch = (settings: Record<string, unknown>) => draft && setDraft({ ...draft, settings: { ...draft.settings, ...settings }, updatedAt: Date.now() })
  const create = () => { const now = Date.now(); const seed = createDefaultPreset(); const next = { ...seed, id: crypto.randomUUID(), name: `叙事预设 ${tavern.presets.length + 1}`, createdAt: now, updatedAt: now }; setSelectedId(next.id); setDraft(next) }
  const save = async () => { if (!draft) return; await tavern.savePreset({ ...draft, updatedAt: Date.now() }) }
  const remove = async () => { if (!draft) return; await tavern.deletePreset(draft.id); setPendingDelete(false); setSelectedId(tavern.presets.find((preset) => preset.id !== draft.id)?.id ?? null) }
  return <section className="tavern-panel preset-panel" aria-labelledby="preset-panel-title">
    <header className="tavern-panel-heading"><div><span>PROMPT PRESETS</span><h3 id="preset-panel-title">预设</h3><p>定义角色、世界信息和聊天历史进入上下文的顺序；当前只供本地预览。</p></div><div className="panel-heading-actions"><button id="preset-create" type="button" onClick={create}>新建预设</button><button id="preset-save" className="primary-button" type="button" disabled={!dirty} onClick={() => void save()}><GameIcon name="upload" size={17} />保存</button></div></header>
    <div className="preset-workspace"><aside className="tavern-master-list" aria-label="预设列表">{tavern.presets.map((preset) => <div key={preset.id} className={`master-list-item ${preset.id === selectedId ? 'is-active' : ''}`}><button id={`preset-select-${preset.id}`} type="button" onClick={() => setSelectedId(preset.id)}><span>{tavern.settings?.activePresetId === preset.id ? '已启用' : '本地'}</span><strong>{preset.name}</strong><small>{preset.description}</small></button></div>)}</aside>
      <main className="preset-editor">{draft ? <><div className="editor-title-row"><label><span>预设名称</span><input id={`preset-name-${draft.id}`} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label className="wide"><span>用途说明</span><input id={`preset-description-${draft.id}`} value={draft.description ?? ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><button id={`preset-activate-${draft.id}`} type="button" disabled={tavern.settings?.activePresetId === draft.id} onClick={() => void tavern.updateSettings({ activePresetId: draft.id })}>{tavern.settings?.activePresetId === draft.id ? '当前预设' : '设为当前'}</button><button id={`preset-delete-${draft.id}`} className="danger-ghost" type="button" onClick={() => setPendingDelete(true)}><GameIcon name="trash" size={15} />删除</button></div>
        <div className="preset-copy-grid"><label><span>主叙事规则</span><textarea id={`preset-main-${draft.id}`} rows={5} value={textSetting(draft, 'main')} onChange={(event) => patch({ main: event.target.value })} /></label><label><span>场景格式</span><textarea id={`preset-scenario-${draft.id}`} rows={5} value={textSetting(draft, 'scenario')} onChange={(event) => patch({ scenario: event.target.value })} /></label></div>
        <div className="prompt-order-section"><header><div><span>PROMPT ORDER</span><h4>上下文装配顺序</h4></div><small>关闭项目会保留其位置，但不会进入请求预览。</small></header><PromptOrderEditor value={(Array.isArray(draft.settings.prompt_order) ? draft.settings.prompt_order : []) as PromptOrderItem[]} onChange={(prompt_order) => patch({ prompt_order })} /></div>
      </> : <div className="tavern-empty-state"><strong>选择或新建一个预设</strong></div>}</main></div>
    {pendingDelete && <div className="tavern-confirm-bar" role="alertdialog" aria-labelledby="preset-delete-confirm"><GameIcon name="warning" size={20} /><div><strong id="preset-delete-confirm">删除“{draft?.name}”？</strong><p>已保存的会话不会删除，但会改用其他可用预设。</p></div><button id="preset-delete-cancel" type="button" onClick={() => setPendingDelete(false)}>取消</button><button id="preset-delete-commit" className="danger-button" type="button" onClick={() => void remove()}>确认删除</button></div>}
  </section>
}
