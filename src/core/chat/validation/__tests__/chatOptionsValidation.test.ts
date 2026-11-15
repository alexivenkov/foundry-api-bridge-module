import {
  rollDiceRequestSchema,
  sendChatMessageRequestSchema,
  simulateRollRequestSchema,
  toRollDiceCommand,
  toSendChatMessageCommand,
  toSimulateRollQuery,
  toValidateRollFormulaQuery,
  validateRollFormulaRequestSchema
} from '..';

describe('roll-dice options', () => {
  it('accepts the visibility, roller, alias and roll data', () => {
    const request = {
      formula: '1d20 + @prof',
      visibility: 'blind',
      actorId: 'a1',
      tokenId: 't1',
      sceneId: 's1',
      alias: 'Grik',
      data: { bonus: 2, nested: { a: 1 } }
    };

    expect(rollDiceRequestSchema.parse(request)).toEqual(request);
  });

  it.each([
    [{ visibility: 'private' }],
    [{ visibility: 'gmroll' }],
    [{ actorId: 5 }],
    [{ alias: '' }],
    [{ data: 'bonus=2' }],
    [{ data: [1, 2] }]
  ])('rejects %p', (extra) => {
    expect(rollDiceRequestSchema.safeParse({ formula: '1d20', ...extra }).success).toBe(false);
  });

  it('reads a null or empty addressing id as not given', () => {
    expect(toRollDiceCommand(rollDiceRequestSchema.parse({ formula: '1d20', actorId: null, tokenId: '', sceneId: '' })).roller).toBeUndefined();
  });

  it('lets a token id win over an actor id', () => {
    expect(toRollDiceCommand(rollDiceRequestSchema.parse({ formula: '1d20', actorId: 'a1', tokenId: 't1', sceneId: '' })).roller).toEqual({
      kind: 'token',
      tokenId: 't1',
      sceneId: undefined
    });
    expect(toRollDiceCommand({ formula: '1d20', actorId: 'a1', sceneId: 's1' }).roller).toEqual({ kind: 'actor', actorId: 'a1' });
  });

  it('maps the options to the domain vocabulary', () => {
    expect(toRollDiceCommand({ formula: '1d20', showInChat: true, visibility: 'gm', alias: 'Grik', data: { x: 1 } })).toEqual({
      formula: '1d20',
      showInChat: true,
      flavor: undefined,
      visibility: 'gm',
      roller: undefined,
      alias: 'Grik',
      data: { x: 1 }
    });
  });
});

describe('send-chat-message options', () => {
  it('accepts the visibility, recipients, token speaker and alias', () => {
    const request = { content: 'Hi', visibility: 'gm', recipients: ['Alice', 'u1'], tokenId: 't1', sceneId: 's1', alias: 'Grik' };

    expect(sendChatMessageRequestSchema.parse(request)).toEqual(request);
  });

  it.each([
    [{ visibility: 'whisper' }],
    [{ recipients: 'Alice' }],
    [{ recipients: [''] }],
    [{ recipients: ['   '] }],
    [{ tokenId: 7 }],
    [{ alias: '' }]
  ])('rejects %p', (extra) => {
    expect(sendChatMessageRequestSchema.safeParse({ content: 'Hi', ...extra }).success).toBe(false);
  });

  it('trims the recipient names', () => {
    expect(sendChatMessageRequestSchema.parse({ content: 'Hi', recipients: [' Alice '] }).recipients).toEqual(['Alice']);
  });

  it('maps the token speaker, reading an empty scene id as the active scene', () => {
    expect(toSendChatMessageCommand({ content: 'Hi', tokenId: 't1', sceneId: '' })).toMatchObject({
      speakerToken: { tokenId: 't1', sceneId: undefined }
    });
    expect(toSendChatMessageCommand({ content: 'Hi', tokenId: null, sceneId: 's1' }).speakerToken).toBeUndefined();
  });

  it('maps the visibility, recipients and alias', () => {
    expect(toSendChatMessageCommand({ content: 'Hi', visibility: 'blind', recipients: ['Alice'], alias: 'Grik' })).toMatchObject({
      visibility: 'blind',
      recipients: ['Alice'],
      alias: 'Grik'
    });
  });
});

describe('validate-roll-formula', () => {
  it('needs a formula that is a string', () => {
    expect(validateRollFormulaRequestSchema.safeParse({}).success).toBe(false);
    expect(validateRollFormulaRequestSchema.safeParse({ formula: 20 }).success).toBe(false);
  });

  it('maps the roller and the roll data', () => {
    expect(toValidateRollFormulaQuery(validateRollFormulaRequestSchema.parse({ formula: '1d20', tokenId: 't1', data: { x: 1 }, extra: true }))).toEqual({
      formula: '1d20',
      roller: { kind: 'token', tokenId: 't1', sceneId: undefined },
      data: { x: 1 }
    });
  });
});

describe('simulate-roll', () => {
  it.each([1, 1000])('accepts %i iterations', (iterations) => {
    expect(simulateRollRequestSchema.safeParse({ formula: '1d6', iterations }).success).toBe(true);
  });

  it.each([0, 1001, 2.5, '10'])('rejects %p iterations', (iterations) => {
    expect(simulateRollRequestSchema.safeParse({ formula: '1d6', iterations }).success).toBe(false);
  });

  it('rolls 100 times by default', () => {
    expect(toSimulateRollQuery({ formula: '1d6' })).toEqual({ formula: '1d6', iterations: 100, roller: undefined, data: undefined });
  });

  it('maps the actor and the roll data', () => {
    expect(toSimulateRollQuery({ formula: '1d6', iterations: 5, actorId: 'a1', data: { x: 1 } })).toEqual({
      formula: '1d6',
      iterations: 5,
      roller: { kind: 'actor', actorId: 'a1' },
      data: { x: 1 }
    });
  });
});
