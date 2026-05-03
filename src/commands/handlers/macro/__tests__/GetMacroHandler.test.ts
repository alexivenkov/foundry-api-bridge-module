import { getMacroHandler } from '../GetMacroHandler';
import type { FoundryMacroDoc } from '../macroTypes';

function createMockMacro(overrides?: Partial<FoundryMacroDoc>): FoundryMacroDoc {
  return {
    id: 'm1',
    uuid: 'Macro.m1',
    name: 'My Macro',
    type: 'chat',
    img: 'icons/svg/dice-target.svg',
    command: '/r 1d20',
    scope: 'global',
    folder: null,
    author: null,
    update: jest.fn(),
    delete: jest.fn(),
    execute: jest.fn(),
    ...overrides
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

describe('getMacroHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should return full detail with command text', async () => {
    setGame([
      createMockMacro({
        id: 'm1',
        uuid: 'Macro.abc',
        name: 'Roll Attack',
        type: 'chat',
        img: 'icons/sword.png',
        command: '/r 1d20+5',
        scope: 'global',
        folder: { id: 'f1', name: 'Combat' },
        author: { id: 'u1', name: 'GM' }
      })
    ]);

    const result = await getMacroHandler({ macroId: 'm1' });

    expect(result).toEqual({
      id: 'm1',
      uuid: 'Macro.abc',
      name: 'Roll Attack',
      type: 'chat',
      img: 'icons/sword.png',
      scope: 'global',
      folder: 'Combat',
      authorId: 'u1',
      command: '/r 1d20+5'
    });
  });

  it('should return script macro detail without security gate (read is safe)', async () => {
    setGame([
      createMockMacro({
        id: 's1',
        type: 'script',
        command: 'console.log("hi")'
      })
    ]);

    const result = await getMacroHandler({ macroId: 's1' });

    expect(result.type).toBe('script');
    expect(result.command).toBe('console.log("hi")');
  });

  it('should throw when macro not found', async () => {
    setGame([]);

    await expect(getMacroHandler({ macroId: 'missing' }))
      .rejects.toThrow('Macro not found: missing');
  });
});
