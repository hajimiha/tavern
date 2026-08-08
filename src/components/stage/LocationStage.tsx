import { useEffect, useState } from 'react'
import locationAtlas from '../../assets/pixel/location-atlas.webp'
import { getNpcsAtLocation } from '../../game/calendar'
import { locations, npcs } from '../../game/data'
import { useGame } from '../../game/GameContext'
import type { LocationId, ModalType } from '../../game/types'
import { DialogueView } from '../npc/DialogueView'
import { NpcPanel } from '../npc/NpcPanel'
import { NpcPortrait } from '../npc/NpcPortrait'

const sceneClass: Record<LocationId, string> = {
  farm: 'scene-shop',
  'mayor-home': 'scene-shop',
  'general-store': 'scene-shop',
  smithy: 'scene-shop',
  'monster-market': 'scene-witch',
  'witch-home': 'scene-witch',
  'hunter-camp': 'scene-witch',
  mine: 'scene-mine',
  'fisher-home': 'scene-coast',
  library: 'scene-shop',
  hospital: 'scene-shop',
}

const primaryModal: Partial<Record<LocationId, { modal: Exclude<ModalType, null>; label: string }>> = {
  'mayor-home': { modal: 'quest-board', label: '查看村民委托板' },
  'general-store': { modal: 'trade', label: '进入种子与材料柜台' },
  smithy: { modal: 'trade', label: '查看锻造与精炼' },
  'monster-market': { modal: 'ranch', label: '查看共生牧场合同' },
  'witch-home': { modal: 'trade', label: '浏览五行药剂' },
  'hunter-camp': { modal: 'hunter', label: '开始战斗训练' },
  mine: { modal: 'mine', label: '进入矿洞层级' },
  'fisher-home': { modal: 'fishing', label: '准备一次钓鱼' },
  library: { modal: 'library', label: '查阅五行法术' },
  hospital: { modal: 'hospital', label: '接受精力治疗' },
}

export function LocationStage() {
  const { state, dispatch } = useGame()
  const [uploads, setUploads] = useState<Record<string, string>>({})
  const location = locations.find((item) => item.id === state.location)!
  const presentNpcs = getNpcsAtLocation(state.location, state.year, state.day, state.minutes)
  const selectedNpc = npcs.find((npc) => npc.id === state.selectedNpcId)
  const feature = primaryModal[state.location]
  const featureNpcId = location.npcIds.find((npcId) => presentNpcs.some((npc) => npc.id === npcId))

  useEffect(() => () => Object.values(uploads).forEach((source) => URL.revokeObjectURL?.(source)), [uploads])

  const upload = (npcId: string, file: File) => {
    const source = URL.createObjectURL(file)
    setUploads((current) => ({ ...current, [npcId]: source }))
  }

  return (
    <section className={`world-stage location-stage panel-frame ${sceneClass[state.location]}`} aria-labelledby="stage-title">
      <div className="location-scene" style={{ backgroundImage: `url(${locationAtlas})` }} aria-hidden="true" />
      <div className="location-shade" aria-hidden="true" />
      <header className="stage-titlebar"><div><p className="eyebrow">{location.name} · {location.hours}</p><h1 id="stage-title">{location.subtitle}</h1></div><span className="weather-pill">{location.hours === '全天' ? '随时开放' : `开放 ${location.hours}`}</span></header>
      <div className="location-story"><span>{location.name}</span><p>{location.description}</p>{feature && <button id={`location-feature-${state.location}`} className="primary-button" type="button" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: feature.modal, npcId: featureNpcId })}>{feature.label}</button>}</div>
      <div className={`npc-stage-list count-${presentNpcs.length}`} aria-label="当前地点人物">
        {presentNpcs.map((npc) => <NpcPortrait key={npc.id} npc={npc} relationship={state.relationships[npc.id]} uploadedSource={uploads[npc.id]} onUpload={(file) => upload(npc.id, file)} onOpen={() => dispatch({ type: 'OPEN_MODAL', modal: 'npc', npcId: npc.id })} />)}
        {!presentNpcs.length && <div className="empty-location-state"><strong>此刻无人停留</strong><p>村民会依照每日行程与节日安排在不同地点活动。</p></div>}
      </div>
      {state.activeModal === 'npc' && selectedNpc && <NpcPanel npcId={selectedNpc.id} />}
      {state.activeModal === 'dialogue' && selectedNpc && <DialogueView npc={selectedNpc} />}
    </section>
  )
}
