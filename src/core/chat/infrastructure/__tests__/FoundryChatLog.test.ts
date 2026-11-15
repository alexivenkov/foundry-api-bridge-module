import { FoundryChatActors } from '../FoundryChatActors';
import { FoundryChatLog } from '../FoundryChatLog';
import type {
  FoundryChatActor,
  FoundryChatConstants,
  FoundryChatGlobals,
  FoundryChatMessageDocument,
  FoundryChatSpeaker
} from '../foundryChatTypes';

function document(overrides: Partial<FoundryChatMessageDocument> = {}): FoundryChatMessageDocument {
  return {
    id: 'm1',
    timestamp: 1700000000000,
    style: 2,
    content: '<p>Hello</p>',
    flavor: '',
    whisper: [],
    speaker: { alias: 'Gandalf', actor: 'a1', token: 't1', scene: 's1' },
    rolls: [],
    isRoll: false,
    author: { id: 'u1', name: 'Player 1' },
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    export: jest.fn().mockReturnValue('[Gandalf] Hello'),
    ...overrides
  };
}

interface FakeActor extends FoundryChatActor {
  id: string;
  name: string;
  /** The actor's own token on the viewed scene, when it has one. */
  tokenId?: string;
}

// CONST.CHAT_MESSAGE_STYLES of Foundry 13.351 and 14.368.
const CORE_STYLES = { OTHER: 0, OOC: 1, IC: 2, EMOTE: 3 };

// CONST.CHAT_MESSAGE_TYPES of Foundry 11, where whispers and rolls were styles too.
const FOUNDRY_11_TYPES = { OTHER: 0, OOC: 1, IC: 2, EMOTE: 3, WHISPER: 4, ROLL: 5 };

// The speaker the GM would get with a token selected on the canvas.
const CONTROLLED: FoundryChatSpeaker = {
  scene: 's1',
  token: 'controlled-token',
  actor: 'controlled-actor',
  alias: 'Controlled Orc'
};

/**
 * `ChatMessage.getSpeaker` as the core implements it (identical in 13.351 and
 * 14.368): an actor speaks through its own token on the viewed scene or
 * through no token; without an actor the controlled token speaks.
 */
function coreGetSpeaker(options?: { actor: FoundryChatActor }): FoundryChatSpeaker {
  if (options === undefined) {
    return { ...CONTROLLED };
  }
  const actor = options.actor as FakeActor;
  return actor.tokenId !== undefined
    ? { scene: 's1', token: actor.tokenId, actor: actor.id, alias: actor.name }
    : { scene: 's1', actor: actor.id, token: null, alias: actor.name };
}

interface World {
  globals: FoundryChatGlobals;
  create: jest.Mock;
  getSpeaker: jest.Mock;
  deleteDocuments: jest.Mock;
}

function world(
  documents: FoundryChatMessageDocument[] = [],
  actors: FakeActor[] = [],
  constants: FoundryChatConstants | null = { CHAT_MESSAGE_STYLES: CORE_STYLES }
): World {
  const create = jest.fn().mockResolvedValue({ id: 'created' });
  const getSpeaker = jest.fn(coreGetSpeaker);
  const deleteDocuments = jest.fn().mockResolvedValue(undefined);
  return {
    globals: {
      game: {
        messages: { contents: documents, get: (id) => documents.find((doc) => doc.id === id) },
        actors: { get: (id) => actors.find((actor) => actor.id === id) }
      },
      ChatMessage: { create, getSpeaker, deleteDocuments },
      ...(constants !== null ? { CONST: constants } : {})
    },
    create,
    getSpeaker,
    deleteDocuments
  };
}

function createdWith(target: World): Record<string, unknown> {
  return (target.create.mock.calls[0] as [Record<string, unknown>])[0];
}

function logOver(target: World): FoundryChatLog {
  return new FoundryChatLog(() => target.globals);
}

