import {
  ChatMessageCreationCancelledError,
  ChatMessageNotFoundError,
  EmptyChatMessageError,
  NoChatMessageChangesError
} from '../../domain';
import { ChatService } from '../ChatService';
import type { SendChatMessageCommand } from '../commands';
import { FakeActorDirectory, FakeChatLog, message } from './fakePorts';

function setup(log: FakeChatLog = new FakeChatLog(), actors: FakeActorDirectory = new FakeActorDirectory()): {
  service: ChatService;
  log: FakeChatLog;
  actors: FakeActorDirectory;
} {
  return { service: new ChatService({ log, actors }), log, actors };
}

function send(overrides: Partial<SendChatMessageCommand> = {}): SendChatMessageCommand {
  return {
    content: 'Hello',
    actorId: undefined,
    speakerName: undefined,
    flavor: undefined,
    whisperTo: [],
    style: undefined,
    ...overrides
  };
}

describe('ChatService', () => {
  describe('listMessages', () => {
    const history = [
      message({ id: 'm1', style: 'ooc' }),
      message({ id: 'm2', isRoll: true }),
      message({ id: 'm3', style: 'ooc' }),
      message({ id: 'm4', isRoll: true })
    ];
    const rolls = { m2: [{ formula: '1d20+5', total: 18 }], m4: [{ formula: '2d6', total: 7 }] };

    it('reports the size of the whole log next to the selected page', () => {
      const { service } = setup(new FakeChatLog(history));

      const page = service.listMessages({ filter: { kind: 'ooc', limit: 1 }, includeRolls: false });

      expect(page.entries.map((entry) => entry.message.id)).toEqual(['m3']);
      expect(page.total).toBe(4);
      expect(page.hasMore).toBe(true);
    });

    it('leaves the rolls out unless they are asked for', () => {
      const { service, log } = setup(new FakeChatLog(history, rolls));

      const page = service.listMessages({ filter: {}, includeRolls: false });

      expect(page.entries.every((entry) => entry.rolls.length === 0)).toBe(true);
      expect(log.rollsRead).toEqual([]);
    });

    it('reads the rolls of the selected messages only', () => {
      const { service, log } = setup(new FakeChatLog(history, rolls));

      const page = service.listMessages({ filter: { limit: 2 }, includeRolls: true });

      expect(page.entries.map((entry) => entry.rolls)).toEqual([[], [{ formula: '2d6', total: 7 }]]);
      expect(log.rollsRead).toEqual(['m3', 'm4']);
    });

    it('lists nothing from an empty log', () => {
      expect(setup().service.listMessages({ filter: {}, includeRolls: true })).toEqual({
        entries: [],
        total: 0,
        hasMore: false
      });
    });
  });

  describe('sendMessage', () => {
    it('posts the message with the default speaker and returns its id', async () => {
      const { service, log, actors } = setup();

      await expect(service.sendMessage(send({ content: '<p>Hello</p>' }))).resolves.toBe('new-message');

      expect(log.posted).toEqual([
        { content: '<p>Hello</p>', speaker: {}, flavor: undefined, whisper: undefined, style: undefined }
      ]);
      expect(actors.lookedUp).toEqual([]);
    });

    it.each(['', '   ', '\n'])('refuses the empty content %j without posting', async (content) => {
      const { service, log } = setup();

      await expect(service.sendMessage(send({ content }))).rejects.toThrow(EmptyChatMessageError);
      await expect(service.sendMessage(send({ content }))).rejects.toThrow('Message content cannot be empty');
      expect(log.posted).toEqual([]);
    });

    it('speaks for an actor under the actor name', async () => {
      const { service, log } = setup(new FakeChatLog(), new FakeActorDirectory({ a1: 'Goblin King' }));

      await service.sendMessage(send({ actorId: 'a1', speakerName: 'Ignored' }));

      expect(log.posted[0]?.speaker).toEqual({ actorId: 'a1', alias: 'Goblin King' });
    });

    it('falls back to the given name when the actor is unknown', async () => {
      const { service, log, actors } = setup();

      await service.sendMessage(send({ actorId: 'ghost', speakerName: 'Mystery NPC' }));

      expect(actors.lookedUp).toEqual(['ghost']);
      expect(log.posted[0]?.speaker).toEqual({ actorId: 'ghost', alias: 'Mystery NPC' });
    });

    it('speaks under a given name without an actor', async () => {
      const { service, log } = setup();

      await service.sendMessage(send({ speakerName: 'Bartender' }));

      expect(log.posted[0]?.speaker).toEqual({ alias: 'Bartender' });
    });

    it('passes flavor, style and whisper recipients on', async () => {
      const { service, log } = setup();

      await service.sendMessage(send({ flavor: 'Narration', style: 'emote', whisperTo: ['p1', 'p2'] }));

      expect(log.posted[0]).toMatchObject({ flavor: 'Narration', style: 'emote', whisper: ['p1', 'p2'] });
    });

    it('posts publicly when no recipient is named', async () => {
      const { service, log } = setup();

      await service.sendMessage(send({ whisperTo: [] }));

      expect(log.posted[0]?.whisper).toBeUndefined();
    });

    it('fails when the core created nothing', async () => {
      const { service, log } = setup();
      log.vetoesNewMessages = true;

      await expect(service.sendMessage(send())).rejects.toThrow(ChatMessageCreationCancelledError);
      await expect(service.sendMessage(send())).rejects.toThrow(
        'Chat message creation was cancelled by Foundry (a module hook may have vetoed it)'
      );
    });
  });

  describe('updateMessage', () => {
    it('applies the changes to an existing message', async () => {
      const { service, log } = setup(new FakeChatLog([message({ id: 'm1' })]));

      await service.updateMessage({ messageId: 'm1', changes: { content: 'New', flavor: null } });

      expect(log.updated).toEqual([{ messageId: 'm1', changes: { content: 'New', flavor: null } }]);
    });

    it('rejects an unknown message without touching the log', async () => {
      const { service, log } = setup();

      await expect(service.updateMessage({ messageId: 'gone', changes: { content: 'New' } }))
        .rejects.toThrow(ChatMessageNotFoundError);
      await expect(service.updateMessage({ messageId: 'gone', changes: { content: 'New' } }))
        .rejects.toThrow('Chat message not found: gone');
      expect(log.updated).toEqual([]);
    });

    it('rejects an update that changes nothing', async () => {
      const { service, log } = setup(new FakeChatLog([message({ id: 'm1' })]));

      await expect(service.updateMessage({ messageId: 'm1', changes: {} })).rejects.toThrow(NoChatMessageChangesError);
      await expect(service.updateMessage({ messageId: 'm1', changes: {} })).rejects.toThrow('No updates provided');
      expect(log.updated).toEqual([]);
    });

    it('reports an unknown message before an empty update', async () => {
      await expect(setup().service.updateMessage({ messageId: 'gone', changes: {} }))
        .rejects.toThrow(ChatMessageNotFoundError);
    });

    it('reports the message as missing when it vanished during the update', async () => {
      const { service, log } = setup(new FakeChatLog([message({ id: 'm1' })]));
      log.losesMessageOnUpdate = true;

      await expect(service.updateMessage({ messageId: 'm1', changes: { flavor: 'x' } }))
        .rejects.toThrow(ChatMessageNotFoundError);
    });
  });

  describe('deleteMessage', () => {
    it('deletes an existing message', async () => {
      const { service, log } = setup(new FakeChatLog([message({ id: 'm1' })]));

      await service.deleteMessage({ messageId: 'm1' });

      expect(log.deleted).toEqual(['m1']);
    });

    it('rejects an unknown message without deleting anything', async () => {
      const { service, log } = setup();

      await expect(service.deleteMessage({ messageId: 'gone' })).rejects.toThrow('Chat message not found: gone');
      expect(log.deleted).toEqual([]);
    });
  });

  describe('clearChat', () => {
    it('deletes every message in one go and reports how many there were', async () => {
      const { service, log } = setup(new FakeChatLog([message({ id: 'm1' }), message({ id: 'm2' })]));

      await expect(service.clearChat()).resolves.toBe(2);
      expect(log.cleared).toEqual([['m1', 'm2']]);
    });

    it('does not ask the log to delete nothing', async () => {
      const { service, log } = setup();

      await expect(service.clearChat()).resolves.toBe(0);
      expect(log.cleared).toEqual([]);
    });
  });

  describe('exportChat', () => {
    const history = [
      message({ id: 'm1', content: '<p>Hello <em>there</em></p>', flavor: 'Greeting' }),
      message({ id: 'm2', author: null, isRoll: true, speaker: { alias: 'Goblin', actorId: 'a1', tokenId: null } })
    ];

    it('joins the entries of the text export with newlines', () => {
      const { service } = setup(new FakeChatLog(history));

      expect(service.exportChat({ format: 'text' })).toEqual({
        content: '[Gamemaster] m1\n[Goblin] m2',
        messageCount: 2
      });
    });

    it('writes the JSON export as one array of plain-text records', () => {
      const { service } = setup(new FakeChatLog(history));

      const result = service.exportChat({ format: 'json' });

      expect(result.messageCount).toBe(2);
      expect(result.content).toBe(
        '[{"id":"m1","timestamp":1700000000000,"author":{"userId":"gm","name":"Gamemaster"},' +
          '"speaker":"Gamemaster","content":"Hello there","flavor":"Greeting","isRoll":false},' +
          '{"id":"m2","timestamp":1700000000000,"author":null,' +
          '"speaker":"Goblin","content":"Hello","flavor":null,"isRoll":true}]'
      );
    });

    it.each(['text', 'json'] as const)('exports an empty log as an empty string in %s format', (format) => {
      expect(setup().service.exportChat({ format })).toEqual({ content: '', messageCount: 0 });
    });
  });
});
