import { useEffect, useState, type ChangeEvent } from 'react'
import { affinityStageNames, locations } from '../../../game/data'
import type { AffinityStage } from '../../../game/types'
import type { CharacterCard } from '../../../sillytavern/types'
import { useTavern } from '../../../tavern/TavernContext'
import { GameIcon } from '../../icons/GameIcon'

const stages = Object.keys(affinityStageNames) as AffinityStage[]

export function CharacterPanel() {
  const tavern = useTavern()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const source = tavern.characters.find((card) => card.id === selectedId) ?? null
  const [draft, setDraft] = useState<CharacterCard | null>(null)
  const [portraitStage, setPortraitStage] = useState<AffinityStage>('stranger')
  const [notice, setNotice] = useState('')
  useEffect(() => { if (source) setDraft(structuredClone(source)) }, [source?.id])

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !draft) return
    const reader = new FileReader()
    reader.onload = () => setDraft({ ...draft, portraitByAffinity: { ...draft.portraitByAffinity, [portraitStage]: String(reader.result) }, updatedAt: Date.now() })
    reader.readAsDataURL(file)
    event.target.value = ''
  }
  const save = async () => { if (!draft) return; await tavern.saveCharacter({ ...draft, updatedAt: Date.now() }); setNotice(`${draft.name}的角色卡已保存`) }

  return <section className="tavern-panel character-panel" aria-labelledby="character-panel-title">
    <header className="tavern-panel-heading"><div><span>CHARACTER CARDS</span><h3 id="character-panel-title">角色卡</h3><p>十五位女性 NPC 已绑定现有地点、好感阶段和玩家上传立绘。</p></div><div className="character-stat"><strong>{tavern.characters.length}</strong><span>张本地角色卡</span></div></header>
    {notice && <div className="tavern-panel-notice" role="status">{notice}</div>}
    <div className="character-workspace"><div className="character-card-grid">{tavern.characters.map((card, index) => { const location = locations.find((item) => item.id === card.locationId); const portrait = card.portraitByAffinity.stranger; return <article key={card.id} className={card.id === selectedId ? 'is-active' : ''} style={{ '--card-index': index } as React.CSSProperties}><div className="character-card-portrait">{portrait ? <img src={portrait} alt={`${card.name}初识立绘`} /> : <span>{card.name.slice(0, 1)}</span>}<i /></div><div><span>{card.role}</span><h4>{card.name}</h4><p>{location?.name} · {card.tags.at(-1)}</p></div><button id={`character-edit-${card.id}`} type="button" aria-label={`编辑角色卡：${card.name}`} onClick={() => setSelectedId(card.id)}><GameIcon name="profile" size={16} />编辑角色卡</button></article> })}</div>
      {draft && <aside className="character-editor" aria-labelledby={`character-editor-title-${draft.id}`}><header><div><span>CARD EDITOR</span><h4 id={`character-editor-title-${draft.id}`}>{draft.name} · {draft.role}</h4></div><button id={`character-editor-close-${draft.id}`} className="icon-button" type="button" aria-label="关闭角色卡编辑" onClick={() => setSelectedId(null)}><GameIcon name="close" size={16} /></button></header><div className="character-editor-scroll">
        <label><span>人物描述</span><textarea id={`character-description-${draft.id}`} rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        <label><span>性格与话语基调</span><textarea id={`character-personality-${draft.id}`} rows={5} value={draft.personality} onChange={(event) => setDraft({ ...draft, personality: event.target.value })} /></label>
        <label><span>当前场景</span><textarea id={`character-scenario-${draft.id}`} rows={3} value={draft.scenario} onChange={(event) => setDraft({ ...draft, scenario: event.target.value })} /></label>
        <label><span>首句</span><textarea id={`character-first-message-${draft.id}`} rows={4} value={draft.firstMessage} onChange={(event) => setDraft({ ...draft, firstMessage: event.target.value })} /></label>
        <label><span>示例对白</span><textarea id={`character-example-${draft.id}`} rows={3} value={draft.exampleDialogue} onChange={(event) => setDraft({ ...draft, exampleDialogue: event.target.value })} /></label>
        <fieldset className="portrait-stage-editor"><legend>好感阶段立绘</legend><div className="portrait-stage-tabs">{stages.map((stage) => <button id={`portrait-stage-${draft.id}-${stage}`} key={stage} type="button" className={stage === portraitStage ? 'is-active' : ''} onClick={() => setPortraitStage(stage)}>{affinityStageNames[stage]}</button>)}</div><div className="portrait-upload-zone">{draft.portraitByAffinity[portraitStage] ? <img src={draft.portraitByAffinity[portraitStage]} alt={`${draft.name}${affinityStageNames[portraitStage]}立绘预览`} /> : <div><GameIcon name="upload" size={26} /><strong>尚未上传{affinityStageNames[portraitStage]}立绘</strong><p>支持 PNG、JPG、WebP；图像只保存在本机浏览器。</p></div>}<label htmlFor={`character-portrait-upload-${draft.id}-${portraitStage}`}>选择图片</label><input id={`character-portrait-upload-${draft.id}-${portraitStage}`} type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} /></div></fieldset>
      </div><footer><button id={`character-save-${draft.id}`} className="primary-button" type="button" onClick={() => void save()}><GameIcon name="upload" size={16} />保存角色卡</button></footer></aside>}
    </div>
  </section>
}
