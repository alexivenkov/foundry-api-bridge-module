import { getChatMessagesHandler } from '../GetChatMessagesHandler';

interface MockMessage {
  id: string;
  timestamp: number;
  style: number;
  content: string;
  flavor: string;
  whisper: string[];
  blind: boolean;
  speaker: { alias: string | undefined; actor: string | undefined; token: string | undefined; scene: string | undefined };
  rolls: Array<{ formula: string; total: number }>;
  isRoll: boolean;
  author: { id: string; name: string } | null;
}

function createMockMessage(overrides: Partial<MockMessage> = {}): MockMessage {
  return {
    id: 'msg-1',
    timestamp: 1700000000000,
    style: 2,
    content: '<p>Hello world</p>',
    flavor: '',
    whisper: [],
    blind: false,
    speaker: { alias: 'Gandalf', actor: 'actor-1', token: 'token-1', scene: 'scene-1' },
    rolls: [],
    isRoll: false,
    author: { id: 'user-1', name: 'Player 1' },
    ...overrides
  };
}

let mockMessages: MockMessage[] = [];

beforeEach(() => {
  mockMessages = [];
  (global as Record<string, unknown>)['game'] = {
    messages: {
      get contents() { return mockMessages; },
      get size() { return mockMessages.length; },
      get: jest.fn((id: string) => mockMessages.find(m => m.id === id))
    },
    users: {
      get: jest.fn((id: string) => {
        if (id === 'user-1') return { id: 'user-1', name: 'Player 1' };
        if (id === 'user-2') return { id: 'user-2', name: 'Player 2' };
        return undefined;
      })
    }
  };
  jest.spyOn(console, 'warn').mockImplementation();
});

afterEach(() => jest.restoreAllMocks());

