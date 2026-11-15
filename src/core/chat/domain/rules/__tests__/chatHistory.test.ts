import { ChatHistoryLimit, selectChatHistory, type ChatMessage } from '../..';

function message(id: string, overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id,
    timestamp: 1700000000000,
    author: { id: 'gm', name: 'Gamemaster' },
    speaker: { alias: 'Gamemaster', actorId: null, tokenId: null },
    content: '<p>Hello</p>',
    flavor: null,
    style: 'ic',
    isRoll: false,
    whisper: [],
    ...overrides
  };
}

function ids(messages: readonly ChatMessage[]): string[] {
  return messages.map((entry) => entry.id);
}

function numbered(count: number): ChatMessage[] {
  return Array.from({ length: count }, (_, index) => message(`m${String(index + 1)}`));
}

describe('selectChatHistory', () => {
  const log = numbered(4);

  it('returns a short log whole, oldest first', () => {
    expect(selectChatHistory(log, {})).toEqual({ messages: log, hasMore: false });
  });

  it('keeps the most recent messages and says that older ones were cut off', () => {
    const selection = selectChatHistory(log, { limit: 2 });

    expect(ids(selection.messages)).toEqual(['m3', 'm4']);
    expect(selection.hasMore).toBe(true);
  });

  it('does not report more when the limit is met exactly', () => {
    expect(selectChatHistory(log, { limit: 4 }).hasMore).toBe(false);
  });

  it('takes 20 messages when no limit is given', () => {
    const selection = selectChatHistory(numbered(25), {});

    expect(selection.messages).toHaveLength(20);
    expect(selection.messages[0]?.id).toBe('m6');
    expect(selection.hasMore).toBe(true);
  });

  it('never takes more than 100 messages', () => {
    expect(selectChatHistory(numbered(130), { limit: 500 }).messages).toHaveLength(100);
  });

  it('takes at least one message', () => {
    expect(ids(selectChatHistory(log, { limit: 0 }).messages)).toEqual(['m4']);
    expect(ids(selectChatHistory(log, { limit: -7 }).messages)).toEqual(['m4']);
  });

  it('cuts a fractional limit down to whole messages', () => {
    const selection = selectChatHistory(log, { limit: 2.5 });

    expect(ids(selection.messages)).toEqual(['m3', 'm4']);
    expect(selection.hasMore).toBe(true);
  });

  it('starts after the message named by since', () => {
    expect(ids(selectChatHistory(log, { since: 'm2' }).messages)).toEqual(['m3', 'm4']);
  });

  it('stops before the message named by before', () => {
    expect(ids(selectChatHistory(log, { before: 'm3' }).messages)).toEqual(['m1', 'm2']);
  });

  it('takes the window between since and before', () => {
    expect(ids(selectChatHistory(log, { since: 'm1', before: 'm4' }).messages)).toEqual(['m2', 'm3']);
  });

  it('ignores a since or before id that is not in the log', () => {
    expect(selectChatHistory(log, { since: 'gone', before: 'gone-too' }).messages).toEqual(log);
  });

  it('ignores before when since has already cut that message off', () => {
    expect(ids(selectChatHistory(log, { since: 'm3', before: 'm2' }).messages)).toEqual(['m4']);
  });

  it('filters by author and skips messages whose author is gone', () => {
    const mixed = [
      message('gm-1'),
      message('player-1', { author: { id: 'p1', name: 'Player' } }),
      message('orphan', { author: null })
    ];

    expect(ids(selectChatHistory(mixed, { authorId: 'p1' }).messages)).toEqual(['player-1']);
  });

  it('filters by the actor a message speaks for', () => {
    const mixed = [
      message('narration'),
      message('goblin', { speaker: { alias: 'Goblin', actorId: 'a1', tokenId: 't1' } })
    ];

    expect(ids(selectChatHistory(mixed, { actorId: 'a1' }).messages)).toEqual(['goblin']);
  });

  it.each(['ic', 'ooc', 'emote'] as const)('filters by the %s style', (style) => {
    const mixed = [
      message('ic', { style: 'ic' }),
      message('ooc', { style: 'ooc' }),
      message('emote', { style: 'emote' }),
      message('other', { style: 'other' })
    ];

    expect(ids(selectChatHistory(mixed, { kind: style }).messages)).toEqual([style]);
  });

  it('selects messages that carry a roll, whatever their style', () => {
    const mixed = [
      message('attack', { isRoll: true, style: 'other' }),
      message('speech'),
      message('check', { isRoll: true, style: 'ic' })
    ];

    expect(ids(selectChatHistory(mixed, { kind: 'roll' }).messages)).toEqual(['attack', 'check']);
  });

  it('searches the text without its markup, ignoring case', () => {
    const mixed = [
      message('hit', { content: '<p>Attack the <strong>Gob</strong>lin</p>' }),
      message('spell', { content: '<p>Cast fireball</p>' })
    ];

    expect(ids(selectChatHistory(mixed, { search: 'GOBLIN' }).messages)).toEqual(['hit']);
    expect(selectChatHistory(mixed, { search: 'strong' }).messages).toEqual([]);
  });

  it('applies the limit to what the filters left', () => {
    const mixed = [
      message('a', { style: 'ooc' }),
      message('b'),
      message('c', { style: 'ooc' }),
      message('d'),
      message('e', { style: 'ooc' })
    ];

    const selection = selectChatHistory(mixed, { kind: 'ooc', limit: 2 });

    expect(ids(selection.messages)).toEqual(['c', 'e']);
    expect(selection.hasMore).toBe(true);
  });

  it('leaves the log it was given untouched', () => {
    const original = numbered(3);

    selectChatHistory(original, { since: 'm1', limit: 1 });

    expect(ids(original)).toEqual(['m1', 'm2', 'm3']);
  });
});

describe('ChatHistoryLimit', () => {
  it.each([
    [undefined, 20],
    [1, 1],
    [57, 57],
    [100, 100],
    [101, 100],
    [0, 1],
    [-5, 1]
  ])('resolves %p to %i', (requested, expected) => {
    expect(ChatHistoryLimit.resolve(requested)).toBe(expected);
  });
});
