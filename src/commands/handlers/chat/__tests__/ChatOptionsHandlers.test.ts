import type { FoundryChatMessageData, FoundryChatWorldGlobals } from '../../../../core/chat/infrastructure';
import { createRollDiceHandler } from '../../RollDiceHandler';
import { createSendChatMessageHandler } from '../../SendChatMessageHandler';
import { ALICE, GM, cave, coreGetSpeaker, diceWorld, goblin, goblinSystem, scoutToken } from './fakeDiceWorld';

afterEach(() => {
  delete (global as Record<string, unknown>)['game'];
});

describe('rollDiceHandler options', () => {
  it('rolls with the actor roll data and posts it for the actor, blind', async () => {
    const world = diceWorld();
    const handler = createRollDiceHandler({ globals: () => world.globals });

    const result = await handler({
      formula: '1d6 + @prof',
      actorId: 'a1',
      showInChat: true,
      flavor: 'Stealth',
      visibility: 'blind'
    });

    expect(world.Roll).toHaveBeenCalledWith('1d6 + @prof', goblinSystem);
    expect(world.toMessage).toHaveBeenCalledWith(
      { flavor: 'Stealth', speaker: { scene: 's1', actor: 'a1', token: null, alias: 'Goblin' } },
      { messageMode: 'blind' }
    );
    expect(result).toEqual({ total: 5, formula: '1d6 + @prof', dice: [{ type: 'd6', count: 1, results: [5] }] });
  });

  it('posts for a token under an alias', async () => {
    const world = diceWorld();
    const handler = createRollDiceHandler({ globals: () => world.globals });

    await handler({ formula: '1d6', tokenId: 't1', sceneId: '', alias: 'Grik', showInChat: true });

    expect(world.getSpeaker).toHaveBeenCalledWith({ token: scoutToken, alias: 'Grik' });
    expect(world.toMessage).toHaveBeenCalledWith({ speaker: { scene: 's1', token: 't1', actor: 'a1', alias: 'Grik' } });
  });

  it('refuses a reference the roll data does not set', async () => {
    const world = diceWorld();
    const handler = createRollDiceHandler({ globals: () => world.globals });

    await expect(handler({ formula: '1d20 + @missing', data: { bonus: 1 } })).rejects.toThrow(
      'Roll formula references data that is not set: @missing'
    );
    expect(world.Roll).not.toHaveBeenCalled();
  });

  it('rejects roll data that is not an object', async () => {
    const handler = createRollDiceHandler({ globals: () => diceWorld().globals });

    await expect(handler({ formula: '1d20', data: 'bonus' } as never)).rejects.toThrow('data');
  });

  it('names an actor that does not exist', async () => {
    const handler = createRollDiceHandler({ globals: () => diceWorld().globals });

    await expect(handler({ formula: '1d20', actorId: 'gone' })).rejects.toThrow('Actor not found: gone');
  });
});

describe('sendChatMessageHandler options', () => {
  interface ChatWorld {
    globals: FoundryChatWorldGlobals;
    create: jest.Mock;
  }

  /** A Foundry 14 world; `applyMode` writes recipients the way the probe showed. */
  function chatWorld(): ChatWorld {
    (global as Record<string, unknown>)['game'] = { release: { generation: 14 } };
    const create = jest.fn().mockResolvedValue({ id: 'm1' });
    const users = new Map([[GM, { id: GM, name: 'Gamemaster' }], [ALICE, { id: ALICE, name: 'Alice' }]]);
    const globals = {
      game: {
        messages: { contents: [], get: () => undefined },
        actors: { get: (id: string) => (id === goblin.id ? goblin : undefined) },
        scenes: { get: (id: string) => (id === cave.id ? cave : undefined), active: cave },
        users
      },
      ChatMessage: {
        create,
        getSpeaker: jest.fn(coreGetSpeaker),
        deleteDocuments: jest.fn(),
        getWhisperRecipients: (name: string) => (name.toLowerCase() === 'alice' ? [users.get(ALICE)] : []),
        applyMode: (data: FoundryChatMessageData, mode: string) => {
          const given = data.whisper ?? [];
          data.whisper = mode === 'public' ? [] : mode === 'self' ? [GM] : given.length > 0 ? given : [GM];
          data.blind = mode === 'blind';
        }
      }
    } as unknown as FoundryChatWorldGlobals;
    return { globals, create };
  }

  function createdWith(world: ChatWorld): FoundryChatMessageData {
    return (world.create.mock.calls[0] as [FoundryChatMessageData])[0];
  }

  it('whispers to a recipient named by user name, gm-only', async () => {
    const world = chatWorld();
    const handler = createSendChatMessageHandler({ globals: () => world.globals });

    await expect(handler({ content: 'Psst', recipients: ['alice'], visibility: 'gm' })).resolves.toEqual({
      messageId: 'm1',
      sent: true
    });
    expect(createdWith(world)).toMatchObject({ whisper: [ALICE], blind: false });
  });

  it('lets a token speak under an alias', async () => {
    const world = chatWorld();
    const handler = createSendChatMessageHandler({ globals: () => world.globals });

    await handler({ content: 'Grr', tokenId: 't1', alias: 'Grik', actorId: 'ignored' });

    expect(createdWith(world).speaker).toEqual({ scene: 's1', token: 't1', actor: 'a1', alias: 'Grik' });
  });

  it('names a recipient that matches no user', async () => {
    const world = chatWorld();
    const handler = createSendChatMessageHandler({ globals: () => world.globals });

    await expect(handler({ content: 'Psst', recipients: ['Nobody'] })).rejects.toThrow('Whisper recipient not found: Nobody');
    expect(world.create).not.toHaveBeenCalled();
  });

  it('refuses a public whisper', async () => {
    const handler = createSendChatMessageHandler({ globals: () => chatWorld().globals });

    await expect(handler({ content: 'Psst', whisperTo: [ALICE], visibility: 'public' })).rejects.toThrow(
      "Visibility 'public' cannot be combined with whisper recipients"
    );
  });

  it('rejects a visibility outside public / gm / blind / self', async () => {
    const handler = createSendChatMessageHandler({ globals: () => chatWorld().globals });

    await expect(handler({ content: 'Hi', visibility: 'loud' } as never)).rejects.toThrow('visibility');
  });

  it('names a token that is not on the scene', async () => {
    const handler = createSendChatMessageHandler({ globals: () => chatWorld().globals });

    await expect(handler({ content: 'Hi', tokenId: 'gone', sceneId: 's1' })).rejects.toThrow('Token not found: gone');
  });
});
