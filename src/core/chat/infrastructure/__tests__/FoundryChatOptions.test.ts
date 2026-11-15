import { FoundryChatLog } from '../FoundryChatLog';
import { FoundryChatSpeakers } from '../FoundryChatSpeakers';
import { FoundryChatUsers } from '../FoundryChatUsers';
import { toChatMessage } from '../chatMessageMapper';
import type {
  FoundryChatGlobals,
  FoundryChatMessageData,
  FoundryChatMessageDocument,
  FoundryChatSpeaker,
  FoundryChatSpeakerGlobals,
  FoundryChatSpeakerOptions
} from '../foundryChatTypes';

const GM = 'GMGMGMGMGMGMGMGM';
const ALICE = 'P1P1P1P1P1P1P1P1';

function runOn(generation: number): void {
  (global as Record<string, unknown>)['game'] = { release: { generation } };
}

afterEach(() => {
  delete (global as Record<string, unknown>)['game'];
});

/**
 * `ChatMessage.applyRollMode` (13.351) / `applyMode` (14.368) as the probe of
 * both cores showed: public clears the recipients, self whispers to the current
 * user, gm and blind keep given recipients or whisper to the GMs; blind sets the flag.
 */
function coreVisibility(data: FoundryChatMessageData, mode: 'public' | 'gm' | 'blind' | 'self'): void {
  const given = data.whisper ?? [];
  data.whisper = mode === 'public' ? [] : mode === 'self' ? [GM] : given.length > 0 ? given : [GM];
  data.blind = mode === 'blind';
}

const LEGACY_MODES: Record<string, 'public' | 'gm' | 'blind' | 'self'> = {
  publicroll: 'public',
  gmroll: 'gm',
  blindroll: 'blind',
  selfroll: 'self'
};

interface ChatWorld {
  globals: FoundryChatGlobals;
  create: jest.Mock;
  getSpeaker: jest.Mock;
  applyRollMode: jest.Mock;
  applyMode: jest.Mock;
}

function chatWorld(): ChatWorld {
  const create = jest.fn().mockResolvedValue({ id: 'created' });
  const getSpeaker = jest.fn((): FoundryChatSpeaker => ({ scene: 's1', token: 'controlled', actor: 'a9', alias: 'Orc' }));
  const applyRollMode = jest.fn((data: FoundryChatMessageData, mode: string) => {
    coreVisibility(data, LEGACY_MODES[mode] ?? 'gm');
    return data;
  });
  const applyMode = jest.fn((data: FoundryChatMessageData, mode: string) => {
    coreVisibility(data, LEGACY_MODES[`${mode}roll`] ?? 'gm');
    return data;
  });
  return {
    globals: {
      game: { messages: { contents: [], get: () => undefined }, actors: { get: () => undefined } },
      ChatMessage: { create, getSpeaker, deleteDocuments: jest.fn(), applyRollMode, applyMode },
      CONST: { CHAT_MESSAGE_STYLES: { IC: 2, OOC: 1, EMOTE: 3 } }
    },
    create,
    getSpeaker,
    applyRollMode,
    applyMode
  };
}

function createdWith(world: ChatWorld): FoundryChatMessageData {
  return (world.create.mock.calls[0] as [FoundryChatMessageData])[0];
}

