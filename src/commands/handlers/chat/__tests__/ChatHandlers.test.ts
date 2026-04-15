import { deleteChatMessageHandler } from '../DeleteChatMessageHandler';
import { updateChatMessageHandler } from '../UpdateChatMessageHandler';
import { clearChatHandler } from '../ClearChatHandler';
import { exportChatHandler } from '../ExportChatHandler';

interface MockMessage {
  id: string;
  content: string;
  flavor: string;
  timestamp: number;
  style: number;
  whisper: string[];
  blind: boolean;
  speaker: { alias: string | undefined; actor: string | undefined; token: string | undefined; scene: string | undefined };
  rolls: Array<{ formula: string; total: number }>;
  isRoll: boolean;
  author: { id: string; name: string } | null;
  update: jest.Mock;
  delete: jest.Mock;
  export: jest.Mock;
}

function createMockMessage(overrides: Partial<MockMessage> = {}): MockMessage {
  const msg: MockMessage = {
    id: 'msg-1',
    content: '<p>Hello</p>',
    flavor: '',
    timestamp: 1700000000000,
    style: 2,
    whisper: [],
    blind: false,
    speaker: { alias: 'GM', actor: undefined, token: undefined, scene: undefined },
    rolls: [],
    isRoll: false,
    author: { id: 'user-1', name: 'GM' },
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    export: jest.fn().mockReturnValue('[GM] Hello'),
    ...overrides
  };
  // update returns the message itself with updated fields
  msg.update.mockImplementation(async (data: Record<string, unknown>) => {
    if (data['content'] !== undefined) msg.content = data['content'] as string;
    if (data['flavor'] !== undefined) msg.flavor = data['flavor'] as string;
    return msg;
  });
  return msg;
}

let mockMessages: MockMessage[] = [];
const mockDeleteDocuments = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  mockMessages = [];
  mockDeleteDocuments.mockClear();

  (global as Record<string, unknown>)['game'] = {
    messages: {
      get contents() { return mockMessages; },
      get size() { return mockMessages.length; },
      get: jest.fn((id: string) => mockMessages.find(m => m.id === id))
    }
  };
  (global as Record<string, unknown>)['ChatMessage'] = {
    deleteDocuments: mockDeleteDocuments
  };
  jest.spyOn(console, 'warn').mockImplementation();
});

afterEach(() => jest.restoreAllMocks());

// ==================== DeleteChatMessageHandler ====================

describe('deleteChatMessageHandler', () => {
  it('deletes a message by ID', async () => {
    const msg = createMockMessage({ id: 'msg-1' });
    mockMessages = [msg];
    const result = await deleteChatMessageHandler({ messageId: 'msg-1' });
    expect(msg.delete).toHaveBeenCalled();
    expect(result.deleted).toBe(true);
  });

  it('throws when message not found', async () => {
    mockMessages = [];
    await expect(deleteChatMessageHandler({ messageId: 'nonexistent' }))
      .rejects.toThrow('Chat message not found: nonexistent');
  });
});

// ==================== UpdateChatMessageHandler ====================

describe('updateChatMessageHandler', () => {
  it('updates message content', async () => {
    const msg = createMockMessage({ id: 'msg-1' });
    mockMessages = [msg];
    const result = await updateChatMessageHandler({ messageId: 'msg-1', content: 'New content' });
    expect(msg.update).toHaveBeenCalledWith(expect.objectContaining({ content: 'New content' }));
    expect(result.messageId).toBe('msg-1');
    expect(result.sent).toBe(true);
  });

  it('updates message flavor', async () => {
    const msg = createMockMessage({ id: 'msg-1' });
    mockMessages = [msg];
    await updateChatMessageHandler({ messageId: 'msg-1', flavor: 'New flavor' });
    expect(msg.update).toHaveBeenCalledWith(expect.objectContaining({ flavor: 'New flavor' }));
  });

  it('updates both content and flavor', async () => {
    const msg = createMockMessage({ id: 'msg-1' });
    mockMessages = [msg];
    await updateChatMessageHandler({ messageId: 'msg-1', content: 'C', flavor: 'F' });
    expect(msg.update).toHaveBeenCalledWith({ content: 'C', flavor: 'F' });
  });

  it('throws when message not found', async () => {
    mockMessages = [];
    await expect(updateChatMessageHandler({ messageId: 'x', content: 'test' }))
      .rejects.toThrow('Chat message not found: x');
  });

  it('throws when no updates provided', async () => {
    const msg = createMockMessage({ id: 'msg-1' });
    mockMessages = [msg];
    await expect(updateChatMessageHandler({ messageId: 'msg-1' }))
      .rejects.toThrow('No updates provided');
  });
});

// ==================== ClearChatHandler ====================

describe('clearChatHandler', () => {
  it('deletes all messages', async () => {
    mockMessages = [
      createMockMessage({ id: 'msg-1' }),
      createMockMessage({ id: 'msg-2' }),
      createMockMessage({ id: 'msg-3' })
    ];
    const result = await clearChatHandler();
    expect(mockDeleteDocuments).toHaveBeenCalledWith(['msg-1', 'msg-2', 'msg-3']);
    expect(result.deletedCount).toBe(3);
  });

  it('returns 0 when no messages', async () => {
    mockMessages = [];
    const result = await clearChatHandler();
    expect(result.deletedCount).toBe(0);
    expect(mockDeleteDocuments).not.toHaveBeenCalled();
  });
});

// ==================== ExportChatHandler ====================

describe('exportChatHandler', () => {
  it('exports chat as text (default)', async () => {
    const msg1 = createMockMessage({ id: 'msg-1' });
    msg1.export.mockReturnValue('[Player 1] Hello');
    const msg2 = createMockMessage({ id: 'msg-2' });
    msg2.export.mockReturnValue('[Player 1] World');
    mockMessages = [msg1, msg2];

    const result = await exportChatHandler({});
    expect(result.messageCount).toBe(2);
    expect(result.content).toBe('[Player 1] Hello\n[Player 1] World');
  });

  it('exports chat as text explicitly', async () => {
    const msg = createMockMessage({ id: 'msg-1' });
    msg.export.mockReturnValue('[GM] Test');
    mockMessages = [msg];

    const result = await exportChatHandler({ format: 'text' });
    expect(result.content).toBe('[GM] Test');
  });

  it('exports chat as JSON with HTML stripped', async () => {
    mockMessages = [createMockMessage({
      id: 'msg-1',
      content: '<p>Hello <strong>world</strong></p>',
      timestamp: 1700000000000,
      author: { id: 'user-1', name: 'P1' }
    })];

    const result = await exportChatHandler({ format: 'json' });
    const parsed = JSON.parse(result.content) as Array<Record<string, unknown>>;
    expect(parsed).toHaveLength(1);
    expect(parsed[0]!['id']).toBe('msg-1');
    expect(parsed[0]!['content']).toBe('Hello world');
  });

  it('returns empty for no messages', async () => {
    mockMessages = [];
    const result = await exportChatHandler({});
    expect(result.messageCount).toBe(0);
    expect(result.content).toBe('');
  });
});
