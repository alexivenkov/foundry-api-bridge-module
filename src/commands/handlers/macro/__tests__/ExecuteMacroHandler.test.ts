import { executeMacroHandler } from '../ExecuteMacroHandler';
import type { FoundryMacroDoc } from '../macroTypes';
import type { ExecuteMacroParams } from '@/commands/types';
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

function scopeOf(macro: FoundryMacroDoc): Record<string, unknown> {
  const calls = (macro.execute as jest.Mock).mock.calls as unknown[][];
  return calls[0]?.[0] as Record<string, unknown>;
}

function withArgs(args: unknown): ExecuteMacroParams {
  return { macroId: 'm1', args } as ExecuteMacroParams;
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

  describe('args', () => {
    beforeEach(() => {
      mockGetAllowScriptMacros.mockReturnValue(true);
    });

    it('passes args to a script macro as scope.args, the same object, without spreading its keys', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'return args' });
      setGame({ macros: [macro] });
      const args = { actorId: 'a1', itemId: 'i1', advantage: true, nested: { cover: 2 } };

      await executeMacroHandler({ macroId: 'm1', args });

      expect(macro.execute).toHaveBeenCalledWith({ args });
      const scope = scopeOf(macro);
      expect(scope['args']).toBe(args);
      expect(Object.keys(scope)).toEqual(['args']);
    });

    it('passes args next to actor and token', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'return 1' });
      const actor = { id: 'actor-1' };
      const token = { id: 'token-1' };
      setGame({ macros: [macro], actors: [actor] });
      setCanvas([token]);
      const args = { targetTokenId: 't2' };

      await executeMacroHandler({ macroId: 'm1', actorId: 'actor-1', tokenId: 'token-1', args });

      expect(macro.execute).toHaveBeenCalledWith({ actor, token, args });
      expect(Object.keys(scopeOf(macro)).sort()).toEqual(['actor', 'args', 'token']);
    });

    it('accepts an empty object', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'return 1' });
      setGame({ macros: [macro] });

      await executeMacroHandler({ macroId: 'm1', args: {} });

      expect(macro.execute).toHaveBeenCalledWith({ args: {} });
    });

    it('sends a scope without an args key when args is absent (8.17 behaviour)', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'return 1' });
      setGame({ macros: [macro] });

      await executeMacroHandler({ macroId: 'm1' });

      expect('args' in scopeOf(macro)).toBe(false);
      expect(macro.execute).toHaveBeenCalledWith({});
    });

    it.each([
      ['an array', []],
      ['null', null],
      ['a string', 'x'],
      ['a number', 1],
      ['a boolean', true]
    ])('rejects %s with "args must be a JSON object" before executing', async (_label, args) => {
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'return 1' });
      setGame({ macros: [macro] });

      await expect(executeMacroHandler(withArgs(args))).rejects.toThrow('args must be a JSON object');

      expect(macro.execute).not.toHaveBeenCalled();
    });

    it('rejects invalid args for a chat macro too, and accepts valid ones it will ignore', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'chat', command: '/r 1d20' });
      setGame({ macros: [macro] });

      await expect(executeMacroHandler(withArgs('x'))).rejects.toThrow('args must be a JSON object');
      expect(macro.execute).not.toHaveBeenCalled();

      await executeMacroHandler({ macroId: 'm1', args: { ignored: true } });
      expect(macro.execute).toHaveBeenCalledWith({ args: { ignored: true } });
    });

    it('checks the macro and the script permission before args', async () => {
      mockGetAllowScriptMacros.mockReturnValue(false);
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'return 1' });
      setGame({ macros: [macro] });

      await expect(executeMacroHandler(withArgs('x'))).rejects.toThrow(/Script macros are disabled/);
      await expect(executeMacroHandler({ ...withArgs('x'), macroId: 'missing' }))
        .rejects.toThrow('Macro not found: missing');
    });

    it('checks args before resolving the actor', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'return 1' });
      setGame({ macros: [macro], actors: [] });

      await expect(executeMacroHandler({ ...withArgs(1), actorId: 'missing-actor' }))
        .rejects.toThrow('args must be a JSON object');
    });
  });

  describe('syntax pre-check', () => {
    beforeEach(() => {
      mockGetAllowScriptMacros.mockReturnValue(true);
    });

    it('rejects a script macro that does not compile without executing it', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', name: 'Broken', command: 'return (' });
      setGame({ macros: [macro] });

      await expect(executeMacroHandler({ macroId: 'm1' }))
        .rejects.toThrow(/^Macro "Broken" has a syntax error: .+/);

      expect(macro.execute).not.toHaveBeenCalled();
    });

    it('runs a chat macro with the same text (no pre-check for chat)', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'chat', name: 'Chatty', command: 'return (' });
      setGame({ macros: [macro] });

      await expect(executeMacroHandler({ macroId: 'm1' })).resolves.toMatchObject({ executed: true });
      expect(macro.execute).toHaveBeenCalledWith({});
    });

    it('accepts top-level await and a return statement', async () => {
      const macro = createMockMacro({
        id: 'm1',
        type: 'script',
        command: 'const roll = await new Roll("1d20").evaluate();\nreturn { total: roll.total };'
      });
      setGame({ macros: [macro] });

      await expect(executeMacroHandler({ macroId: 'm1' })).resolves.toMatchObject({ executed: true });
      expect(macro.execute).toHaveBeenCalledTimes(1);
    });

    it('compiles only: a macro with side effects at the top level is not run by the check', async () => {
      const marker = jest.fn();
      (globalThis as Record<string, unknown>)['__macroMarker'] = marker;
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'globalThis.__macroMarker()' });
      setGame({ macros: [macro] });

      await executeMacroHandler({ macroId: 'm1' });

      expect(marker).not.toHaveBeenCalled();
      delete (globalThis as Record<string, unknown>)['__macroMarker'];
    });

    it('checks the syntax before resolving the actor or token', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', name: 'Broken', command: 'return (' });
      setGame({ macros: [macro], actors: [] });

      await expect(executeMacroHandler({ macroId: 'm1', actorId: 'missing-actor' }))
        .rejects.toThrow(/has a syntax error/);
    });
  });

  describe('return value', () => {
    beforeEach(() => {
      mockGetAllowScriptMacros.mockReturnValue(true);
    });

    it('returns a primitive result', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'return 42' });
      (macro.execute as jest.Mock).mockResolvedValue(42);
      setGame({ macros: [macro] });

      await expect(executeMacroHandler({ macroId: 'm1' })).resolves.toEqual({
        executed: true,
        macroId: 'm1',
        macroName: 'Test Macro',
        macroType: 'script',
        result: 42
      });
    });

    it('returns an object result as is', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'return x' });
      (macro.execute as jest.Mock).mockResolvedValue({ hit: true, damage: [{ type: 'slashing', amount: 7 }] });
      setGame({ macros: [macro] });

      await expect(executeMacroHandler({ macroId: 'm1' })).resolves.toMatchObject({
        result: { hit: true, damage: [{ type: 'slashing', amount: 7 }] }
      });
    });

    it('omits result when the macro returned undefined', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'ui.notifications.info("x")' });
      setGame({ macros: [macro] });

      const result = await executeMacroHandler({ macroId: 'm1' });

      expect('result' in result).toBe(false);
      expect('resultTruncated' in result).toBe(false);
      expect('resultBytes' in result).toBe(false);
    });

    it('reduces a Document-like result to its reference', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'return actor' });
      (macro.execute as jest.Mock).mockResolvedValue({
        documentName: 'Actor',
        id: 'a1',
        uuid: 'Actor.a1',
        name: 'Bob',
        system: { hp: 10 },
        toJSON: () => ({ everything: true })
      });
      setGame({ macros: [macro] });

      await expect(executeMacroHandler({ macroId: 'm1' })).resolves.toMatchObject({
        result: { documentName: 'Actor', id: 'a1', uuid: 'Actor.a1', name: 'Bob' }
      });
    });

    it('returns the message reference for a chat macro', async () => {
      mockGetAllowScriptMacros.mockReturnValue(false);
      const macro = createMockMacro({ id: 'c1', type: 'chat', name: 'Chat Macro' });
      (macro.execute as jest.Mock).mockResolvedValue({
        documentName: 'ChatMessage',
        id: 'msg1',
        uuid: 'ChatMessage.msg1',
        content: '<p>hi</p>',
        rolls: []
      });
      setGame({ macros: [macro] });

      await expect(executeMacroHandler({ macroId: 'c1' })).resolves.toEqual({
        executed: true,
        macroId: 'c1',
        macroName: 'Chat Macro',
        macroType: 'chat',
        result: { documentName: 'ChatMessage', id: 'msg1', uuid: 'ChatMessage.msg1' }
      });
    });

    it('reports a truncated result by size only', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', command: 'return big' });
      const text = 'x'.repeat(300_000);
      (macro.execute as jest.Mock).mockResolvedValue({ text });
      setGame({ macros: [macro] });

      const result = await executeMacroHandler({ macroId: 'm1' });

      expect(result).toEqual({
        executed: true,
        macroId: 'm1',
        macroName: 'Test Macro',
        macroType: 'script',
        resultTruncated: true,
        resultBytes: JSON.stringify({ text }).length
      });
      expect('result' in result).toBe(false);
    });

    it('wraps a rejection in the "failed" error text', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', name: 'Attack', command: 'throw new Error("boom")' });
      (macro.execute as jest.Mock).mockRejectedValue(new Error('boom'));
      setGame({ macros: [macro] });

      await expect(executeMacroHandler({ macroId: 'm1' })).rejects.toThrow('Macro "Attack" failed: boom');
    });

    it('wraps a non-Error rejection', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', name: 'Attack', command: 'throw "nope"' });
      (macro.execute as jest.Mock).mockRejectedValue('nope');
      setGame({ macros: [macro] });

      await expect(executeMacroHandler({ macroId: 'm1' })).rejects.toThrow('Macro "Attack" failed: nope');
    });

    it('wraps a synchronous throw from execute', async () => {
      const macro = createMockMacro({ id: 'm1', type: 'script', name: 'Attack', command: 'return 1' });
      (macro.execute as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid scope parameter');
      });
      setGame({ macros: [macro] });

      await expect(executeMacroHandler({ macroId: 'm1' }))
        .rejects.toThrow('Macro "Attack" failed: Invalid scope parameter');
    });
  });
});
