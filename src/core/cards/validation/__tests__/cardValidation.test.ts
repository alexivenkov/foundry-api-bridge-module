import {
  createCardRequestSchema,
  createCardStackRequestSchema,
  dealCardsRequestSchema,
  deleteCardStackRequestSchema,
  drawCardsRequestSchema,
  flipCardRequestSchema,
  getCardStacksRequestSchema,
  passCardsRequestSchema,
  playCardRequestSchema,
  showCardRequestSchema,
  shuffleCardsRequestSchema,
  toCreateCardCommand,
  toCreateCardStackCommand,
  toDealCardsCommand,
  toDeleteCardStackCommand,
  toDrawCardsCommand,
  toFlipCardCommand,
  toPassCardsCommand,
  toPlayCardCommand,
  toRecallCardsCommand,
  toShowCardCommand,
  toShuffleCardsCommand,
  toUpdateCardCommand,
  toUpdateCardStackCommand,
  updateCardRequestSchema,
  updateCardStackRequestSchema,
  recallCardsRequestSchema
} from '..';

describe('card stack request schemas', () => {
  it('accepts a stack type filter and rejects an unknown type', () => {
    expect(getCardStacksRequestSchema.parse({})).toEqual({});
    expect(getCardStacksRequestSchema.safeParse({ type: 'tableau' }).success).toBe(false);
  });

  it('needs a name and a type or a preset to create a stack', () => {
    expect(createCardStackRequestSchema.safeParse({ name: 'Deck', type: 'deck' }).success).toBe(true);
    expect(createCardStackRequestSchema.safeParse({ name: 'Deck', preset: 'pokerDark' }).success).toBe(true);
    expect(createCardStackRequestSchema.safeParse({ name: 'Deck' }).success).toBe(false);
    expect(createCardStackRequestSchema.safeParse({ name: '  ', type: 'deck' }).success).toBe(false);
    expect(createCardStackRequestSchema.safeParse({ name: 'Deck', type: 'tableau' }).success).toBe(false);
    expect(createCardStackRequestSchema.safeParse({ name: 'Deck', type: 'deck', img: '' }).success).toBe(false);
  });

  it('reads a null or empty folder of a new stack as the root and ignores unknown keys', () => {
    const request = createCardStackRequestSchema.parse({ name: 'Hand', type: 'hand', folderId: '', color: 'red' });

    expect(request).toEqual({ name: 'Hand', type: 'hand', folderId: '' });
    expect(toCreateCardStackCommand(request)).toEqual({
      name: 'Hand',
      type: 'hand',
      preset: undefined,
      changes: { description: undefined, img: undefined, folderId: undefined }
    });
    expect(toCreateCardStackCommand(createCardStackRequestSchema.parse({ name: 'H', type: 'hand', folderId: null })).changes.folderId).toBeUndefined();
  });

  it('moves an updated stack to the root for a null or empty folder and clears a null description', () => {
    const toRoot = toUpdateCardStackCommand(updateCardStackRequestSchema.parse({ stackId: 's1', folderId: '', description: null }));

    expect(toRoot).toEqual({
      stackId: 's1',
      changes: { name: undefined, description: null, img: undefined, folderId: null }
    });
    expect(toUpdateCardStackCommand(updateCardStackRequestSchema.parse({ stackId: 's1' })).changes.folderId).toBeUndefined();
    expect(updateCardStackRequestSchema.safeParse({ stackId: '' }).success).toBe(false);
    expect(updateCardStackRequestSchema.safeParse({ stackId: 's1', type: 'hand' }).success).toBe(true);
  });

  it('reads the chat notification of a deletion', () => {
    expect(toDeleteCardStackCommand(deleteCardStackRequestSchema.parse({ stackId: 's1', chatNotification: false }))).toEqual({
      stackId: 's1',
      chatNotification: false
    });
    expect(deleteCardStackRequestSchema.safeParse({ stackId: 's1', chatNotification: 'no' }).success).toBe(false);
  });
});

describe('card request schemas', () => {
  it('maps a new card to a draft', () => {
    const request = createCardRequestSchema.parse({
      stackId: 's1',
      name: 'Magician',
      value: 1,
      faces: [{ name: 'Upright', img: 'a.webp' }, { img: null }],
      face: null,
      back: { name: 'Back' },
      sort: 5
    });

    expect(toCreateCardCommand(request)).toEqual({
      stackId: 's1',
      draft: expect.objectContaining({
        name: 'Magician',
        type: undefined,
        value: 1,
        faces: [
          { name: 'Upright', text: undefined, img: 'a.webp' },
          { name: undefined, text: undefined, img: null }
        ],
        face: null,
        back: { name: 'Back', text: undefined, img: undefined },
        sort: 5
      }) as unknown
    });
  });

  it.each([
    ['a fractional face', { face: 1.5 }],
    ['a negative face', { face: -1 }],
    ['a fractional sort', { sort: 0.5 }],
    ['a textual value', { value: 'ace' }],
    ['an infinite value', { value: Number.POSITIVE_INFINITY }],
    ['an empty image', { faces: [{ img: '' }] }],
    ['a non-object flags', { flags: 'x' }],
    ['an empty type', { type: '' }]
  ])('rejects a card with %s', (_case, attributes) => {
    expect(createCardRequestSchema.safeParse({ stackId: 's1', name: 'X', ...attributes }).success).toBe(false);
  });

  it('accepts null to clear the description, suit and value of a card', () => {
    const request = updateCardRequestSchema.parse({ stackId: 's1', cardId: 'c1', description: null, suit: null, value: null });

    expect(toUpdateCardCommand(request)).toEqual({
      stackId: 's1',
      cardId: 'c1',
      changes: expect.objectContaining({ description: null, suit: null, value: null, faces: undefined, back: undefined }) as unknown
    });
    expect(updateCardRequestSchema.safeParse({ stackId: 's1', cardId: 'c1', name: null }).success).toBe(false);
  });
});

