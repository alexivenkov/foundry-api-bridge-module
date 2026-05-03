import { deleteMacroHandler } from '../DeleteMacroHandler';
import type { FoundryMacroDoc } from '../macroTypes';

function createMockMacro(overrides?: Partial<FoundryMacroDoc>): FoundryMacroDoc {
  return {
    id: 'm1',
    uuid: 'Macro.m1',
    name: 'Doomed',
    type: 'chat',
    img: '',
    command: '',
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

describe('deleteMacroHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should delete chat macro and return result (no security gate)', async () => {
    const macro = createMockMacro({ id: 'chat-1', type: 'chat' });
    (macro.delete as jest.Mock).mockResolvedValue(macro);
    setGame([macro]);

    const result = await deleteMacroHandler({ macroId: 'chat-1' });

    expect(macro.delete).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true, macroId: 'chat-1' });
  });

  it('should delete script macro and return result (delete is safe, no gate)', async () => {
    const macro = createMockMacro({ id: 'script-1', type: 'script', command: 'evil()' });
    (macro.delete as jest.Mock).mockResolvedValue(macro);
    setGame([macro]);

    const result = await deleteMacroHandler({ macroId: 'script-1' });

    expect(macro.delete).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true, macroId: 'script-1' });
  });

  it('should throw when macro not found', async () => {
    setGame([]);

    await expect(deleteMacroHandler({ macroId: 'missing' }))
      .rejects.toThrow('Macro not found: missing');
  });

  it('should propagate macro.delete rejection', async () => {
    const macro = createMockMacro({ id: 'm1' });
    (macro.delete as jest.Mock).mockRejectedValue(new Error('cannot delete'));
    setGame([macro]);

    await expect(deleteMacroHandler({ macroId: 'm1' }))
      .rejects.toThrow('cannot delete');
  });
});