describe('getChatMessagesHandler', () => {
  it('returns empty array when no messages', async () => {
    const result = await getChatMessagesHandler({});
    expect(result.messages).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('returns messages with stripped HTML content', async () => {
    mockMessages = [createMockMessage()];
    const result = await getChatMessagesHandler({});
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.content).toBe('Hello world');
    expect(result.messages[0]!.id).toBe('msg-1');
  });

  it('maps speaker fields correctly', async () => {
    mockMessages = [createMockMessage()];
    const result = await getChatMessagesHandler({});
    const msg = result.messages[0]!;
    expect(msg.speaker.alias).toBe('Gandalf');
    expect(msg.speaker.actorId).toBe('actor-1');
    expect(msg.speaker.tokenId).toBe('token-1');
  });

  it('maps author correctly', async () => {
    mockMessages = [createMockMessage()];
    const result = await getChatMessagesHandler({});
    const msg = result.messages[0]!;
    expect(msg.author.userId).toBe('user-1');
    expect(msg.author.name).toBe('Player 1');
  });

  it('maps style number to string', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-ooc', style: 1 }),
      createMockMessage({ id: 'msg-ic', style: 2 }),
      createMockMessage({ id: 'msg-emote', style: 3 }),
      createMockMessage({ id: 'msg-other', style: 0 })
    ];
    const result = await getChatMessagesHandler({});
    expect(result.messages[0]!.style).toBe('ooc');
    expect(result.messages[1]!.style).toBe('ic');
    expect(result.messages[2]!.style).toBe('emote');
    expect(result.messages[3]!.style).toBe('other');
  });

  it('detects whisper messages', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-public', whisper: [] }),
      createMockMessage({ id: 'msg-whisper', whisper: ['user-2'] })
    ];
    const result = await getChatMessagesHandler({});
    expect(result.messages[0]!.isWhisper).toBe(false);
    expect(result.messages[1]!.isWhisper).toBe(true);
    expect(result.messages[1]!.whisper).toEqual(['user-2']);
  });

  it('limits results with limit param', async () => {
    mockMessages = Array.from({ length: 30 }, (_, i) =>
      createMockMessage({ id: `msg-${i}`, timestamp: 1700000000000 + i })
    );
    const result = await getChatMessagesHandler({ limit: 5 });
    expect(result.messages).toHaveLength(5);
    expect(result.hasMore).toBe(true);
    expect(result.total).toBe(30);
  });

  it('returns most recent messages (newest last)', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-old', timestamp: 1700000000000 }),
      createMockMessage({ id: 'msg-new', timestamp: 1700000001000 })
    ];
    const result = await getChatMessagesHandler({ limit: 1 });
    expect(result.messages[0]!.id).toBe('msg-new');
  });

  it('defaults limit to 20', async () => {
    mockMessages = Array.from({ length: 25 }, (_, i) =>
      createMockMessage({ id: `msg-${i}` })
    );
    const result = await getChatMessagesHandler({});
    expect(result.messages).toHaveLength(20);
  });

  it('caps limit at 100', async () => {
    mockMessages = Array.from({ length: 150 }, (_, i) =>
      createMockMessage({ id: `msg-${i}` })
    );
    const result = await getChatMessagesHandler({ limit: 200 });
    expect(result.messages).toHaveLength(100);
  });

  it('filters by since (messages after given ID)', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-1', timestamp: 1000 }),
      createMockMessage({ id: 'msg-2', timestamp: 2000 }),
      createMockMessage({ id: 'msg-3', timestamp: 3000 })
    ];
    const result = await getChatMessagesHandler({ since: 'msg-1' });
    expect(result.messages.map(m => m.id)).toEqual(['msg-2', 'msg-3']);
  });

  it('filters by before (messages before given ID)', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-1', timestamp: 1000 }),
      createMockMessage({ id: 'msg-2', timestamp: 2000 }),
      createMockMessage({ id: 'msg-3', timestamp: 3000 })
    ];
    const result = await getChatMessagesHandler({ before: 'msg-3' });
    expect(result.messages.map(m => m.id)).toEqual(['msg-1', 'msg-2']);
  });

  it('filters by authorId', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-1', author: { id: 'user-1', name: 'Player 1' } }),
      createMockMessage({ id: 'msg-2', author: { id: 'user-2', name: 'Player 2' } })
    ];
    const result = await getChatMessagesHandler({ authorId: 'user-2' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.id).toBe('msg-2');
  });

  it('filters by actorId (speaker.actor)', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-1', speaker: { alias: 'A', actor: 'actor-1', token: undefined, scene: undefined } }),
      createMockMessage({ id: 'msg-2', speaker: { alias: 'B', actor: 'actor-2', token: undefined, scene: undefined } })
    ];
    const result = await getChatMessagesHandler({ actorId: 'actor-2' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.id).toBe('msg-2');
  });

  it('filters by type ic', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-ic', style: 2 }),
      createMockMessage({ id: 'msg-ooc', style: 1 })
    ];
    const result = await getChatMessagesHandler({ type: 'ic' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.id).toBe('msg-ic');
  });

  it('filters by type roll', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-roll', isRoll: true }),
      createMockMessage({ id: 'msg-chat', isRoll: false })
    ];
    const result = await getChatMessagesHandler({ type: 'roll' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.id).toBe('msg-roll');
  });

  it('filters by search text (case-insensitive)', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-1', content: '<p>Attack the goblin</p>' }),
      createMockMessage({ id: 'msg-2', content: '<p>Cast fireball</p>' })
    ];
    const result = await getChatMessagesHandler({ search: 'goblin' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.id).toBe('msg-1');
  });

  it('includes rolls when includeRolls is true', async () => {
    mockMessages = [createMockMessage({
      isRoll: true,
      rolls: [{ formula: '1d20+5', total: 18 }]
    })];
    const result = await getChatMessagesHandler({ includeRolls: true });
    expect(result.messages[0]!.rolls).toEqual([{ formula: '1d20+5', total: 18 }]);
  });

  it('omits rolls when includeRolls is false or not set', async () => {
    mockMessages = [createMockMessage({
      isRoll: true,
      rolls: [{ formula: '1d20+5', total: 18 }]
    })];
    const result = await getChatMessagesHandler({});
    expect(result.messages[0]!.rolls).toBeUndefined();
  });

  it('handles message with null author', async () => {
    mockMessages = [createMockMessage({ author: null })];
    const result = await getChatMessagesHandler({});
    expect(result.messages[0]!.author.userId).toBe('unknown');
    expect(result.messages[0]!.author.name).toBe('Unknown');
  });

  it('handles empty flavor as null', async () => {
    mockMessages = [createMockMessage({ flavor: '' })];
    const result = await getChatMessagesHandler({});
    expect(result.messages[0]!.flavor).toBeNull();
  });

  it('returns flavor when present', async () => {
    mockMessages = [createMockMessage({ flavor: 'Attack Roll' })];
    const result = await getChatMessagesHandler({});
    expect(result.messages[0]!.flavor).toBe('Attack Roll');
  });

  it('combines multiple filters', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-1', style: 2, author: { id: 'user-1', name: 'P1' }, content: 'attack' }),
      createMockMessage({ id: 'msg-2', style: 2, author: { id: 'user-2', name: 'P2' }, content: 'attack' }),
      createMockMessage({ id: 'msg-3', style: 1, author: { id: 'user-1', name: 'P1' }, content: 'ooc chat' })
    ];
    const result = await getChatMessagesHandler({ type: 'ic', authorId: 'user-1' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.id).toBe('msg-1');
  });
});
