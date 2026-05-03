import { executeMacroHandler } from '../ExecuteMacroHandler';
import type { FoundryMacroDoc } from '../macroTypes';
import { getAllowScriptMacros } from '@/settings/SettingsManager';

jest.mock('@/settings/SettingsManager');

const mockGetAllowScriptMacros = getAllowScriptMacros as jest.MockedFunction<typeof getAllowScriptMacros>;

function createMockMacro(overrides?: Partial<FoundryMacroDoc>): FoundryMacroDoc {
  return {
    id: 'm1',
    uuid: 'Macro.m1',
    name: 'Test Macro',
    type: 'chat',
    img: '',
    command: '/r 1d20',
    scope: 'global',
    folder: null,
    author: null,
    update: jest.fn(),
    delete: jest.fn(),
    execute: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

interface SetGameOpts {
  macros: FoundryMacroDoc[];
  actors?: { id: string }[];
}

function setGame(opts: SetGameOpts): void {
  const actors = opts.actors ?? [];
  (globalThis as Record<string, unknown>)['game'] = {
    macros: {
      contents: opts.macros,
      get: jest.fn((id: string) => opts.macros.find(m => m.id === id))
    },
    actors: {
      get: jest.fn((id: string) => actors.find(a => a.id === id))
    }
  };
}

function setCanvas(tokens: { id: string }[] | null): void {
  if (tokens === null) {
    (globalThis as Record<string, unknown>)['canvas'] = { scene: null };
    return;
  }
  (globalThis as Record<string, unknown>)['canvas'] = {
    scene: {
      tokens: {
        get: jest.fn((id: string) => tokens.find(t => t.id === id))
      }
    }
  };
}

function clearGlobals(): void {
  delete (globalThis as Record<string, unknown>)['game'];
  delete (globalThis as Record<string, unknown>)['canvas'];
}

describe('executeMacroHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(clearGlobals);

  it('should execute chat macro regardless of allowScriptMacros flag (false)', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ id: 'c1', type: 'chat', name: 'Chat Macro' });
    setGame({ macros: [macro] });

    const result = await executeMacroHandler({ macroId: 'c1' });

    expect(macro.execute).toHaveBeenCalledWith({});
    expect(result).toEqual({
      executed: true,
      macroId: 'c1',
      macroName: 'Chat Macro',
      macroType: 'chat'
    });
  });

  it('should execute chat macro when allowScriptMacros=true', async () => {
    mockGetAllowScriptMacros.mockReturnValue(true);
    const macro = createMockMacro({ id: 'c1', type: 'chat' });
    setGame({ macros: [macro] });

    await expect(executeMacroHandler({ macroId: 'c1' })).resolves.toMatchObject({
      executed: true,
      macroType: 'chat'
    });
  });

  it('should throw when executing script macro with allowScriptMacros=false', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ id: 's1', type: 'script', command: 'console.log(1)' });
    setGame({ macros: [macro] });

    await expect(executeMacroHandler({ macroId: 's1' }))
      .rejects.toThrow(/Script macros are disabled/);

    expect(macro.execute).not.toHaveBeenCalled();
  });

  it('should execute script macro when allowScriptMacros=true', async () => {
    mockGetAllowScriptMacros.mockReturnValue(true);
    const macro = createMockMacro({
      id: 's1',
      type: 'script',
      name: 'Script',
      command: 'console.log(1)'
    });
    setGame({ macros: [macro] });

    const result = await executeMacroHandler({ macroId: 's1' });

    expect(macro.execute).toHaveBeenCalledWith({});
    expect(result).toEqual({
      executed: true,
      macroId: 's1',
      macroName: 'Script',
      macroType: 'script'
    });
  });

  it('should pass actor in scope when actorId provided', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ id: 'm1', type: 'chat' });
    const actor = { id: 'actor-1' };
    setGame({ macros: [macro], actors: [actor] });

    await executeMacroHandler({ macroId: 'm1', actorId: 'actor-1' });

    expect(macro.execute).toHaveBeenCalledWith({ actor });
  });

  it('should pass token in scope when tokenId provided (resolved from canvas)', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ id: 'm1', type: 'chat' });
    const token = { id: 'token-1' };
    setGame({ macros: [macro] });
    setCanvas([token]);

    await executeMacroHandler({ macroId: 'm1', tokenId: 'token-1' });

    expect(macro.execute).toHaveBeenCalledWith({ token });
  });

  it('should pass both actor and token when both ids provided', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ id: 'm1', type: 'chat' });
    const actor = { id: 'actor-1' };
    const token = { id: 'token-1' };
    setGame({ macros: [macro], actors: [actor] });
    setCanvas([token]);

    await executeMacroHandler({
      macroId: 'm1',
      actorId: 'actor-1',
      tokenId: 'token-1'
    });

    expect(macro.execute).toHaveBeenCalledWith({ actor, token });
  });

  it('should throw when macro not found', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    setGame({ macros: [] });

    await expect(executeMacroHandler({ macroId: 'missing' }))
      .rejects.toThrow('Macro not found: missing');
  });

  it('should throw when actor not found', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ id: 'm1', type: 'chat' });
    setGame({ macros: [macro], actors: [] });

    await expect(executeMacroHandler({ macroId: 'm1', actorId: 'missing-actor' }))
      .rejects.toThrow('Actor not found: missing-actor');

    expect(macro.execute).not.toHaveBeenCalled();
  });

  it('should throw when token not found on active scene', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ id: 'm1', type: 'chat' });
    setGame({ macros: [macro] });
    setCanvas([]);

    await expect(executeMacroHandler({ macroId: 'm1', tokenId: 'missing-token' }))
      .rejects.toThrow('Token not found on active scene: missing-token');

    expect(macro.execute).not.toHaveBeenCalled();
  });

  it('should throw when canvas has no active scene', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ id: 'm1', type: 'chat' });
    setGame({ macros: [macro] });
    setCanvas(null);

    await expect(executeMacroHandler({ macroId: 'm1', tokenId: 't1' }))
      .rejects.toThrow('Token not found on active scene: t1');
  });
});
