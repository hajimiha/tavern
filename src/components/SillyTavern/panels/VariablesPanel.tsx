import { useEffect, useState } from 'react'
import { useGame } from '../../../game/GameContext'
import { useTavern } from '../../../tavern/TavernContext'
import { GameIcon } from '../../icons/GameIcon'

export function VariablesPanel() {
  const { state } = useGame()
  const tavern = useTavern()
  const session = tavern.activeSession ?? tavern.sessions[0] ?? null
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  useEffect(() => setDraft(session ? structuredClone(session.variables) : {}), [session?.id, session?.updatedAt])
  const save = async () => { if (session) await tavern.updateVariables(session.id, draft) }
  const add = () => { const key = newKey.trim(); if (!key || key in draft) return; setDraft({ ...draft, [key]: newValue }); setNewKey(''); setNewValue('') }
  const remove = () => { if (!pendingDelete) return; const next = { ...draft }; delete next[pendingDelete]; setDraft(next); setPendingDelete(null) }
  const mirrors = [{ label: '金币', value: state.money }, { label: '精力', value: `${state.energy}/${state.maxEnergy}` }, { label: '生命', value: `${state.stats.health}/${state.stats.maxHealth}` }, { label: '魔力', value: `${state.stats.mana}/${state.stats.maxMana}` }, { label: '日期', value: `${state.season} · 第${state.day}日` }, { label: '地点', value: state.location }]
  return <section className="tavern-panel variables-panel" aria-labelledby="variables-panel-title"><header className="tavern-panel-heading"><div><span>STATE MIRROR</span><h3 id="variables-panel-title">变量</h3><p>游戏镜像只读；会话变量可编辑，并随当前会话独立保存。</p></div>{session && <div className="panel-heading-actions"><button id="variables-save" className="primary-button" type="button" onClick={() => void save()}><GameIcon name="upload" size={16} />保存变量</button></div>}</header>
    <div className="variables-bento"><article className="game-mirror"><header><GameIcon name="crosshair" size={19} /><div><span>READ ONLY</span><h4>游戏状态镜像</h4></div></header><dl>{mirrors.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl><p>这些值来自 GameState，不能在酒馆面板中直接改写。</p></article><article className="session-variables"><header><div><span>SESSION SCOPE</span><h4>{session ? session.name : '尚无当前会话'}</h4></div>{session && <small>{Object.keys(draft).length} 个变量</small>}</header>{session ? <><div className="variable-add-row"><label><span>变量名</span><input id="variable-new-key" value={newKey} onChange={(event) => setNewKey(event.target.value)} /></label><label><span>初始值</span><input id="variable-new-value" value={newValue} onChange={(event) => setNewValue(event.target.value)} /></label><button id="variable-add" type="button" disabled={!newKey.trim() || newKey.trim() in draft} onClick={add}>添加变量</button></div><div className="variable-table" role="table" aria-label="会话变量"><div role="row" className="variable-table-head"><span role="columnheader">名称</span><span role="columnheader">当前值</span><span role="columnheader">操作</span></div>{Object.entries(draft).map(([key, value]) => <div role="row" key={key}><code role="cell">{key}</code><input id={`variable-value-${key}`} role="cell" aria-label={`${key}的值`} value={typeof value === 'string' ? value : JSON.stringify(value)} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /><button id={`variable-delete-${key}`} role="cell" type="button" aria-label={`删除变量${key}`} onClick={() => setPendingDelete(key)}><GameIcon name="trash" size={15} /></button></div>)}</div></> : <div className="tavern-empty-state"><GameIcon name="variables" size={26} /><strong>先与一位 NPC 建立会话</strong><p>会话变量将与角色记忆一起持久化。</p></div>}</article></div>
    {pendingDelete && <div className="tavern-confirm-bar" role="alertdialog" aria-labelledby="variable-delete-confirm"><GameIcon name="warning" size={20} /><div><strong id="variable-delete-confirm">删除变量“{pendingDelete}”？</strong><p>删除先作用于草稿，点击“保存变量”后写入当前会话。</p></div><button id="variable-delete-cancel" type="button" onClick={() => setPendingDelete(null)}>取消</button><button id="variable-delete-commit" className="danger-button" type="button" onClick={remove}>确认删除</button></div>}
  </section>
}
