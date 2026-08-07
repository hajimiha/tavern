import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createDisabledTavernApi } from '../sillytavern/api-adapter'
import { tavernRepository, type TavernRepository } from '../sillytavern/repository'
import type {
  CharacterCard,
  ChatMessage,
  ChatPreset,
  ChatSession,
  Lorebook,
  TavernSettings,
} from '../sillytavern/types'
import { branchChat, truncateChatAt } from '../sillytavern/variables'
import { createLocalTurn } from './local-story-engine'

type TavernStatus = 'loading' | 'ready' | 'error'

interface SendLocalTurnInput {
  sessionId: string
  npcId: string
  playerText: string
  variables?: Record<string, unknown>
  affinity?: number
  memoryTags?: string[]
  signal?: AbortSignal
}

interface TavernContextValue {
  status: TavernStatus
  error: string | null
  apiLabel: string
  lorebooks: Lorebook[]
  presets: ChatPreset[]
  characters: CharacterCard[]
  sessions: ChatSession[]
  settings: TavernSettings | null
  activeSession: ChatSession | null
  openNpcSession(npcId: string, variables?: Record<string, unknown>): Promise<ChatSession>
  sendLocalTurn(input: SendLocalTurnInput): Promise<ChatSession>
  selectSession(id: string | null): Promise<void>
  updateSettings(patch: Partial<TavernSettings>): Promise<void>
  saveLorebook(value: Lorebook): Promise<void>
  deleteLorebook(id: string): Promise<void>
  savePreset(value: ChatPreset): Promise<void>
  deletePreset(id: string): Promise<void>
  saveCharacter(value: CharacterCard): Promise<void>
  saveSession(value: ChatSession): Promise<void>
  deleteSession(id: string): Promise<void>
  branchSession(sessionId: string, messageIndex: number, name: string): Promise<ChatSession>
  truncateSession(sessionId: string, messageIndex: number): Promise<ChatSession>
  updateVariables(sessionId: string, variables: Record<string, unknown>): Promise<ChatSession>
}

const TavernContext = createContext<TavernContextValue | null>(null)

function replaceById<T extends { id: string }>(items: T[], value: T): T[] {
  const exists = items.some((item) => item.id === value.id)
  return exists ? items.map((item) => item.id === value.id ? value : item) : [value, ...items]
}

