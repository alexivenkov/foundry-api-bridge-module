import { MacroNotFoundError } from '../../domain';
import { FoundryMacroRunner } from '../FoundryMacroRunner';
import type { FoundryMacroCanvas, FoundryMacroDocument, FoundryMacroGlobals } from '../foundryMacroTypes';

function document(
  execute: jest.Mock = jest.fn().mockResolvedValue(undefined),
  type: FoundryMacroDocument['type'] = 'script'
): FoundryMacroDocument {
  return {
    id: 'm1',
    uuid: 'Macro.m1',
    name: 'Strike',
    type,
    img: '',
    command: 'return args',
    scope: 'global',
    folder: null,
    author: null,
    update: jest.fn(),
    delete: jest.fn(),
    execute
  };
}

// The shapes of the real canvas: `canvas.scene.tokens` holds TokenDocuments,
// whose parent is the scene; `canvas.tokens.get(id)` answers the Token placeable
// drawn for one, and a placeable's `actor` is the actor of its document.
interface TokenDocumentLike {
  id: string;
  parent: { id: string };
  actor: { id: string } | null;
}

const viewedScene = { id: 'viewed-scene' };
const hero = { id: 'hero' };
const pawnActor = { id: 'pawn-actor' };
const pawnDocument: TokenDocumentLike = { id: 'pawn', parent: viewedScene, actor: pawnActor };
const pawn = { id: 'pawn', document: pawnDocument, actor: pawnActor };
const statueDocument: TokenDocumentLike = { id: 'statue', parent: viewedScene, actor: null };
const statue = { id: 'statue', document: statueDocument, actor: null };
const undrawnDocument: TokenDocumentLike = { id: 'undrawn', parent: viewedScene, actor: pawnActor };

const sceneTokens = [pawnDocument, statueDocument, undrawnDocument];
const placeables = [pawn, statue];

function viewedCanvas(): FoundryMacroCanvas {
  return {
    tokens: { get: (id) => placeables.find((placeable) => placeable.id === id) },
    scene: { tokens: { get: (id) => sceneTokens.find((token) => token.id === id) } }
  };
}

interface SpeakerSource {
  actor?: { id: string } | null;
  token?: TokenDocumentLike;
}

// Like `ChatMessage.getSpeaker`: a token document decides the speaker and names its scene; an actor comes second.
const getSpeaker = jest.fn(({ actor, token }: SpeakerSource) =>
  token
    ? { scene: token.parent.id, actor: token.actor?.id ?? null, token: token.id }
    : { scene: null, actor: actor?.id ?? null, token: null }
);

function globalsWith(
  macros: FoundryMacroDocument[],
  canvas: FoundryMacroGlobals['canvas'] = viewedCanvas()
): FoundryMacroGlobals {
  return {
    game: {
      macros: { contents: macros, get: (id) => macros.find((doc) => doc.id === id) },
      actors: { get: (id) => (id === 'hero' ? hero : undefined) }
    },
    Macro: { create: jest.fn() },
    ChatMessage: { implementation: { getSpeaker: getSpeaker as jest.Mock } },
    canvas
  };
}

function runnerOver(macros: FoundryMacroDocument[] = [], canvas?: FoundryMacroGlobals['canvas']): FoundryMacroRunner {
  const globals = canvas === undefined ? globalsWith(macros) : globalsWith(macros, canvas);
  return new FoundryMacroRunner(() => globals);
}

function scopeOf(execute: jest.Mock): Record<string, unknown> {
  return (execute.mock.calls as unknown[][])[0]?.[0] as Record<string, unknown>;
}

function onCore(generation: number): void {
  (globalThis as Record<string, unknown>)['game'] = { release: { generation } };
}

