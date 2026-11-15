import {
  deleteChatMessageRequestSchema,
  exportChatRequestSchema,
  getChatMessagesRequestSchema,
  rollDiceRequestSchema,
  sendChatMessageRequestSchema,
  toDeleteChatMessageCommand,
  toExportChatQuery,
  toListChatMessagesQuery,
  toRollDiceCommand,
  toSendChatMessageCommand,
  toUpdateChatMessageCommand,
  updateChatMessageRequestSchema
} from '..';

describe('chat request schemas', () => {
  describe('roll-dice', () => {
    it('needs a formula that is a string', () => {
      expect(rollDiceRequestSchema.safeParse({ formula: '1d20' }).success).toBe(true);
      expect(rollDiceRequestSchema.safeParse({}).success).toBe(false);
      expect(rollDiceRequestSchema.safeParse({ formula: 20 }).success).toBe(false);
    });

    it('accepts an empty formula, which the domain turns down in its own words', () => {
      expect(rollDiceRequestSchema.safeParse({ formula: '   ' }).success).toBe(true);
    });

    it('takes any value for showInChat and a null flavor', () => {
      expect(rollDiceRequestSchema.parse({ formula: '1d20', showInChat: 1, flavor: null })).toEqual({
        formula: '1d20',
        showInChat: 1,
        flavor: null
      });
    });
  });

  describe('send-chat-message', () => {
    it('needs content that is a string', () => {
      expect(sendChatMessageRequestSchema.safeParse({ content: 'Hello' }).success).toBe(true);
      expect(sendChatMessageRequestSchema.safeParse({}).success).toBe(false);
      expect(sendChatMessageRequestSchema.safeParse({ content: null }).success).toBe(false);
    });

    it('accepts null and empty values where the old handler tested for truthiness', () => {
      const request = { content: 'Hello', speaker: null, actorId: '', flavor: null, whisperTo: null, type: null };

      expect(sendChatMessageRequestSchema.safeParse(request).success).toBe(true);
    });

    it('ignores a type outside ic / ooc / emote instead of rejecting the request', () => {
      expect(sendChatMessageRequestSchema.parse({ content: 'Hello', type: 'whisper' })).toEqual({ content: 'Hello' });
      expect(sendChatMessageRequestSchema.parse({ content: 'Hello', type: 7 })).toEqual({ content: 'Hello' });
    });

    it('rejects whisper recipients that are not a list of ids', () => {
      expect(sendChatMessageRequestSchema.safeParse({ content: 'Hello', whisperTo: 'u1' }).success).toBe(false);
    });
  });

  describe('get-chat-messages', () => {
    it('accepts a request without any filter', () => {
      expect(getChatMessagesRequestSchema.parse({})).toEqual({});
    });

    it.each([
      [5, 5],
      ['5', 5],
      [true, 1],
      [null, null],
      ['many', undefined],
      [{}, undefined]
    ])('reads the limit %p as %p', (given, expected) => {
      expect(getChatMessagesRequestSchema.parse({ limit: given }).limit).toBe(expected);
    });

    it('ignores a since or before id that is not a string', () => {
      expect(getChatMessagesRequestSchema.parse({ since: 12, before: {} })).toEqual({});
    });

    it('ignores a type it does not filter by', () => {
      expect(getChatMessagesRequestSchema.parse({ type: 'other' })).toEqual({});
      expect(getChatMessagesRequestSchema.parse({ type: 'roll' })).toEqual({ type: 'roll' });
    });

    it('rejects an author, actor or search text that is not a string', () => {
      expect(getChatMessagesRequestSchema.safeParse({ authorId: 5 }).success).toBe(false);
      expect(getChatMessagesRequestSchema.safeParse({ actorId: [] }).success).toBe(false);
      expect(getChatMessagesRequestSchema.safeParse({ search: 5 }).success).toBe(false);
    });
  });

  it('requires the message id for update and delete', () => {
    expect(updateChatMessageRequestSchema.safeParse({ content: 'x' }).success).toBe(false);
    expect(deleteChatMessageRequestSchema.safeParse({}).success).toBe(false);
    expect(deleteChatMessageRequestSchema.safeParse({ messageId: 'm1' }).success).toBe(true);
  });

  it('accepts an update that changes nothing, which the service turns down in its own words', () => {
    expect(updateChatMessageRequestSchema.safeParse({ messageId: 'm1' }).success).toBe(true);
    expect(updateChatMessageRequestSchema.safeParse({ messageId: 'm1', content: null }).success).toBe(true);
  });

  it('ignores an export format it does not know', () => {
    expect(exportChatRequestSchema.parse({ format: 'csv' })).toEqual({});
    expect(exportChatRequestSchema.parse({ format: 'json' })).toEqual({ format: 'json' });
  });

  it('ignores unknown keys', () => {
    expect(deleteChatMessageRequestSchema.parse({ messageId: 'm1', force: true })).toEqual({ messageId: 'm1' });
  });
});

