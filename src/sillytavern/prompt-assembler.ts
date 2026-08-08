/**
 * Prompt Assembler
 */

import type { ChatPreset, Lorebook, ChatMessage, MatchedEntry } from './types';
import { createLorebookEngine } from './lorebook-engine';
import { formatVariablesForPrompt } from './variables';
import { getPresetPromptDefinitions, getPresetPromptOrder, normalizePresetPromptRole } from './preset-compat';

export interface AssembleOptions {
  userInput: string;
  history: ChatMessage[];
  preset: ChatPreset;
  lorebooks: Lorebook[];
  userName: string;
  characterName: string;
  variables?: Record<string, string | number>;
  extraVariables?: Record<string, any>;
  formatPrompt?: string;
}

export interface AssembleResult {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  matchedEntries: MatchedEntry[];
  systemPrompt: string;
}

export function assemblePrompt(options: AssembleOptions): AssembleResult {
  const { userInput, history, preset, lorebooks, userName, characterName, variables, extraVariables, formatPrompt } = options;

  const allMatchedEntries: MatchedEntry[] = [];
  const scanText = userInput + ' ' + history.slice(-3).map(m => m.content).join(' ');

  for (const book of lorebooks) {
    const engine = createLorebookEngine(book);
    const matches = engine.recursiveScan(scanText, 3);
    allMatchedEntries.push(...matches);
  }

  const uniqueEntries = Array.from(
    new Map(allMatchedEntries.map(e => [e.entry.id, e])).values()
  ).sort((a, b) => a.score - b.score);

  const configuredContext = preset.settings.openai_max_context ?? preset.settings.max_length;
  const parsedContext = typeof configuredContext === 'number'
    ? configuredContext
    : Number(configuredContext);
  const maxContextTokens = Number.isFinite(parsedContext) && parsedContext > 0 ? parsedContext : 4096;
  let currentTokens = 0;

  const recentHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === 'system') continue;
    const msgTokens = msg.content.length / 4;
    if (currentTokens + msgTokens > maxContextTokens * 0.8) break;
    recentHistory.unshift({ role: msg.role, content: msg.content });
    currentTokens += msgTokens;
  }

  const promptOrder = getPresetPromptOrder(preset.settings).items;
  const prompts = getPresetPromptDefinitions(preset.settings);

  function resolvePromptContent(identifier: string): string | null {
    const stringSetting = (key: string): string | null => {
      const value = preset.settings[key];
      return typeof value === 'string' && value.trim() ? value : null;
    };

    // Dynamic content for world info
    if (identifier === 'worldInfoBefore' || identifier === 'worldInfoAfter') {
      const content = uniqueEntries.map(e => e.entry.content).join('\n\n');
      return content || null;
    }
    // Character / scenario placeholders (can be filled when character cards are implemented)
    if (identifier === 'charDescription') {
      return stringSetting('character_description');
    }
    if (identifier === 'charPersonality') {
      return stringSetting('character_personality');
    }
    if (identifier === 'scenario') {
      return stringSetting('scenario');
    }
    if (identifier === 'personaDescription') {
      return stringSetting('persona_description');
    }
    if (identifier === 'dialogueExamples') {
      return stringSetting('dialogue_examples');
    }
    if (identifier === 'groupNudge') {
      return stringSetting('group_nudge_prompt');
    }
    if (identifier === 'impersonate') {
      return stringSetting('impersonation_prompt');
    }
    if (identifier === 'quietPrompt') {
      return stringSetting('quiet_prompt');
    }
    if (identifier === 'bias') {
      return null;
    }
    // Custom prompts array
    const custom = prompts.find(p => p.identifier === identifier);
    if (custom?.content) return custom.content;
    // Direct preset fields (main, nsfw, jailbreak, enhanceDefinitions, etc.)
    return stringSetting(identifier);
  }

  const assembledMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
  let systemAccumulator = '';
  let hasChatHistory = false;

  for (const item of promptOrder) {
    if (item.enabled === false) continue;

    if (item.identifier === 'chatHistory') {
      hasChatHistory = true;
      if (systemAccumulator) {
        assembledMessages.push({ role: 'system', content: systemAccumulator });
        systemAccumulator = '';
      }
      assembledMessages.push(...recentHistory);
      continue;
    }

    const rawContent = resolvePromptContent(item.identifier);
    if (!rawContent) continue;

    let content = replaceMacros(rawContent, { userName, characterName, userInput, variables });
    if (!content.trim()) continue;

    const role = normalizePresetPromptRole(item.role) || prompts.find((prompt) => prompt.identifier === item.identifier)?.role || 'system';
    if (role === 'system') {
      systemAccumulator += (systemAccumulator ? '\n\n' : '') + content;
    } else {
      if (systemAccumulator) {
        assembledMessages.push({ role: 'system', content: systemAccumulator });
        systemAccumulator = '';
      }
      assembledMessages.push({ role, content });
    }
  }

  const variablesBlock = formatVariablesForPrompt(variables || {});
  if (variablesBlock) {
    systemAccumulator += (systemAccumulator ? '\n\n' : '') + variablesBlock;
  }

  if (extraVariables && Object.keys(extraVariables).length > 0) {
    const extraBlock = formatVariablesForPrompt(extraVariables);
    if (extraBlock) {
      systemAccumulator += (systemAccumulator ? '\n\n' : '') + extraBlock;
    }
  }

  if (formatPrompt) {
    systemAccumulator += (systemAccumulator ? '\n\n' : '') + formatPrompt;
  }

  if (systemAccumulator) {
    assembledMessages.push({ role: 'system', content: systemAccumulator });
  }

  // Fallback: append history if prompt_order didn't include it
  if (!hasChatHistory) {
    assembledMessages.push(...recentHistory);
  }

  // Always append the current user input as the final message
  assembledMessages.push({ role: 'user', content: userInput });

  const systemPrompt = assembledMessages
    .filter(m => m.role === 'system')
    .map(m => m.content)
    .join('\n\n');

  return {
    messages: assembledMessages,
    matchedEntries: uniqueEntries,
    systemPrompt,
  };
}

interface MacroContext {
  userName: string;
  characterName: string;
  userInput: string;
  variables?: Record<string, string | number>;
}

export function replaceMacros(template: string, context: MacroContext): string {
  let result = template
    .replace(/\{\{user\}\}/g, context.userName)
    .replace(/\{\{char\}\}/g, context.characterName)
    .replace(/\{\{original\}\}/g, context.userInput);

  if (context.variables) {
    result = result.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
      const value = context.variables?.[key.trim()];
      return value !== undefined ? String(value) : match;
    });
  }

  return result;
}

export const SUPPORTED_MACROS = [
  { name: '{{user}}', description: '用户名' },
  { name: '{{char}}', description: 'AI角色名' },
  { name: '{{original}}', description: '用户原始输入' },
  { name: '{{变量名}}', description: '自定义变量（例如 {{hp}}）' },
] as const;