describe('FoundryChatLog.postMessage options', () => {
  const resolved = { alias: 'Goblin Scout', actorId: 'a1', tokenId: 't1', sceneId: 's2' };

  it('posts a resolved speaker as it is, without asking the core for one', async () => {
    const world = chatWorld();

    await new FoundryChatLog(() => world.globals).postMessage({ content: 'Hi', speaker: { resolved, alias: 'x' } });

    expect(world.getSpeaker).not.toHaveBeenCalled();
    expect(createdWith(world).speaker).toEqual({ scene: 's2', actor: 'a1', token: 't1', alias: 'Goblin Scout' });
  });

  it.each([
    ['public', 'publicroll', [], false],
    ['gm', 'gmroll', [GM], false],
    ['blind', 'blindroll', [GM], true],
    ['self', 'selfroll', [GM], false]
  ] as const)('applies %s through applyRollMode(%s) on Foundry 13', async (visibility, code, whisper, blind) => {
    runOn(13);
    const world = chatWorld();

    await new FoundryChatLog(() => world.globals).postMessage({ content: 'Hi', speaker: {}, visibility });

    expect(world.applyRollMode).toHaveBeenCalledWith(expect.objectContaining({ content: 'Hi' }), code);
    expect(world.applyMode).not.toHaveBeenCalled();
    expect(createdWith(world)).toMatchObject({ whisper, blind });
  });

  it.each(['public', 'gm', 'blind', 'self'] as const)('applies %s through applyMode on Foundry 14', async (visibility) => {
    runOn(14);
    const world = chatWorld();

    await new FoundryChatLog(() => world.globals).postMessage({ content: 'Hi', speaker: {}, visibility });

    expect(world.applyMode).toHaveBeenCalledWith(expect.objectContaining({ content: 'Hi' }), visibility);
    expect(world.applyRollMode).not.toHaveBeenCalled();
  });

  it('applies the visibility over the recipients, after the other fields are written', async () => {
    runOn(14);
    const world = chatWorld();

    await new FoundryChatLog(() => world.globals).postMessage({
      content: 'Psst',
      speaker: {},
      whisper: [ALICE],
      style: 'ooc',
      visibility: 'blind'
    });

    expect(createdWith(world)).toMatchObject({ whisper: [ALICE], blind: true, style: 1 });
  });

  it('writes no blind flag without a visibility', async () => {
    const world = chatWorld();

    await new FoundryChatLog(() => world.globals).postMessage({ content: 'Hi', speaker: {} });

    expect('blind' in createdWith(world)).toBe(false);
    expect(world.applyRollMode).not.toHaveBeenCalled();
  });

  it('fails rather than post a message the core cannot hide', async () => {
    runOn(14);
    const world = chatWorld();
    delete world.globals.ChatMessage.applyMode;

    await expect(
      new FoundryChatLog(() => world.globals).postMessage({ content: 'Hi', speaker: {}, visibility: 'gm' })
    ).rejects.toThrow('ChatMessage.applyMode is missing');
    expect(world.create).not.toHaveBeenCalled();
  });
});

describe('toChatMessage', () => {
  it('reads the blind flag as stored', () => {
    const document = { id: 'm1', timestamp: 1, style: 0, content: '', flavor: '', whisper: [GM], blind: true, speaker: {} };

    expect(toChatMessage({ ...document, rolls: [], isRoll: true, author: null } as unknown as FoundryChatMessageDocument).blind).toBe(true);
  });
});