describe('chat request mappers', () => {
  it.each([
    [true, true],
    [1, true],
    ['yes', true],
    [false, false],
    [0, false],
    ['', false],
    [undefined, false]
  ])('reads showInChat %p as %s', (showInChat, expected) => {
    expect(toRollDiceCommand({ formula: '1d20', showInChat }).showInChat).toBe(expected);
  });

  it('hands the roll formula and flavor over untouched', () => {
    expect(toRollDiceCommand({ formula: ' 1d20 ', flavor: null })).toEqual({
      formula: ' 1d20 ',
      showInChat: false,
      flavor: null
    });
  });

  it('maps a full send request to the domain vocabulary', () => {
    const command = toSendChatMessageCommand({
      content: 'Hello',
      speaker: 'Bartender',
      actorId: 'a1',
      flavor: 'Narration',
      whisperTo: ['u1'],
      type: 'ooc'
    });

    expect(command).toEqual({
      content: 'Hello',
      speakerName: 'Bartender',
      actorId: 'a1',
      flavor: 'Narration',
      whisperTo: ['u1'],
      style: 'ooc'
    });
  });

  it('reads empty and null send fields as not given', () => {
    expect(toSendChatMessageCommand({ content: 'Hello', actorId: '', flavor: '', whisperTo: null, type: null })).toEqual({
      content: 'Hello',
      speakerName: undefined,
      actorId: undefined,
      flavor: undefined,
      whisperTo: [],
      style: undefined
    });
  });

  it('keeps an empty speaker name and drops a null one', () => {
    expect(toSendChatMessageCommand({ content: 'Hello', speaker: '' }).speakerName).toBe('');
    expect(toSendChatMessageCommand({ content: 'Hello', speaker: null }).speakerName).toBeUndefined();
  });

  it('maps the history filters, reading empty and null ones as not given', () => {
    const query = toListChatMessagesQuery({
      limit: 5,
      since: 'm1',
      before: '',
      authorId: null,
      actorId: 'a1',
      type: 'roll',
      search: ''
    });

    expect(query).toEqual({
      filter: {
        limit: 5,
        since: 'm1',
        before: undefined,
        authorId: undefined,
        actorId: 'a1',
        kind: 'roll',
        search: undefined
      },
      includeRolls: false
    });
  });

  it('reads a null limit as no limit given', () => {
    expect(toListChatMessagesQuery({ limit: null }).filter.limit).toBeUndefined();
  });

  it.each([
    [true, true],
    [1, false],
    ['true', false],
    [undefined, false]
  ])('includes rolls only for a strict true (%p → %s)', (includeRolls, expected) => {
    expect(toListChatMessagesQuery({ includeRolls }).includeRolls).toBe(expected);
  });

  it('keeps an update partial', () => {
    expect(toUpdateChatMessageCommand({ messageId: 'm1', flavor: 'New' })).toEqual({
      messageId: 'm1',
      changes: { content: undefined, flavor: 'New' }
    });
  });

  it('maps a delete request', () => {
    expect(toDeleteChatMessageCommand({ messageId: 'm1' })).toEqual({ messageId: 'm1' });
  });

  it.each([
    [undefined, 'text'],
    [null, 'text'],
    ['text', 'text'],
    ['json', 'json']
  ] as const)('exports format %p as %s', (format, expected) => {
    expect(toExportChatQuery({ format })).toEqual({ format: expected });
  });
});
