import { describe, it, expect } from 'vitest';
import { exportLorebook, importLorebook, importMultipleLorebooks, importPreset, renameLorebook } from './importer';
import type { SillyTavernLorebookExport } from './types';

const stub = (name: string): SillyTavernLorebookExport => ({
  name,
  description: '',
  entries: {},
});

describe('importer multi/rename', () => {
  it('returns success and failure lists', () => {
    const results = importMultipleLorebooks([
      { fileName: 'a.json', json: stub('a') },
      { fileName: 'b.json', json: 'broken' as any },
    ]);
    expect(results.successes).toHaveLength(1);
    expect(results.failures).toHaveLength(1);
    expect(results.successes[0].lorebook.name).toBe('a');
    expect(results.failures[0].fileName).toBe('b.json');
  });

  it('renameLorebook replaces only the name', () => {
    const lb = { id: '1', name: 'old', entries: [], createdAt: 0, updatedAt: 0,
                 recursiveScanning: true, caseSensitive: false, matchWholeWords: false };
    const next = renameLorebook(lb, 'new');
    expect(next.name).toBe('new');
    expect(next.id).toBe('1');
    expect(next.updatedAt).toBeGreaterThanOrEqual(lb.updatedAt);
  });

  it('rejects malformed lorebooks and presets before persistence', () => {
    expect(() => importLorebook({ name: {}, entries: {} })).toThrow();
    expect(() => importLorebook({ name: 'bad', entries: { 0: { key: 'not-an-array', content: 'text' } } })).toThrow();
    expect(() => importPreset({ name: {}, prompt_order: 'not-an-array' })).toThrow();
    expect(() => importPreset({ name: 'bad', prompt_order: [{ identifier: {} }] })).toThrow();
  });

  it('preserves disabled and excluded SillyTavern entries during round trips', () => {
    const imported = importLorebook({
      name: 'archive',
      entries: {
        0: { key: ['mist'], keysecondary: [], content: 'hidden lore', disable: true, excluded: false },
      },
    });
    const exported = exportLorebook({ ...imported, id: 'book', createdAt: 1, updatedAt: 1 });

    expect(imported.entries[0]).toMatchObject({ disabled: true, excluded: false });
    expect(exported.entries['0']).toMatchObject({ disable: true, excluded: false, content: 'hidden lore' });
  });
});