describe('FoundryMacroRunner', () => {
  beforeEach(() => {
    getSpeaker.mockClear();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  describe('findSyntaxError', () => {
    const runner = runnerOver();

    it.each([
      ['a plain statement', 'ui.notifications.info("hi")'],
      ['a return at the top level', 'return 42'],
      ['an await at the top level', 'const roll = await new Roll("1d20").evaluate();\nreturn roll.total;'],
      ['a trailing line comment, closed by the newline the core adds', 'return 1 // done'],
      ['an empty script', '']
    ])('finds nothing wrong with %s', (_case, script) => {
      expect(runner.findSyntaxError(script)).toBeNull();
    });

    it.each([
      ['an unclosed call', 'return ('],
      ['a declaration without a name', 'const = 1'],
      ['a reserved word as a name', 'const class = 1']
    ])('reports the message of the compiler for %s', (_case, script) => {
      const message = runner.findSyntaxError(script);

      expect(typeof message).toBe('string');
      expect(message).not.toBe('');
    });

    it('compiles only: the script is never run', () => {
      const marker = jest.fn();
      (globalThis as Record<string, unknown>)['__macroRunnerMarker'] = marker;

      expect(runner.findSyntaxError('globalThis.__macroRunnerMarker()')).toBeNull();
      expect(marker).not.toHaveBeenCalled();

      delete (globalThis as Record<string, unknown>)['__macroRunnerMarker'];
    });

    it('needs no Foundry globals', () => {
      const bare = new FoundryMacroRunner(() => {
        throw new Error('globals must not be read to compile a script');
      });

      expect(bare.findSyntaxError('return 1')).toBeNull();
    });
  });

  describe('speakers', () => {
    it('knows the actors of the world', () => {
      const runner = runnerOver();

      expect(runner.hasActor('hero')).toBe(true);
      expect(runner.hasActor('nobody')).toBe(false);
    });

    it('knows the tokens the canvas has drawn', () => {
      const runner = runnerOver();

      expect(runner.hasCanvasToken('pawn')).toBe(true);
      expect(runner.hasCanvasToken('nothing')).toBe(false);
    });

    it('does not count a token of the viewed scene that has no placeable: nothing to hand to the macro', () => {
      expect(runnerOver().hasCanvasToken('undrawn')).toBe(false);
    });

    it.each([
      ['a canvas that renders no scene, whose token layer answers nothing', { tokens: { get: () => undefined }, scene: null }],
      ['a canvas without a token layer', { scene: null }],
      ['a canvas with a null token layer', { tokens: null }],
      ['a null canvas', null]
    ])('finds no token on %s', (_case, canvas) => {
      expect(runnerOver([], canvas).hasCanvasToken('pawn')).toBe(false);
    });

    it('finds no token when there is no canvas at all', () => {
      const { canvas: _canvas, ...withoutCanvas } = globalsWith([]);

      expect(new FoundryMacroRunner(() => withoutCanvas).hasCanvasToken('pawn')).toBe(false);
    });
  });

  describe('run', () => {
    it('executes the macro with an empty scope when nothing is given, and asks for no speaker', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);

      await runnerOver([document(execute)]).run('m1', {});

      expect(execute).toHaveBeenCalledTimes(1);
      expect(scopeOf(execute)).toEqual({});
      expect(Object.keys(scopeOf(execute))).toEqual([]);
      expect(getSpeaker).not.toHaveBeenCalled();
    });

    it('hands the macro the Token placeable, not the token document', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);

      await runnerOver([document(execute)]).run('m1', { tokenId: 'pawn' });

      expect(scopeOf(execute)['token']).toBe(pawn);
      expect(scopeOf(execute)['token']).not.toBe(pawnDocument);
    });

    it('takes the actor from the token when only a token is addressed', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);

      await runnerOver([document(execute)]).run('m1', { tokenId: 'pawn' });

      expect(Object.keys(scopeOf(execute))).toEqual(['actor', 'token', 'speaker']);
      expect(scopeOf(execute)['actor']).toBe(pawnActor);
    });

    it('builds the speaker of a token from its document, which knows its scene', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);

      await runnerOver([document(execute)]).run('m1', { tokenId: 'pawn' });

      expect(getSpeaker).toHaveBeenCalledTimes(1);
      expect(getSpeaker).toHaveBeenCalledWith({ actor: pawnActor, token: pawnDocument });
      expect((getSpeaker.mock.calls[0]?.[0] as { token: unknown }).token).toBe(pawnDocument);
      expect(scopeOf(execute)['speaker']).toEqual({ scene: 'viewed-scene', actor: 'pawn-actor', token: 'pawn' });
    });

    it('builds the speaker of an actor addressed alone and puts no token into the scope', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);

      await runnerOver([document(execute)]).run('m1', { actorId: 'hero' });

      expect(Object.keys(scopeOf(execute))).toEqual(['actor', 'speaker']);
      expect(scopeOf(execute)['actor']).toBe(hero);
      expect(getSpeaker).toHaveBeenCalledWith({ actor: hero, token: undefined });
      expect(scopeOf(execute)['speaker']).toEqual({ scene: null, actor: 'hero', token: null });
    });

    it('keeps an actor addressed by id over the actor of the token', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);

      await runnerOver([document(execute)]).run('m1', { actorId: 'hero', tokenId: 'pawn' });

      expect(scopeOf(execute)['actor']).toBe(hero);
      expect(scopeOf(execute)['token']).toBe(pawn);
      expect(getSpeaker).toHaveBeenCalledWith({ actor: hero, token: pawnDocument });
    });

    it('speaks as a token that has no actor without inventing one', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);

      await runnerOver([document(execute)]).run('m1', { tokenId: 'statue' });

      expect(Object.keys(scopeOf(execute))).toEqual(['token', 'speaker']);
      expect(scopeOf(execute)['token']).toBe(statue);
      expect(getSpeaker).toHaveBeenCalledWith({ actor: null, token: statueDocument });
      expect(scopeOf(execute)['speaker']).toEqual({ scene: 'viewed-scene', actor: null, token: 'statue' });
    });

    it.each(['chat', 'script'] as const)('gives a %s macro the speaker: a chat macro reads nothing else', async (type) => {
      const execute = jest.fn().mockResolvedValue(undefined);

      await runnerOver([document(execute, type)]).run('m1', { actorId: 'hero', tokenId: 'pawn' });

      expect(scopeOf(execute)['speaker']).toEqual({ scene: 'viewed-scene', actor: 'pawn-actor', token: 'pawn' });
    });

    it('puts the arguments next to the speaker as the very object the caller gave', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      const args = { advantage: true };

      await runnerOver([document(execute)]).run('m1', { actorId: 'hero', tokenId: 'pawn', args });

      const scope = scopeOf(execute);
      expect(Object.keys(scope)).toEqual(['actor', 'token', 'speaker', 'args']);
      expect(scope['args']).toBe(args);
    });

    it('passes the arguments alone when nobody is addressed', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      const args = { advantage: true };

      await runnerOver([document(execute)]).run('m1', { args });

      expect(Object.keys(scopeOf(execute))).toEqual(['args']);
      expect(getSpeaker).not.toHaveBeenCalled();
    });

    it('gives the scope no key for what is absent, undefined included', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);

      await runnerOver([document(execute)]).run('m1', { actorId: undefined, tokenId: undefined, args: undefined });

      expect(Object.keys(scopeOf(execute))).toEqual([]);
    });

    it.each([13, 14])('addresses the macro the same way on core %i', async (generation) => {
      onCore(generation);
      const execute = jest.fn().mockResolvedValue(undefined);
      const runner = runnerOver([document(execute)]);

      expect(runner.hasCanvasToken('undrawn')).toBe(false);
      await runner.run('m1', { tokenId: 'pawn' });

      expect(scopeOf(execute)['token']).toBe(pawn);
      expect(scopeOf(execute)['speaker']).toEqual({ scene: 'viewed-scene', actor: 'pawn-actor', token: 'pawn' });
    });

    it('resolves to exactly what the macro returned', async () => {
      const returned = { documentName: 'ChatMessage', uuid: 'ChatMessage.x' };
      const runner = runnerOver([document(jest.fn().mockResolvedValue(returned))]);

      await expect(runner.run('m1', {})).resolves.toBe(returned);
    });

    it('rejects with what the macro rejected with, untouched', async () => {
      const runner = runnerOver([document(jest.fn().mockRejectedValue('nope'))]);

      await expect(runner.run('m1', {})).rejects.toBe('nope');
    });

    it('turns a synchronous throw of the core into a rejection', async () => {
      const execute = jest.fn(() => {
        throw new Error('Invalid scope parameter');
      });

      await expect(runnerOver([document(execute)]).run('m1', {})).rejects.toThrow('Invalid scope parameter');
    });

    it('rejects for a macro that is gone', async () => {
      await expect(runnerOver().run('missing', {})).rejects.toThrow(MacroNotFoundError);
    });
  });

  // Cores 11 and 12 could not be read, so they keep what the command has always done.
  describe.each([11, 12])('on core %i', (generation) => {
    beforeEach(() => {
      onCore(generation);
    });

    it('looks the token up among the documents of the viewed scene', () => {
      const runner = runnerOver();

      expect(runner.hasCanvasToken('pawn')).toBe(true);
      expect(runner.hasCanvasToken('undrawn')).toBe(true);
      expect(runner.hasCanvasToken('nothing')).toBe(false);
    });

    it.each([
      ['a canvas that shows no scene', { tokens: { get: () => pawn }, scene: null }],
      ['a null canvas', null]
    ])('finds no token on %s', (_case, canvas) => {
      expect(runnerOver([], canvas).hasCanvasToken('pawn')).toBe(false);
    });

    it('hands the macro the actor and the token document, and no speaker', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      const args = { advantage: true };

      await runnerOver([document(execute, 'chat')]).run('m1', { actorId: 'hero', tokenId: 'pawn', args });

      const scope = scopeOf(execute);
      expect(Object.keys(scope)).toEqual(['actor', 'token', 'args']);
      expect(scope['actor']).toBe(hero);
      expect(scope['token']).toBe(pawnDocument);
      expect(scope['args']).toBe(args);
      expect(getSpeaker).not.toHaveBeenCalled();
    });

    it('does not take the actor from the token', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);

      await runnerOver([document(execute)]).run('m1', { tokenId: 'pawn' });

      expect(Object.keys(scopeOf(execute))).toEqual(['token']);
    });
  });
});
