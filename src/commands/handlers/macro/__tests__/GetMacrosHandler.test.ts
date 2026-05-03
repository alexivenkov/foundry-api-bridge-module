import { getMacrosHandler } from '../GetMacrosHandler';
import type { FoundryMacroDoc } from '../macroTypes';

interface MockMacroInput {
  id: string;
  name: string;
  type: 'chat' | 'script';
  uuid?: string;
  img?: string;
  command?: string;
  scope?: 'global' | 'actors' | 'actor';
  folder?: { id: string; name: string } | null;
  author?: { id: string; name: string } | null;
}

function createMockMacro(input: MockMacroInput): FoundryMacroDoc {
  return {
    id: input.id,
    uuid: input.uuid ?? `Macro.${input.id}`,
    name: input.name,
    type: input.type,
    img: input.img ?? 'icons/svg/dice-target.svg',
    command: input.command ?? '',
    scope: input.scope ?? 'global',
    folder: input.folder ?? null,
    author: input.author ?? null,
    update: jest.fn(),
    delete: jest.fn(),
    execute: jest.fn()
  };
}

function setGame(macros: FoundryMacroDoc[]): void {
  (globalThis as Record<string, unknown>)['game'] = {
    macros: {
      contents: macros,
      get: jest.fn((id: string) => macros.find(m => m.id === id))
    }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('getMacrosHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should return all macros when no filter', async () => {
    setGame([
      createMockMacro({ id: 'm1', name: 'Roll Attack', type: 'chat' }),
      createMockMacro({ id: 'm2', name: 'Combat Helper', type: 'script' }),
      createMockMacro({ id: 'm3', name: 'Status Effect', type: 'script' })
    ]);

    const result = await getMacrosHandler({});

    expect(result).toHaveLength(3);
    expect(result.map(m => m.id)).toEqual(['m1', 'm2', 'm3']);
  });

  it('should filter macros by type chat', async () => {
    setGame([
      createMockMacro({ id: 'm1', name: 'Chat A', type: 'chat' }),
      createMockMacro({ id: 'm2', name: 'Script A', type: 'script' }),
      createMockMacro({ id: 'm3', name: 'Chat B', type: 'chat' })
    ]);

    const result = await getMacrosHandler({ type: 'chat' });

    expect(result).toHaveLength(2);
    expect(result.map(m => m.id)).toEqual(['m1', 'm3']);
    expect(result.every(m => m.type === 'chat')).toBe(true);
  });

  it('should filter macros by type script', async () => {
    setGame([
      createMockMacro({ id: 'm1', name: 'Chat A', type: 'chat' }),
      createMockMacro({ id: 'm2', name: 'Script A', type: 'script' }),
      createMockMacro({ id: 'm3', name: 'Script B', type: 'script' })
    ]);

    const result = await getMacrosHandler({ type: 'script' });

    expect(result).toHaveLength(2);
    expect(result.every(m => m.type === 'script')).toBe(true);
  });

  it('should return empty array for empty collection', async () => {
    setGame([]);

    const result = await getMacrosHandler({});

    expect(result).toEqual([]);
  });

  it('should map folder to name (or null when root)', async () => {
    setGame([
      createMockMacro({
        id: 'm1',
        name: 'Macro In Folder',
        type: 'chat',
        folder: { id: 'folder-1', name: 'Combat Macros' }
      }),
      createMockMacro({ id: 'm2', name: 'Root Macro', type: 'chat', folder: null })
    ]);

    const result = await getMacrosHandler({});

    expect(result[0]?.folder).toBe('Combat Macros');
    expect(result[1]?.folder).toBeNull();
  });

  it('should map authorId or null', async () => {
    setGame([
      createMockMacro({
        id: 'm1',
        name: 'Authored',
        type: 'chat',
        author: { id: 'user-1', name: 'GM Bob' }
      }),
      createMockMacro({ id: 'm2', name: 'Anon', type: 'chat', author: null })
    ]);

    const result = await getMacrosHandler({});

    expect(result[0]?.authorId).toBe('user-1');
    expect(result[1]?.authorId).toBeNull();
  });

  it('should not require security gate (read is always safe)', async () => {
    setGame([
      createMockMacro({ id: 'script-1', name: 'Dangerous Script', type: 'script' })
    ]);

    await expect(getMacrosHandler({})).resolves.toHaveLength(1);
  });
});
