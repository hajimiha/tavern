import { beforeEach, describe, expect, it } from 'vitest'
import { initialGameState } from './reducer'
import {
  GAME_SAVE_STORAGE_KEY,
  clearGameSave,
  loadGameSave,
  parseGameSave,
  saveGameState,
  serializeGameSave,
} from './game-save-storage'

describe('版本化游戏自动存档', () => {
  beforeEach(() => localStorage.clear())

  it('保存进度并移除模态、选中项和通知等临时界面状态', () => {
    saveGameState({
      ...initialGameState,
      day: 4,
      location: 'mine',
      money: 2345,
      activeModal: 'mine',
      selectedNpcId: 'rin',
      toasts: [{ id: 'notice-1', tone: 'info', title: '提示', message: '临时消息' }],
    }, localStorage, 123456)

    const loaded = loadGameSave(localStorage)
    expect(loaded).toMatchObject({ schemaVersion: 1, savedAt: 123456 })
    expect(loaded?.state).toMatchObject({ day: 4, location: 'mine', money: 2345, activeModal: null, toasts: [] })
    expect(loaded?.state.selectedNpcId).toBeUndefined()
  })

  it('支持可移植导出和导入，并在损坏内容时安全拒绝', () => {
    const exported = serializeGameSave({ ...initialGameState, day: 7, money: 8765 }, 777)
    expect(parseGameSave(exported)).toMatchObject({ savedAt: 777, state: { day: 7, money: 8765 } })
    expect(parseGameSave('{bad json')).toBeNull()
    expect(parseGameSave(JSON.stringify({ schemaVersion: 99, state: {} }))).toBeNull()
  })

  it('可清除自动存档', () => {
    saveGameState(initialGameState)
    expect(localStorage.getItem(GAME_SAVE_STORAGE_KEY)).not.toBeNull()
    clearGameSave()
    expect(localStorage.getItem(GAME_SAVE_STORAGE_KEY)).toBeNull()
  })

  it('导入旧版或损坏字段时回退到安全的初始状态', () => {
    const imported = parseGameSave(JSON.stringify({
      schemaVersion: 1,
      savedAt: 888,
      state: {
        location: 'nowhere',
        day: -4,
        minutes: Number.NaN,
        energy: 99,
        maxEnergy: 5,
        money: -300,
        skills: { farming: 'broken' },
        inventory: { 'moon-radish-seed': -2, exploit: Number.POSITIVE_INFINITY },
        plots: [{ id: 'unknown-plot' }],
        relationships: { loran: 'broken' },
        mine: { currentFloor: 0, highestFloor: -1, unlockedElevators: ['five'] },
        battle: { floor: 99 },
        fishing: { active: true },
      },
    }))

    expect(imported?.state.location).toBe(initialGameState.location)
    expect(imported?.state.day).toBe(1)
    expect(imported?.state.minutes).toBe(initialGameState.minutes)
    expect(imported?.state.energy).toBe(5)
    expect(imported?.state.money).toBe(initialGameState.money)
    expect(imported?.state.skills.farming).toEqual(initialGameState.skills.farming)
    expect(imported?.state.inventory).toEqual({})
    expect(imported?.state.plots).toEqual(initialGameState.plots)
    expect(imported?.state.relationships.loran).toEqual(initialGameState.relationships.loran)
    expect(imported?.state.mine).toEqual(initialGameState.mine)
    expect(imported?.state.battle).toBeUndefined()
    expect(imported?.state.fishing.active).toBe(false)
  })

  it('浏览器拒绝存储访问时不会中断游戏，也不会伪报保存成功', () => {
    const blockedStorage = {
      getItem: () => { throw new DOMException('blocked', 'SecurityError') },
      setItem: () => { throw new DOMException('blocked', 'SecurityError') },
      removeItem: () => { throw new DOMException('blocked', 'SecurityError') },
    } as unknown as Storage

    expect(loadGameSave(blockedStorage)).toBeNull()
    expect(saveGameState(initialGameState, blockedStorage)).toBeNull()
    expect(() => clearGameSave(blockedStorage)).not.toThrow()
  })
})
