import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../game/GameContext'
import type { Npc } from '../../game/types'
import type { ChatSession } from '../../sillytavern/types'
import { useTavern } from '../../tavern/TavernContext'
import { GameIcon } from '../icons/GameIcon'
import { HistoryDrawer } from './HistoryDrawer'

const openingOptions: Record<string, string[]> = {
  loran: ['询问今日委托', '聊聊村庄近况', '暂时告辞'],
  daifu: ['请教五行魔法', '询问药剂配方', '暂时告辞'],
  rin: ['请求战斗指导', '询问魔物踪迹', '暂时告辞'],
}

export function TavernDialogue({ npc }: { npc: Npc }) {
  const { state, dispatch } = useGame()
  const tavern = useTavern()
  const relationship = state.relationships[npc.id]
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionSnapshot, setSessionSnapshot] = useState<ChatSession | null>(null)
  const [input, setInput] = useState('')
  const [working, setWorking] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const openingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (tavern.status !== 'ready' || openingRef.current) return
    openingRef.current = true
    const variables = {
      affinity: relationship.affinity,
      money: state.money,
      energy: state.energy,
      day: state.day,
      location: state.location,
    }
    void tavern.openNpcSession(npc.id, variables)
      .then((session) => { setSessionId(session.id); setSessionSnapshot(session) })
      .catch((caught) => setError(caught instanceof Error ? caught.message : '会话初始化失败'))
  }, [tavern.status, tavern.openNpcSession, npc.id, relationship.affinity, state.money, state.energy, state.day, state.location])

  useEffect(() => () => abortRef.current?.abort(), [])

  const session = tavern.sessions.find((candidate) => candidate.id === sessionId) ?? sessionSnapshot
  const lastAssistant = [...(session?.messages ?? [])].reverse().find((message) => message.role === 'assistant')
  const options = lastAssistant?.parsed?.options.length ? lastAssistant.parsed.options : (openingOptions[npc.id] ?? ['继续交谈', '询问她的近况', '暂时告辞'])
  const card = tavern.characters.find((candidate) => candidate.npcId === npc.id)
  const activeLorebooks = useMemo(() => tavern.lorebooks.filter((book) => card?.lorebookIds.includes(book.id)), [tavern.lorebooks, card])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || working || !session) return
    const controller = new AbortController()
    abortRef.current = controller
    setWorking(true)
    setError(null)
    setInput('')
    try {
      const next = await tavern.sendTurn({
        sessionId: session.id,
        npcId: npc.id,
        playerText: message,
        variables: {
          affinity: relationship.affinity,
          money: state.money,
          energy: state.energy,
          day: state.day,
          location: state.location,
        },
        affinity: relationship.affinity,
        memoryTags: relationship.memoryTags,
        signal: controller.signal,
      })
      setSessionSnapshot(next)
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === 'AbortError')) {
        setError(caught instanceof Error ? caught.message : '叙事生成失败，请检查接口设置。')
      }
    } finally {
      setWorking(false)
      abortRef.current = null
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void send(input)
  }

  const branch = async (messageIndex: number) => {
    if (!session) return
    const branchSession = await tavern.branchSession(session.id, messageIndex, `${npc.name} · 分支 ${tavern.sessions.length + 1}`)
    setSessionId(branchSession.id)
    setSessionSnapshot(branchSession)
  }

  const truncate = async (messageIndex: number) => {
    if (!session) return
    const next = await tavern.truncateSession(session.id, messageIndex)
    setSessionSnapshot(next)
  }

  return (
    <section className="dialogue-view tavern-dialogue" role="dialog" aria-modal="false" aria-labelledby={`tavern-dialogue-title-${npc.id}`}>
      <header>
        <div>
          <span>{tavern.settings?.adapterMode === 'remote' ? 'REMOTE TAVERN' : 'LOCAL TAVERN'} · 好感 {relationship.affinity}</span>
          <h2 id={`tavern-dialogue-title-${npc.id}`}>与{npc.name}的酒馆会话</h2>
        </div>
        <div className="tavern-dialogue-header-actions">
          <button id={`tavern-history-open-${npc.id}`} className="icon-button" type="button" aria-label="查看会话历史" disabled={!session} onClick={() => setHistoryOpen(true)}><GameIcon name="history" size={18} /></button>
          <button id={`dialogue-close-${npc.id}`} className="icon-button" type="button" aria-label={`关闭与${npc.name}的对话`} onClick={() => dispatch({ type: 'CLOSE_MODAL' })}><GameIcon name="close" size={17} /></button>
        </div>
      </header>

      <div className="tavern-status-ribbon">
        <span className="tavern-status-dot" aria-hidden="true" />
        <strong>{tavern.apiLabel}</strong>
        <small>{tavern.status === 'loading' ? '正在载入角色记忆' : `${activeLorebooks.length} 册世界书已挂载`}</small>
      </div>

      <div className="tavern-context-strip">
        <div><GameIcon name="memory" size={16} /><span>她记得</span><p>{relationship.memoryTags.length ? relationship.memoryTags.join(' · ') : '今天的话会成为第一笔共同记忆。'}</p></div>
        <div><GameIcon name="book" size={16} /><span>角色卡</span><p>{card ? `${card.role} · ${card.tags.slice(1).join(' · ')}` : '正在读取人物档案'}</p></div>
        <div><GameIcon name="variables" size={16} /><span>变量镜像</span><p>金币 {state.money} · 精力 {state.energy} · 好感 {relationship.affinity}</p></div>
      </div>

      <div className="dialogue-log" aria-live="polite" aria-busy={working}>
        {!session && <div className="tavern-dialogue-skeleton"><i /><i /><i /></div>}
        {session?.messages.map((message) => (
          <article key={message.id} className={`dialogue-message is-${message.role === 'user' ? 'player' : 'npc'}`}>
            <span>{message.role === 'assistant' ? npc.name : '你'}</span>
            <p>{message.content}</p>
            {message.parsed?.sum && <small className="dialogue-summary">楼层摘要 · {message.parsed.sum}</small>}
          </article>
        ))}
        {working && <article className="dialogue-message is-npc is-working"><span>{npc.name}</span><p><i className="typing-caret" aria-label="正在组织回应" /> {tavern.settings?.adapterMode === 'remote' ? '模型正在读取角色卡与世界书……' : '正在结合角色卡与本地记忆……'}</p></article>}
      </div>

      <div className="tavern-options" aria-label="本回合可选行动">
        {options.map((option, index) => (
          <button id={`dialogue-option-${npc.id}-${index}`} key={`${option}-${index}`} type="button" aria-label={`选择行动：${option}`} disabled={working || !session} onClick={() => void send(option)}>
            <span>{String(index + 1).padStart(2, '0')}</span>{option}<GameIcon name="send" size={15} />
          </button>
        ))}
      </div>

      {error && <div className="tavern-dialogue-error" role="alert"><GameIcon name="warning" size={17} /><span>{error}</span></div>}

      <form className="dialogue-composer tavern-composer" onSubmit={submit}>
        <label htmlFor={`dialogue-input-${npc.id}`}>自由输入</label>
        <textarea id={`dialogue-input-${npc.id}`} value={input} maxLength={220} rows={2} disabled={working || !session} placeholder="描述你的选择、问题或此刻的心情……" onChange={(event) => setInput(event.target.value)} />
        <div>
          <small>{input.length} / 220 · {tavern.settings?.adapterMode === 'remote' ? '消息将发送到已配置的模型服务' : '只在本机生成并保存'}</small>
          {working
            ? <button id={`dialogue-stop-${npc.id}`} className="secondary-button" type="button" onClick={() => abortRef.current?.abort()}><GameIcon name="stop" size={16} />停止生成</button>
            : <button id={`dialogue-send-${npc.id}`} className="primary-button" type="submit" disabled={!input.trim() || !session}><GameIcon name="send" size={16} />送出话语</button>}
        </div>
      </form>

      {historyOpen && session && <HistoryDrawer session={session} onClose={() => setHistoryOpen(false)} onBranch={branch} onTruncate={truncate} />}
    </section>
  )
}
