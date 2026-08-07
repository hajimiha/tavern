import { createMistvaleDefaults } from './defaults'
import { normalizeTavernSettings } from './api-config'
import type { MistvaleTavernDatabase } from './database'
import { tavernDatabase } from './database'
import type { CharacterCard, ChatPreset, ChatSession, Lorebook, TavernSettings } from './types'

export interface TavernRepository {
  initialize(): Promise<void>
  listLorebooks(): Promise<Lorebook[]>
  getLorebook(id: string): Promise<Lorebook | undefined>
  saveLorebook(value: Lorebook): Promise<void>
  deleteLorebook(id: string): Promise<void>
  listPresets(): Promise<ChatPreset[]>
  getPreset(id: string): Promise<ChatPreset | undefined>
  savePreset(value: ChatPreset): Promise<void>
  deletePreset(id: string): Promise<void>
  listCharacters(): Promise<CharacterCard[]>
  getCharacter(id: string): Promise<CharacterCard | undefined>
  saveCharacter(value: CharacterCard): Promise<void>
  deleteCharacter(id: string): Promise<void>
  listSessions(): Promise<ChatSession[]>
  getSession(id: string): Promise<ChatSession | undefined>
  saveSession(value: ChatSession): Promise<void>
  deleteSession(id: string): Promise<void>
  getSettings(): Promise<TavernSettings>
  saveSettings(value: TavernSettings): Promise<void>
}

class DexieTavernRepository implements TavernRepository {
  constructor(private readonly database: MistvaleTavernDatabase) {}

  async initialize(): Promise<void> {
    const defaults = createMistvaleDefaults()
    await this.database.transaction(
      'rw',
      this.database.lorebooks,
      this.database.presets,
      this.database.characters,
      this.database.sessions,
      this.database.settings,
      async () => {
        if ((await this.database.lorebooks.count()) === 0) {
          await this.database.lorebooks.bulkAdd(defaults.lorebooks)
        }
        if ((await this.database.presets.count()) === 0) {
          await this.database.presets.bulkAdd(defaults.presets)
        }
        if ((await this.database.characters.count()) === 0) {
          await this.database.characters.bulkAdd(defaults.characters)
        }
        if ((await this.database.sessions.count()) === 0 && defaults.sessions.length > 0) {
          await this.database.sessions.bulkAdd(defaults.sessions)
        }
        if ((await this.database.settings.count()) === 0) {
          await this.database.settings.add(defaults.settings)
        }
      },
    )
  }

  listLorebooks = () => this.database.lorebooks.orderBy('updatedAt').reverse().toArray()
  getLorebook = (id: string) => this.database.lorebooks.get(id)
  async saveLorebook(value: Lorebook) { await this.database.lorebooks.put(value) }
  async deleteLorebook(id: string) { await this.database.lorebooks.delete(id) }

  listPresets = () => this.database.presets.orderBy('updatedAt').reverse().toArray()
  getPreset = (id: string) => this.database.presets.get(id)
  async savePreset(value: ChatPreset) { await this.database.presets.put(value) }
  async deletePreset(id: string) { await this.database.presets.delete(id) }

  listCharacters = () => this.database.characters.orderBy('name').toArray()
  getCharacter = (id: string) => this.database.characters.get(id)
  async saveCharacter(value: CharacterCard) { await this.database.characters.put(value) }
  async deleteCharacter(id: string) { await this.database.characters.delete(id) }

  listSessions = () => this.database.sessions.orderBy('updatedAt').reverse().toArray()
  getSession = (id: string) => this.database.sessions.get(id)
  async saveSession(value: ChatSession) { await this.database.sessions.put(value) }
  async deleteSession(id: string) { await this.database.sessions.delete(id) }

  async getSettings(): Promise<TavernSettings> {
    const current = await this.database.settings.get('mistvale-settings')
    if (current) {
      const normalized = normalizeTavernSettings(current)
      if (JSON.stringify(normalized) !== JSON.stringify(current)) await this.database.settings.put(normalized)
      return normalized
    }
    const defaults = createMistvaleDefaults().settings
    await this.database.settings.put(defaults)
    return defaults
  }

  async saveSettings(value: TavernSettings): Promise<void> {
    await this.database.settings.put(normalizeTavernSettings(value))
  }
}

export function createTavernRepository(database: MistvaleTavernDatabase = tavernDatabase): TavernRepository {
  return new DexieTavernRepository(database)
}

export const tavernRepository = createTavernRepository()
