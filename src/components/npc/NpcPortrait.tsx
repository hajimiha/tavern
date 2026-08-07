import type { Npc, Relationship } from '../../game/types'
import { affinityStageNames } from '../../game/data'
import { GameIcon } from '../icons/GameIcon'

export function NpcPortrait({ npc, relationship, uploadedSource, onUpload, onOpen }: {
  npc: Npc
  relationship: Relationship
  uploadedSource?: string
  onUpload: (file: File) => void
  onOpen: () => void
}) {
  const uploadId = `npc-upload-${npc.id}-${relationship.stage}`
  const source = uploadedSource ?? npc.portraitByAffinity[relationship.stage]
  return (
    <article className="npc-portrait-card">
      <button id={`npc-portrait-${npc.id}`} className="npc-portrait-button" type="button" aria-label={`与${npc.role}${npc.name}互动`} onClick={onOpen}>
        {source
          ? <img src={source} alt={`${npc.name}·${affinityStageNames[relationship.stage]}阶段立绘`} />
          : <span className="portrait-silhouette" aria-hidden="true"><i /><i /><i /></span>}
        <span className="portrait-glass"><small>{npc.role}</small><strong>{npc.name}</strong><em>好感 {relationship.affinity}</em></span>
      </button>
      <label className="portrait-upload" htmlFor={uploadId}><GameIcon name="upload" size={14} />上传当前好感立绘</label>
      <input id={uploadId} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])} />
    </article>
  )
}