export function TavernProvider({ children, repository = tavernRepository }: { children: ReactNode; repository?: TavernRepository }) {
  const [status, setStatus] = useState<TavernStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([])
  const [presets, setPresets] = useState<ChatPreset[]>([])
  const [characters, setCharacters] = useState<CharacterCard[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [settings, setSettings] = useState<TavernSettings | null>(null)
  const api = useMemo(() => createDisabledTavernApi(), [])

  useEffect(() => {
    let cancelled = false
    const initialize = async () => {
      try {
        await repository.initialize()
        const [nextLorebooks, nextPresets, nextCharacters, nextSessions, nextSettings] = await Promise.all([
          repository.listLorebooks(),
          repository.listPresets(),
          repository.listCharacters(),
          repository.listSessions(),
          repository.getSettings(),
        ])
        if (cancelled) return
        setLorebooks(nextLorebooks)
        setPresets(nextPresets)
        setCharacters(nextCharacters)
        setSessions(nextSessions)
        setSettings(nextSettings)
        setStatus('ready')
      } catch (caught) {
        if (cancelled) return
        setError(caught instanceof Error ? caught.message : '本地酒馆数据初始化失败')
        setStatus('error')
      }
    }
    void initialize()
    return () => { cancelled = true }
  }, [repository])

  const persistSettings = useCallback(async (patch: Partial<TavernSettings>) => {
    const current = settings ?? await repository.getSettings()
    const next = { ...current, ...patch, updatedAt: Date.now() }
    await repository.saveSettings(next)
    setSettings(next)
  }, [repository, settings])

  const saveSession = useCallback(async (value: ChatSession) => {
    await repository.saveSession(value)
    setSessions((current) => replaceById(current, value).sort((a, b) => b.updatedAt - a.updatedAt))
  }, [repository])

  const openNpcSession = useCallback(async (npcId: string, variables: Record<string, unknown> = {}) => {
    const card = characters.find((candidate) => candidate.npcId === npcId)
      ?? (await repository.listCharacters()).find((candidate) => candidate.npcId === npcId)
    if (!card) throw new Error(`找不到角色卡：${npcId}`)
    const existing = sessions
      .filter((session) => session.npcId === npcId)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0]
    const session = existing ?? {
      id: crypto.randomUUID(),
      name: `${card.name} · 初次会话`,
      characterId: card.id,
      npcId,
      characterName: card.name,
      userName: settings?.userName ?? '旅行者',
      presetId: settings?.activePresetId ?? null,
      lorebookIds: [...card.lorebookIds],
      variables,
      messages: [{
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: card.firstMessage,
        timestamp: Date.now(),
        variablesAfter: variables,
        apiUsed: 'local' as const,
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    if (!existing) await saveSession(session)
    await persistSettings({ activeCharacterId: card.id, activeSessionId: session.id })
    return session
  }, [characters, sessions, settings, repository, persistSettings, saveSession])

  const sendLocalTurn = useCallback(async (input: SendLocalTurnInput) => {
    const session = sessions.find((candidate) => candidate.id === input.sessionId)
      ?? await repository.getSession(input.sessionId)
    if (!session) throw new Error('找不到当前酒馆会话')
    const variables = { ...session.variables, ...input.variables }
    const startedAt = performance.now()
    const turn = await createLocalTurn({
      npcId: input.npcId,
      playerText: input.playerText,
      variables,
      affinity: input.affinity,
      memoryTags: input.memoryTags,
      signal: input.signal,
    })
    const now = Date.now()
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.playerText,
      timestamp: now,
      variables: variables as Record<string, string | number>,
    }
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: turn.parsed.maintext,
      timestamp: now + 1,
      parsed: turn.parsed,
      variablesAfter: turn.variablesAfter,
      apiUsed: 'local',
      metadata: { processingTime: Math.round(performance.now() - startedAt) },
    }
    const next = {
      ...session,
      messages: [...session.messages, userMessage, assistantMessage],
      variables: turn.variablesAfter,
      updatedAt: now + 1,
    }
    await saveSession(next)
    return next
  }, [sessions, repository, saveSession])

  const selectSession = useCallback(async (id: string | null) => {
    await persistSettings({ activeSessionId: id })
  }, [persistSettings])

  const saveLorebook = useCallback(async (value: Lorebook) => {
    await repository.saveLorebook(value)
    setLorebooks((current) => replaceById(current, value))
  }, [repository])
  const deleteLorebook = useCallback(async (id: string) => {
    await repository.deleteLorebook(id)
    setLorebooks((current) => current.filter((item) => item.id !== id))
  }, [repository])
  const savePreset = useCallback(async (value: ChatPreset) => {
    await repository.savePreset(value)
    setPresets((current) => replaceById(current, value))
  }, [repository])
  const deletePreset = useCallback(async (id: string) => {
    await repository.deletePreset(id)
    setPresets((current) => current.filter((item) => item.id !== id))
  }, [repository])
  const saveCharacter = useCallback(async (value: CharacterCard) => {
    await repository.saveCharacter(value)
    setCharacters((current) => replaceById(current, value))
  }, [repository])
  const deleteSession = useCallback(async (id: string) => {
    await repository.deleteSession(id)
    setSessions((current) => current.filter((item) => item.id !== id))
    if (settings?.activeSessionId === id) await persistSettings({ activeSessionId: null })
  }, [repository, settings, persistSettings])

  const branchSession = useCallback(async (sessionId: string, messageIndex: number, name: string) => {
    const source = sessions.find((session) => session.id === sessionId) ?? await repository.getSession(sessionId)
    if (!source) throw new Error('找不到要分支的会话')
    const branch = branchChat(source, messageIndex, {
      name,
      presetId: source.presetId,
      lorebookIds: source.lorebookIds,
    })
    await saveSession(branch)
    await persistSettings({ activeSessionId: branch.id, activeCharacterId: branch.characterId ?? null })
    return branch
  }, [sessions, repository, saveSession, persistSettings])

  const truncateSession = useCallback(async (sessionId: string, messageIndex: number) => {
    const source = sessions.find((session) => session.id === sessionId) ?? await repository.getSession(sessionId)
    if (!source) throw new Error('找不到要截断的会话')
    const next = { ...truncateChatAt(source, messageIndex + 1), updatedAt: Date.now() }
    await saveSession(next)
    return next
  }, [sessions, repository, saveSession])

  const updateVariables = useCallback(async (sessionId: string, variables: Record<string, unknown>) => {
    const source = sessions.find((session) => session.id === sessionId) ?? await repository.getSession(sessionId)
    if (!source) throw new Error('找不到要更新变量的会话')
    const next = { ...source, variables, updatedAt: Date.now() }
    await saveSession(next)
    return next
  }, [sessions, repository, saveSession])

  const activeSession = sessions.find((session) => session.id === settings?.activeSessionId) ?? null
  const value = useMemo<TavernContextValue>(() => ({
    status,
    error,
    apiLabel: api.label,
    lorebooks,
    presets,
    characters,
    sessions,
    settings,
    activeSession,
    openNpcSession,
    sendLocalTurn,
    selectSession,
    updateSettings: persistSettings,
    saveLorebook,
    deleteLorebook,
    savePreset,
    deletePreset,
    saveCharacter,
    saveSession,
    deleteSession,
    branchSession,
    truncateSession,
    updateVariables,
  }), [status, error, api.label, lorebooks, presets, characters, sessions, settings, activeSession, openNpcSession, sendLocalTurn, selectSession, persistSettings, saveLorebook, deleteLorebook, savePreset, deletePreset, saveCharacter, saveSession, deleteSession, branchSession, truncateSession, updateVariables])

  return <TavernContext.Provider value={value}>{children}</TavernContext.Provider>
}

export function useTavern() {
  const value = useContext(TavernContext)
  if (!value) throw new Error('useTavern 必须在 TavernProvider 内使用')
  return value
}
