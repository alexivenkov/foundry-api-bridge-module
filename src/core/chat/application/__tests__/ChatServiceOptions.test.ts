import { NoActiveSceneError, SceneNotFoundError, TargetTokenNotFoundError } from '../../../shared';
import { VisibilityConflictsWithWhisperError, WhisperRecipientNotFoundError } from '../../domain';
import { ChatService } from '../ChatService';
import type { SendChatMessageCommand } from '../commands';
import { FakeActorDirectory, FakeChatLog } from './fakePorts';
import { FakeActorLocator, FakeChatSpeakers, FakeChatUsers, FakeScenes } from './fakeWorldPorts';

interface Setup {
  service: ChatService;
  log: FakeChatLog;
  speakers: FakeChatSpeakers;
}

function setup(scenes = new FakeScenes()): Setup {
  const log = new FakeChatLog();
  const speakers = new FakeChatSpeakers();
  const service = new ChatService({
    log,
    actors: new FakeActorDirectory({ a1: 'Goblin King' }),
    users: new FakeChatUsers(),
    speakers,
    scenes,
    locator: new FakeActorLocator()
  });
  return { service, log, speakers };
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

describe('ChatService.sendMessage options', () => {
  describe('visibility', () => {
    it('hands the visibility to the log, which applies it the way the core does', async () => {
      const { service, log } = setup();

      await service.sendMessage(send({ visibility: 'gm' }));

      expect(log.posted[0]).toMatchObject({ visibility: 'gm', whisper: undefined });
    });

    it.each(['public', 'self'] as const)('refuses %s with recipients without posting', async (visibility) => {
      const { service, log } = setup();

      await expect(service.sendMessage(send({ visibility, whisperTo: ['u1'] }))).rejects.toThrow(
        VisibilityConflictsWithWhisperError
      );
      await expect(service.sendMessage(send({ visibility, recipients: ['alice'] }))).rejects.toThrow(
        `Visibility '${visibility}' cannot be combined with whisper recipients`
      );
      expect(log.posted).toEqual([]);
    });

    it('lets blind keep the recipients', async () => {
      const { service, log } = setup();

      await service.sendMessage(send({ visibility: 'blind', recipients: ['alice'] }));

      expect(log.posted[0]).toMatchObject({ visibility: 'blind', whisper: ['u1'] });
    });

    it('checks the content first', async () => {
      const { service } = setup();

      await expect(service.sendMessage(send({ content: ' ', visibility: 'public', whisperTo: ['u1'] }))).rejects.toThrow(
        'Message content cannot be empty'
      );
    });
  });

  describe('recipients', () => {
    it('takes a user id as it is and resolves a name the way the core /whisper does', async () => {
      const { service, log } = setup();

      await service.sendMessage(send({ recipients: ['u2', 'Alice', 'players'] }));

      expect(log.posted[0]?.whisper).toEqual(['u2', 'u1']);
    });

    it('adds them to whisperTo, each recipient once', async () => {
      const { service, log } = setup();

      await service.sendMessage(send({ whisperTo: ['legacy-id', 'u1'], recipients: ['alice', 'u2'] }));

      expect(log.posted[0]?.whisper).toEqual(['legacy-id', 'u1', 'u2']);
    });

    it('refuses a recipient that stands for no user, without posting', async () => {
      const { service, log } = setup();

      await expect(service.sendMessage(send({ recipients: ['alice', 'Nobody'] }))).rejects.toThrow(
        WhisperRecipientNotFoundError
      );
      await expect(service.sendMessage(send({ recipients: ['Nobody'] }))).rejects.toThrow(
        'Whisper recipient not found: Nobody'
      );
      expect(log.posted).toEqual([]);
    });

    it('leaves whisperTo as given when no recipients are named', async () => {
      const { service, log } = setup();

      await service.sendMessage(send({ whisperTo: ['x', 'x'], recipients: [] }));

      expect(log.posted[0]?.whisper).toEqual(['x', 'x']);
    });
  });

  describe('speaker', () => {
    it('lets a token speak, on the active scene by default', async () => {
      const { service, log, speakers } = setup();

      await service.sendMessage(send({ speakerToken: { tokenId: 't1', sceneId: undefined } }));

      expect(speakers.requests).toEqual([{ subject: { kind: 'token', sceneId: 's1', tokenId: 't1' }, alias: undefined }]);
      expect(log.posted[0]?.speaker).toEqual({
        resolved: { alias: 'Token Name', actorId: 'a1', tokenId: 't1', sceneId: 's1' }
      });
    });

    it('lets a token without an actor speak too', async () => {
      const { service, log } = setup();

      await service.sendMessage(send({ speakerToken: { tokenId: 'statue', sceneId: 's1' }, alias: 'The Statue' }));

      expect(log.posted[0]?.speaker.resolved).toMatchObject({ alias: 'The Statue', tokenId: 'statue' });
    });

    it('prefers the token over the actor and the alias over the legacy speaker name', async () => {
      const { service, log } = setup();

      await service.sendMessage(
        send({ speakerToken: { tokenId: 't1', sceneId: undefined }, actorId: 'a1', speakerName: 'Ignored', alias: 'Grik' })
      );

      expect(log.posted[0]?.speaker).toEqual({
        resolved: { alias: 'Grik', actorId: 'a1', tokenId: 't1', sceneId: 's1' }
      });
    });

    it('names the token that is not on the scene', async () => {
      const { service, log } = setup();

      await expect(service.sendMessage(send({ speakerToken: { tokenId: 'gone', sceneId: undefined } }))).rejects.toThrow(
        TargetTokenNotFoundError
      );
      await expect(service.sendMessage(send({ speakerToken: { tokenId: 'gone', sceneId: undefined } }))).rejects.toThrow(
        'Token not found: gone'
      );
      expect(log.posted).toEqual([]);
    });

    it('fails on an unknown scene, or without an active one', async () => {
      await expect(
        setup().service.sendMessage(send({ speakerToken: { tokenId: 't1', sceneId: 'nope' } }))
      ).rejects.toThrow(SceneNotFoundError);
      await expect(
        setup(new FakeScenes([], null)).service.sendMessage(send({ speakerToken: { tokenId: 't1', sceneId: undefined } }))
      ).rejects.toThrow(NoActiveSceneError);
    });

    it('puts the alias over the actor name', async () => {
      const { service, log } = setup();

      await service.sendMessage(send({ actorId: 'a1', speakerName: 'Ignored', alias: 'Grik' }));

      expect(log.posted[0]?.speaker).toEqual({ actorId: 'a1', alias: 'Grik' });
    });

    it('puts the alias over an unknown actor too, which stays a legacy actor speaker', async () => {
      const { service, log } = setup();

      await service.sendMessage(send({ actorId: 'ghost', alias: 'Mystery' }));

      expect(log.posted[0]?.speaker).toEqual({ actorId: 'ghost', alias: 'Mystery' });
    });

    it('speaks under an alias alone without any actor or token', async () => {
      const { service, log, speakers } = setup();

      await service.sendMessage(send({ alias: 'Narrator', speakerName: 'Ignored' }));

      expect(speakers.requests).toEqual([{ subject: 'standalone', alias: 'Narrator' }]);
      expect(log.posted[0]?.speaker).toEqual({
        resolved: { alias: 'Narrator', actorId: null, tokenId: null, sceneId: 's1' }
      });
    });
  });

  it('names the port a service composed for the older use cases lacks', async () => {
    const service = new ChatService({ log: new FakeChatLog(), actors: new FakeActorDirectory() });

    await expect(service.sendMessage(send({ recipients: ['alice'] }))).rejects.toThrow(
      'The chat context was composed without its users port'
    );
  });
});