describe('FoundryChatLog', () => {
  describe('reading', () => {
    it('maps a message document to the domain vocabulary', () => {
      const log = logOver(world([document({ flavor: 'Attack Roll', isRoll: true, whisper: ['u2'] })]));

      expect(log.listMessages()).toEqual([
        {
          id: 'm1',
          timestamp: 1700000000000,
          author: { id: 'u1', name: 'Player 1' },
          speaker: { alias: 'Gandalf', actorId: 'a1', tokenId: 't1' },
          content: '<p>Hello</p>',
          flavor: 'Attack Roll',
          style: 'ic',
          isRoll: true,
          whisper: ['u2']
        }
      ]);
    });

    it.each([
      [0, 'other'],
      [1, 'ooc'],
      [2, 'ic'],
      [3, 'emote'],
      [9, 'other']
    ])('reads the style code %i as %s', (style, expected) => {
      expect(logOver(world([document({ style })])).listMessages()[0]?.style).toBe(expected);
    });

    it('reads a message without author, speaker details or flavor', () => {
      const bare = document({ author: null, flavor: '', speaker: {} });

      expect(logOver(world([bare])).listMessages()[0]).toMatchObject({
        author: null,
        speaker: { alias: '', actorId: null, tokenId: null },
        flavor: null
      });
    });

    it('lists ids and knows which messages exist', () => {
      const log = logOver(world([document({ id: 'm1' }), document({ id: 'm2' })]));

      expect(log.listMessageIds()).toEqual(['m1', 'm2']);
      expect(log.hasMessage('m2')).toBe(true);
      expect(log.hasMessage('gone')).toBe(false);
    });

    it('summarizes the rolls of a message', () => {
      const fullRoll = { formula: '1d20+5', total: 18, terms: [], options: {} };
      const log = logOver(world([document({ rolls: [fullRoll, { formula: '2d6', total: 7 }] })]));

      expect(log.listRolls('m1')).toEqual([
        { formula: '1d20+5', total: 18 },
        { formula: '2d6', total: 7 }
      ]);
      expect(log.listRolls('gone')).toEqual([]);
    });

    it('asks every message for its own export line', () => {
      const first = document({ id: 'm1' });
      const second = document({ id: 'm2', export: jest.fn().mockReturnValue('[GM] World') });

      expect(logOver(world([first, second])).exportEntries()).toEqual(['[Gandalf] Hello', '[GM] World']);
    });

    it('reads the globals at call time, not when it is built', () => {
      const holder = { current: world([]) };
      const log = new FoundryChatLog(() => holder.current.globals);

      holder.current = world([document({ id: 'late' })]);

      expect(log.listMessageIds()).toEqual(['late']);
    });
  });

  describe('postMessage', () => {
    const goblinKing: FakeActor = { id: 'a1', name: 'Goblin King' };

    it('creates the message under the speaker the core proposes for the current user', async () => {
      const target = world();

      await expect(logOver(target).postMessage({ content: 'Hello', speaker: {} })).resolves.toBe('created');

      expect(target.getSpeaker).toHaveBeenCalledWith();
      expect(target.create).toHaveBeenCalledWith({ content: 'Hello', speaker: CONTROLLED });
      expect(Object.keys(createdWith(target))).toEqual(['content', 'speaker']);
    });

    it('renames the proposed speaker', async () => {
      const target = world();

      await logOver(target).postMessage({ content: 'Hello', speaker: { alias: 'Bartender' } });

      expect(createdWith(target)['speaker']).toEqual({ ...CONTROLLED, alias: 'Bartender' });
    });

    describe('for an actor', () => {
      it('lets the core build the speaker for that actor, not for the token the GM controls', async () => {
        const target = world([], [goblinKing]);

        await logOver(target).postMessage({ content: 'Bow!', speaker: { actorId: 'a1', alias: 'Goblin King' } });

        expect(target.getSpeaker).toHaveBeenCalledTimes(1);
        expect((target.getSpeaker.mock.calls[0] as [{ actor: unknown }])[0].actor).toBe(goblinKing);
        expect(createdWith(target)['speaker']).toEqual({
          scene: 's1',
          actor: 'a1',
          token: null,
          alias: 'Goblin King'
        });
      });

      it('speaks through the actor own token when it stands on the viewed scene', async () => {
        const target = world([], [{ ...goblinKing, tokenId: 'goblin-token' }]);

        await logOver(target).postMessage({ content: 'Bow!', speaker: { actorId: 'a1', alias: 'Goblin King' } });

        expect(createdWith(target)['speaker']).toEqual({
          scene: 's1',
          token: 'goblin-token',
          actor: 'a1',
          alias: 'Goblin King'
        });
      });

      it('keeps the alias the core gives the actor when none is chosen', async () => {
        const target = world([], [goblinKing]);

        await logOver(target).postMessage({ content: 'Bow!', speaker: { actorId: 'a1' } });

        expect(createdWith(target)['speaker']).toMatchObject({ actor: 'a1', alias: 'Goblin King' });
      });

      it('names an actor that does not exist without any token', async () => {
        const target = world();

        await logOver(target).postMessage({ content: 'Boo', speaker: { actorId: 'ghost', alias: 'Mystery NPC' } });

        expect(target.getSpeaker).toHaveBeenCalledWith();
        expect(createdWith(target)['speaker']).toEqual({
          scene: 's1',
          token: null,
          actor: 'ghost',
          alias: 'Mystery NPC'
        });
      });

      it('leaves the default alias on an unknown actor without a name to speak under', async () => {
        const target = world();

        await logOver(target).postMessage({ content: 'Boo', speaker: { actorId: 'ghost' } });

        expect(createdWith(target)['speaker']).toMatchObject({ actor: 'ghost', token: null, alias: 'Controlled Orc' });
      });
    });

    it('writes flavor, whisper recipients and the style only when they are set', async () => {
      const target = world();

      await logOver(target).postMessage({
        content: 'Psst',
        speaker: {},
        flavor: 'Secret',
        whisper: ['u1', 'u2'],
        style: 'emote'
      });

      expect(target.create).toHaveBeenCalledWith({
        content: 'Psst',
        speaker: CONTROLLED,
        flavor: 'Secret',
        whisper: ['u1', 'u2'],
        style: 3
      });
      expect(Object.keys(createdWith(target))).toEqual(['content', 'speaker', 'flavor', 'whisper', 'style']);
    });

    describe('style', () => {
      it.each([
        ['ic', 2],
        ['ooc', 1],
        ['emote', 3]
      ] as const)('writes the %s style to the style field with the code of CONST.CHAT_MESSAGE_STYLES', async (style, code) => {
        const target = world();

        await logOver(target).postMessage({ content: 'Hello', speaker: {}, style });

        expect(createdWith(target)['style']).toBe(code);
        expect('type' in createdWith(target)).toBe(false);
      });

      it('does not touch the deprecated CHAT_MESSAGE_TYPES alias while the style table exists', async () => {
        // Foundry 13 keeps CHAT_MESSAGE_TYPES as a proxy that logs a deprecation on every read.
        const deprecationLogged = jest.fn();
        const constants = {
          CHAT_MESSAGE_STYLES: CORE_STYLES,
          get CHAT_MESSAGE_TYPES(): typeof CORE_STYLES {
            deprecationLogged();
            return CORE_STYLES;
          }
        };
        const target = world([], [], constants);

        await logOver(target).postMessage({ content: 'Hello', speaker: {}, style: 'ic' });

        expect(createdWith(target)['style']).toBe(2);
        expect(deprecationLogged).not.toHaveBeenCalled();
      });

      it('falls back to the numeric type of Foundry 11, which has no style table', async () => {
        const target = world([], [], { CHAT_MESSAGE_TYPES: FOUNDRY_11_TYPES });

        await logOver(target).postMessage({ content: 'Hello', speaker: {}, style: 'ooc' });

        expect(createdWith(target)['type']).toBe(1);
        expect('style' in createdWith(target)).toBe(false);
      });

      it.each([
        ['neither table', {}],
        ['no CONST at all', null]
      ])('writes no style when the core offers %s', async (_case, constants) => {
        const target = world([], [], constants);

        await logOver(target).postMessage({ content: 'Hello', speaker: {}, style: 'ic' });

        expect(Object.keys(createdWith(target))).toEqual(['content', 'speaker']);
      });
    });

    it.each([undefined, null])('resolves to null when the core created nothing (%p)', async (nothing) => {
      const target = world();
      target.create.mockResolvedValue(nothing);

      await expect(logOver(target).postMessage({ content: 'Hello', speaker: {} })).resolves.toBeNull();
    });
  });

  describe('updateMessage', () => {
    it('sends only the attributes that changed', async () => {
      const doc = document();
      const log = logOver(world([doc]));

      await expect(log.updateMessage('m1', { flavor: 'New flavor' })).resolves.toBe(true);
      expect(doc.update).toHaveBeenCalledWith({ flavor: 'New flavor' });

      await log.updateMessage('m1', { content: 'C', flavor: null });
      expect(doc.update).toHaveBeenLastCalledWith({ content: 'C', flavor: null });
    });

    it('resolves to false for an unknown message', async () => {
      await expect(logOver(world()).updateMessage('gone', { content: 'x' })).resolves.toBe(false);
    });
  });

  describe('deleting', () => {
    it('deletes one message through its document', async () => {
      const doc = document();

      await logOver(world([doc])).deleteMessage('m1');

      expect(doc.delete).toHaveBeenCalledTimes(1);
    });

    it('does nothing for a message that is already gone', async () => {
      await expect(logOver(world()).deleteMessage('gone')).resolves.toBeUndefined();
    });

    it('deletes several messages in one request', async () => {
      const target = world();

      await logOver(target).deleteMessages(['m1', 'm2']);

      expect(target.deleteDocuments).toHaveBeenCalledWith(['m1', 'm2']);
    });
  });
});

describe('FoundryChatActors', () => {
  it('finds the name of an actor', () => {
    const actors = new FoundryChatActors(() => world([], [{ id: 'a1', name: 'Goblin King' }]).globals);

    expect(actors.findActorName('a1')).toBe('Goblin King');
  });

  it('knows no name for an actor that does not exist', () => {
    expect(new FoundryChatActors(() => world().globals).findActorName('ghost')).toBeNull();
  });
});