describe('operation request schemas', () => {
  it('maps faceDown to the facing of the moved cards', () => {
    expect(toShuffleCardsCommand(shuffleCardsRequestSchema.parse({ stackId: 's1', faceDown: true })).options).toEqual({
      facing: 'down',
      chatNotification: undefined
    });
    expect(toRecallCardsCommand(recallCardsRequestSchema.parse({ stackId: 's1', faceDown: false, chatNotification: false })).options).toEqual({
      facing: 'up',
      chatNotification: false
    });
    expect(toShuffleCardsCommand(shuffleCardsRequestSchema.parse({ stackId: 's1' })).options).toEqual({
      facing: undefined,
      chatNotification: undefined
    });
  });

  it('deals one card from the top by default', () => {
    expect(toDealCardsCommand(dealCardsRequestSchema.parse({ stackId: 'd', toStackIds: ['h1', 'h2'] }))).toEqual({
      stackId: 'd',
      toStackIds: ['h1', 'h2'],
      count: 1,
      mode: 'top',
      options: { facing: undefined, chatNotification: undefined }
    });
  });

  it.each([
    ['no destination', { toStackIds: [] }],
    ['a repeated destination', { toStackIds: ['h1', 'h1'] }],
    ['a zero count', { toStackIds: ['h1'], count: 0 }],
    ['a fractional count', { toStackIds: ['h1'], count: 1.5 }],
    ['an unknown draw mode', { toStackIds: ['h1'], drawMode: 'middle' }]
  ])('rejects a deal with %s', (_case, request) => {
    expect(dealCardsRequestSchema.safeParse({ stackId: 'd', ...request }).success).toBe(false);
  });

  it('maps a draw with its source and mode', () => {
    expect(toDrawCardsCommand(drawCardsRequestSchema.parse({ stackId: 'h', fromStackId: 'd', count: 2, drawMode: 'random' }))).toEqual({
      stackId: 'h',
      fromStackId: 'd',
      count: 2,
      mode: 'random',
      options: { facing: undefined, chatNotification: undefined }
    });
    expect(drawCardsRequestSchema.safeParse({ stackId: 'h' }).success).toBe(false);
  });

  it('needs distinct card ids to pass', () => {
    expect(toPassCardsCommand(passCardsRequestSchema.parse({ stackId: 'h', toStackId: 'p', cardIds: ['a', 'b'] })).cardIds).toEqual(['a', 'b']);
    expect(passCardsRequestSchema.safeParse({ stackId: 'h', toStackId: 'p', cardIds: ['a', 'a'] }).success).toBe(false);
    expect(passCardsRequestSchema.safeParse({ stackId: 'h', toStackId: 'p', cardIds: [] }).success).toBe(false);
  });

  it('maps a play to one card and a destination', () => {
    expect(toPlayCardCommand(playCardRequestSchema.parse({ stackId: 'h', cardId: 'a', toStackId: 'p', faceDown: false }))).toEqual({
      stackId: 'h',
      cardId: 'a',
      toStackId: 'p',
      options: { facing: 'up', chatNotification: undefined }
    });
  });

  it('accepts a face index, null, next or previous to flip to', () => {
    for (const face of [0, 2, null, 'next', 'previous']) {
      expect(toFlipCardCommand(flipCardRequestSchema.parse({ stackId: 's', cardId: 'c', face })).face).toBe(face);
    }
    expect(toFlipCardCommand(flipCardRequestSchema.parse({ stackId: 's', cardId: 'c' })).face).toBeUndefined();
    for (const face of [-1, 1.5, 'up']) {
      expect(flipCardRequestSchema.safeParse({ stackId: 's', cardId: 'c', face }).success).toBe(false);
    }
  });

  it('shows a card publicly unless recipients are given', () => {
    expect(toShowCardCommand(showCardRequestSchema.parse({ stackId: 's', cardId: 'c' })).whisperTo).toEqual([]);
    expect(toShowCardCommand(showCardRequestSchema.parse({ stackId: 's', cardId: 'c', whisperTo: ['u1'] })).whisperTo).toEqual(['u1']);
    expect(showCardRequestSchema.safeParse({ stackId: 's', cardId: 'c', whisperTo: [''] }).success).toBe(false);
  });
});