describe('FoundryChatSpeakers', () => {
  const goblin = { id: 'a1', name: 'Goblin' };
  const scoutToken = { id: 't1', actor: goblin };
  const statueToken = { id: 'statue', actor: null };
  const cave = {
    id: 's2',
    name: 'Cave',
    tokens: new Map<string, { id: string; actor: typeof goblin | null }>([
      [scoutToken.id, scoutToken],
      [statueToken.id, statueToken]
    ])
  };

  /** `ChatMessage.getSpeaker` of 13.351 / 14.368 for real documents, as probed. */
  function coreGetSpeaker(options: FoundryChatSpeakerOptions = {}): FoundryChatSpeaker {
    if (options.token === scoutToken) {
      return { scene: 's2', token: 't1', actor: 'a1', alias: options.alias ?? 'Goblin Scout' };
    }
    if (options.token === statueToken) {
      return { scene: 's2', token: 'statue', actor: null, alias: options.alias ?? 'Statue' };
    }
    if (options.actor === goblin) {
      return { scene: 's1', actor: 'a1', token: null, alias: options.alias ?? 'Goblin' };
    }
    return { scene: 's1', token: 'controlled', actor: 'a9', alias: 'Orc' };
  }

  function speakers(): { gateway: FoundryChatSpeakers; getSpeaker: jest.Mock } {
    const getSpeaker = jest.fn(coreGetSpeaker);
    const globals: FoundryChatSpeakerGlobals = {
      game: {
        actors: { get: (id) => (id === goblin.id ? goblin : undefined) },
        scenes: { get: (id) => (id === cave.id ? cave : undefined), active: cave }
      },
      ChatMessage: { getSpeaker }
    };
    return { gateway: new FoundryChatSpeakers(() => globals), getSpeaker };
  }

  it('hands the core the token document itself', () => {
    const { gateway, getSpeaker } = speakers();

    expect(gateway.speakerFor({ kind: 'token', sceneId: 's2', tokenId: 't1' }, undefined)).toEqual({
      alias: 'Goblin Scout',
      actorId: 'a1',
      tokenId: 't1',
      sceneId: 's2'
    });
    expect(getSpeaker).toHaveBeenCalledWith({ token: scoutToken });
  });

  it('passes the alias on, also for a token without an actor', () => {
    const { gateway, getSpeaker } = speakers();

    expect(gateway.speakerFor({ kind: 'token', sceneId: 's2', tokenId: 'statue' }, 'The Statue')).toEqual({
      alias: 'The Statue',
      actorId: null,
      tokenId: 'statue',
      sceneId: 's2'
    });
    expect(getSpeaker).toHaveBeenCalledWith({ token: statueToken, alias: 'The Statue' });
  });

  it('hands the core the world actor', () => {
    const { gateway, getSpeaker } = speakers();

    expect(gateway.speakerFor({ kind: 'world', actorId: 'a1' }, 'Grik')).toEqual({
      alias: 'Grik',
      actorId: 'a1',
      tokenId: null,
      sceneId: 's1'
    });
    expect(getSpeaker).toHaveBeenCalledWith({ actor: goblin, alias: 'Grik' });
  });

  it('fails when the document is gone', () => {
    const { gateway } = speakers();

    expect(() => gateway.speakerFor({ kind: 'world', actorId: 'gone' }, undefined)).toThrow('Actor not found: gone');
    expect(() => gateway.speakerFor({ kind: 'token', sceneId: 'gone', tokenId: 't1' }, undefined)).toThrow(
      'Scene not found: gone'
    );
    expect(() => gateway.speakerFor({ kind: 'token', sceneId: 's2', tokenId: 'gone' }, undefined)).toThrow(
      'Token not found: gone'
    );
  });

  it('keeps only the scene of the speaker the core proposes for a standalone alias', () => {
    const { gateway, getSpeaker } = speakers();

    expect(gateway.standaloneSpeaker('Narrator')).toEqual({
      alias: 'Narrator',
      actorId: null,
      tokenId: null,
      sceneId: 's1'
    });
    expect(getSpeaker).toHaveBeenCalledWith();
  });
});

describe('FoundryChatUsers', () => {
  const users = new Map([[GM, { id: GM, name: 'Gamemaster' }], [ALICE, { id: ALICE, name: 'Alice' }]]);
  const getWhisperRecipients = jest.fn((name: string) => (name.toLowerCase() === 'alice' ? [users.get(ALICE)!] : []));
  const gateway = new FoundryChatUsers(() => ({ game: { users }, ChatMessage: { getWhisperRecipients } }));

  it('knows the users by id', () => {
    expect(gateway.hasUser(ALICE)).toBe(true);
    expect(gateway.hasUser('Alice')).toBe(false);
  });

  it('resolves a name through the core and answers with user ids', () => {
    expect(gateway.findRecipients('alice')).toEqual([ALICE]);
    expect(gateway.findRecipients('Nobody')).toEqual([]);
    expect(getWhisperRecipients).toHaveBeenCalledWith('alice');
  });
});
