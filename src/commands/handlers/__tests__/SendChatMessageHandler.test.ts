import { sendChatMessageHandler } from '../SendChatMessageHandler';

const mockMessage = { id: 'msg-123' };

const mockChatMessage = {
  create: jest.fn().mockResolvedValue(mockMessage),
  getSpeaker: jest.fn().mockReturnValue({ alias: 'Gamemaster', actor: undefined, scene: 'scene-1' }),
  STYLE: { IC: 1, OOC: 2, EMOTE: 3 }
};

const mockGame = {
  actors: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['ChatMessage'] = mockChatMessage;
(global as Record<string, unknown>)['game'] = mockGame;

describe('sendChatMessageHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatMessage.getSpeaker.mockReturnValue({ alias: 'Gamemaster', actor: undefined, scene: 'scene-1' });
    mockChatMessage.create.mockResolvedValue(mockMessage);
    mockGame.actors.get.mockReturnValue(undefined);
  });

  it('sends basic message', async () => {
    const result = await sendChatMessageHandler({ content: 'Hello world' });

    expect(mockChatMessage.create).toHaveBeenCalledWith({
      content: 'Hello world',
      speaker: { alias: 'Gamemaster', actor: undefined, scene: 'scene-1' }
    });
    expect(result).toEqual({ messageId: 'msg-123', sent: true });
  });

  it('sets speaker alias', async () => {
    await sendChatMessageHandler({ content: 'Hello', speaker: 'Bartender' });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    const speaker = callArgs[0]['speaker'] as Record<string, unknown>;
    expect(speaker['alias']).toBe('Bartender');
  });

  it('sets speaker from actorId', async () => {
    mockGame.actors.get.mockReturnValue({ name: 'Goblin King' });

    await sendChatMessageHandler({ content: 'Bow before me!', actorId: 'actor-1' });

    expect(mockGame.actors.get).toHaveBeenCalledWith('actor-1');
    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    const speaker = callArgs[0]['speaker'] as Record<string, unknown>;
    expect(speaker['alias']).toBe('Goblin King');
    expect(speaker['actor']).toBe('actor-1');
  });

  it('uses speaker alias as fallback when actor not found', async () => {
    mockGame.actors.get.mockReturnValue(undefined);

    await sendChatMessageHandler({ content: 'Hello', actorId: 'nonexistent', speaker: 'Mystery NPC' });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    const speaker = callArgs[0]['speaker'] as Record<string, unknown>;
    expect(speaker['alias']).toBe('Mystery NPC');
    expect(speaker['actor']).toBe('nonexistent');
  });

  it('sets flavor text', async () => {
    await sendChatMessageHandler({ content: 'You enter the cave...', flavor: 'Narration' });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    expect(callArgs[0]['flavor']).toBe('Narration');
  });

  it('sets whisper recipients', async () => {
    await sendChatMessageHandler({ content: 'Secret info', whisperTo: ['user-1', 'user-2'] });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    expect(callArgs[0]['whisper']).toEqual(['user-1', 'user-2']);
  });

  it('sets IC style', async () => {
    await sendChatMessageHandler({ content: 'In character speech', type: 'ic' });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    expect(callArgs[0]['style']).toBe(1);
  });

  it('sets OOC style', async () => {
    await sendChatMessageHandler({ content: 'Out of character', type: 'ooc' });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    expect(callArgs[0]['style']).toBe(2);
  });

  it('sets emote style', async () => {
    await sendChatMessageHandler({ content: 'nods slowly', type: 'emote' });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    expect(callArgs[0]['style']).toBe(3);
  });

  it('throws on empty content', async () => {
    await expect(sendChatMessageHandler({ content: '' }))
      .rejects.toThrow('Message content cannot be empty');
  });

  it('throws on whitespace-only content', async () => {
    await expect(sendChatMessageHandler({ content: '   ' }))
      .rejects.toThrow('Message content cannot be empty');
  });

  it('does not include flavor when not provided', async () => {
    await sendChatMessageHandler({ content: 'Hello' });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    expect(callArgs[0]['flavor']).toBeUndefined();
  });

  it('does not include whisper when not provided', async () => {
    await sendChatMessageHandler({ content: 'Hello' });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    expect(callArgs[0]['whisper']).toBeUndefined();
  });

  it('does not include style when type not provided', async () => {
    await sendChatMessageHandler({ content: 'Hello' });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    expect(callArgs[0]['style']).toBeUndefined();
  });

  it('supports HTML content', async () => {
    const html = '<p>You enter <strong>the dark cave</strong>. <em>Water drips from the ceiling.</em></p>';
    await sendChatMessageHandler({ content: html });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    expect(callArgs[0]['content']).toBe(html);
  });

  it('combines all params', async () => {
    mockGame.actors.get.mockReturnValue({ name: 'Innkeeper' });

    const result = await sendChatMessageHandler({
      content: '<p>Welcome to my tavern!</p>',
      actorId: 'innkeeper-id',
      flavor: 'The Rusty Dragon Inn',
      whisperTo: ['user-1'],
      type: 'ic'
    });

    const callArgs = mockChatMessage.create.mock.calls[0] as [Record<string, unknown>];
    const speaker = callArgs[0]['speaker'] as Record<string, unknown>;
    expect(speaker['alias']).toBe('Innkeeper');
    expect(speaker['actor']).toBe('innkeeper-id');
    expect(callArgs[0]['flavor']).toBe('The Rusty Dragon Inn');
    expect(callArgs[0]['whisper']).toEqual(['user-1']);
    expect(callArgs[0]['style']).toBe(1);
    expect(result.sent).toBe(true);
  });
});
