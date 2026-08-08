import { describe, it, expect } from 'vitest';
import { assemblePrompt } from './prompt-assembler';

describe('assemblePrompt formatPrompt injection', () => {
  it('injects formatPrompt as a system message', () => {
    const out = assemblePrompt({
      userInput: 'hi',
      history: [],
      preset: { id: 'p', name: 'p', settings: {}, createdAt: 0, updatedAt: 0 },
      lorebooks: [],
      userName: 'Alice',
      characterName: 'Bob',
      formatPrompt: 'FORMAT_INSTRUCTIONS_HERE',
      extraVariables: { hp: 100 },
    });
    const sysJoined = out.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    expect(sysJoined).toContain('FORMAT_INSTRUCTIONS_HERE');
  });

  it('exposes extraVariables in system context', () => {
    const out = assemblePrompt({
      userInput: 'hi',
      history: [],
      preset: { id: 'p', name: 'p', settings: {}, createdAt: 0, updatedAt: 0 },
      lorebooks: [],
      userName: 'Alice',
      characterName: 'Bob',
      extraVariables: { hp: 42 },
    });
    const sysJoined = out.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    expect(sysJoined).toMatch(/42/);
  });

  it('assembles the preferred 100001 group from an official SillyTavern preset', () => {
    const out = assemblePrompt({
      userInput: '继续',
      history: [{ id: 'm1', role: 'assistant', content: '上一段对话', timestamp: 1 }],
      preset: {
        id: 'p', name: 'grouped', createdAt: 0, updatedAt: 0,
        settings: {
          prompts: [
            { identifier: 'main', name: '主提示词', role: 'system', content: '只应使用默认槽位' },
            { identifier: 'chatHistory', name: '聊天历史', marker: true },
          ],
          prompt_order: [
            { character_id: 100000, order: [{ identifier: 'main', enabled: false }] },
            { character_id: 100001, order: [
              { identifier: 'main', enabled: true },
              { identifier: 'chatHistory', enabled: true },
            ] },
          ],
        },
      },
      lorebooks: [],
      userName: '玩家',
      characterName: '角色',
    });

    expect(out.systemPrompt).toContain('只应使用默认槽位');
    expect(out.messages).toContainEqual({ role: 'assistant', content: '上一段对话' });
  });

  it('keeps system prompts after chatHistory in their declared relative position', () => {
    const out = assemblePrompt({
      userInput: '本轮输入',
      history: [{ id: 'm1', role: 'assistant', content: '历史回复', timestamp: 1 }],
      preset: {
        id: 'p', name: 'ordered', createdAt: 0, updatedAt: 0,
        settings: {
          prompts: [
            { identifier: 'before', role: 'system', content: '历史前规则' },
            { identifier: 'chatHistory', marker: true },
            { identifier: 'after', role: 'system', content: '历史后规则' },
          ],
          prompt_order: [{ character_id: 100001, order: [
            { identifier: 'before', enabled: true },
            { identifier: 'chatHistory', enabled: true },
            { identifier: 'after', enabled: true },
          ] }],
        },
      },
      lorebooks: [],
      userName: '玩家',
      characterName: '角色',
    });

    expect(out.messages.map((message) => `${message.role}:${message.content}`)).toEqual([
      'system:历史前规则',
      'assistant:历史回复',
      'system:历史后规则',
      'user:本轮输入',
    ]);
  });

  it('uses live game variable values to trigger the matching festival lorebook entry', () => {
    const out = assemblePrompt({
      userInput: '今天有什么安排？',
      history: [],
      preset: {
        id: 'p', name: 'p', createdAt: 0, updatedAt: 0,
        settings: { prompt_order: [{ identifier: 'worldInfoAfter', enabled: true }] },
      },
      lorebooks: [{
        id: 'calendar', name: '岁时', recursiveScanning: false, caseSensitive: false, matchWholeWords: false, createdAt: 0, updatedAt: 0,
        entries: [{
          id: 'new-year', keys: ['迎岁灯会'], secondaryKeys: [], content: '傍晚前往壁炉议事厅点灯。', comment: '迎岁灯会', order: 10, position: 'after_char', selective: false, selectiveLogic: 'and_any', constant: false, probability: 100, addMemo: true,
        }],
      }],
      userName: '玩家',
      characterName: '洛岚',
      extraVariables: { currentFestival: '迎岁灯会' },
    });

    expect(out.matchedEntries.map((match) => match.entry.comment)).toContain('迎岁灯会');
    expect(out.systemPrompt).toContain('傍晚前往壁炉议事厅点灯');
  });
});
