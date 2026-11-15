import {
  CardAlreadyDrawnError,
  CardAlreadyInStackError,
  CardCannotEnterDeckError,
  CardFaceOutOfRangeError,
  NoNextCardFaceError,
  NoPreviousCardFaceError,
  NotEnoughCardsError,
  SameCardStackError,
  describeStack,
  isDeck,
  isFaceUp,
  orderFromTop,
  requireAvailable,
  requireCanEnter,
  requireConsistentFace,
  requireNotOut,
  requireOtherStack,
  resolveFlipTarget,
  withNewCardDefaults,
  type Card,
  type CardStack
} from '..';

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    name: 'Ace',
    description: '',
    type: 'base',
    suit: 'spades',
    value: 1,
    faces: [{ name: 'Ace', text: '', img: 'ace.webp' }],
    face: 0,
    faceUp: true,
    back: { name: null, text: '', img: null },
    img: 'ace.webp',
    drawn: false,
    originId: null,
    sort: 0,
    system: {},
    flags: {},
    ...overrides
  };
}

function stack(overrides: Partial<CardStack> = {}): CardStack {
  return {
    id: 'deck',
    uuid: 'Cards.deck',
    name: 'Deck',
    type: 'deck',
    img: null,
    folderId: null,
    folderName: null,
    ownerIds: [],
    cardCount: 0,
    availableCount: 0,
    drawnCount: 0,
    description: '',
    cards: [],
    ...overrides
  };
}

const twoFaces = [
  { name: 'Front', text: '', img: null },
  { name: 'Reverse', text: '', img: null }
];

describe('card stacks', () => {
  it('knows a deck by its type and labels a stack by name and id', () => {
    expect(isDeck(stack())).toBe(true);
    expect(isDeck(stack({ type: 'hand' }))).toBe(false);
    expect(describeStack(stack())).toBe('Deck (deck)');
  });

  it('orders cards from the top by ascending sort and keeps the order of equal sorts', () => {
    const cards = [card({ id: 'c', sort: 5 }), card({ id: 'a', sort: 0 }), card({ id: 'b', sort: 0 })];

    expect(orderFromTop(cards).map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('faces', () => {
  it('shows a face only while the face index names one of the faces', () => {
    expect(isFaceUp(0, 1)).toBe(true);
    expect(isFaceUp(null, 1)).toBe(false);
    expect(isFaceUp(1, 1)).toBe(false);
  });

  it('gives a new card one default face and shows it, as the card sheet does', () => {
    expect(withNewCardDefaults({ name: 'Fool' })).toEqual({ name: 'Fool', faces: [{}], face: 0 });
  });

  it('keeps a new card face down when it has no face', () => {
    expect(withNewCardDefaults({ name: 'Blank', faces: [] })).toEqual({ name: 'Blank', faces: [], face: null });
  });

  it('keeps the face a new card asks for, also face down', () => {
    expect(withNewCardDefaults({ name: 'Magician', faces: [{}, {}], face: 1 }).face).toBe(1);
    expect(withNewCardDefaults({ name: 'Magician', face: null }).face).toBeNull();
  });

  it('refuses a new card whose face is out of range', () => {
    expect(() => withNewCardDefaults({ name: 'X', faces: [{}], face: 2 })).toThrow(
      'Face 2 is out of range: card "X" has 1 face(s), 0 to 0'
    );
    expect(() => withNewCardDefaults({ name: 'X', faces: [], face: 0 })).toThrow(
      'Card "X" has no faces; it can only lie face down'
    );
  });

  it('checks the face an update leaves when it sets the face or replaces the faces', () => {
    const current = card({ faces: twoFaces, face: 1 });

    expect(() => requireConsistentFace(current, { name: 'Renamed' })).not.toThrow();
    expect(() => requireConsistentFace(current, { faces: [{}] })).toThrow(CardFaceOutOfRangeError);
    expect(() => requireConsistentFace(current, { faces: [{}], face: 0 })).not.toThrow();
    expect(() => requireConsistentFace(current, { face: 2 })).toThrow(CardFaceOutOfRangeError);
    expect(() => requireConsistentFace(current, { faces: [], face: null })).not.toThrow();
  });
});

describe('resolveFlipTarget', () => {
  it('leaves the choice to the core when no face is asked for', () => {
    expect(resolveFlipTarget(card(), undefined)).toBeUndefined();
  });

  it('lays the card face down for null', () => {
    expect(resolveFlipTarget(card(), null)).toBeNull();
  });

  it('flips to a face in range and refuses one out of range', () => {
    expect(resolveFlipTarget(card({ faces: twoFaces }), 1)).toBe(1);
    expect(() => resolveFlipTarget(card(), 3)).toThrow(CardFaceOutOfRangeError);
  });

  it('steps to the next face, from face down to the first one', () => {
    expect(resolveFlipTarget(card({ faces: twoFaces, face: null }), 'next')).toBe(0);
    expect(resolveFlipTarget(card({ faces: twoFaces, face: 0 }), 'next')).toBe(1);
    expect(() => resolveFlipTarget(card({ faces: twoFaces, face: 1 }), 'next')).toThrow(NoNextCardFaceError);
    expect(() => resolveFlipTarget(card({ faces: [], face: null }), 'next')).toThrow(CardFaceOutOfRangeError);
  });

  it('steps to the previous face, from the first one to face down', () => {
    expect(resolveFlipTarget(card({ faces: twoFaces, face: 1 }), 'previous')).toBe(0);
    expect(resolveFlipTarget(card({ faces: twoFaces, face: 0 }), 'previous')).toBeNull();
    expect(resolveFlipTarget(card({ faces: twoFaces, face: 7 }), 'previous')).toBe(1);
    expect(() => resolveFlipTarget(card({ face: null }), 'previous')).toThrow(NoPreviousCardFaceError);
  });
});

describe('moving cards', () => {
  it('needs enough available cards', () => {
    expect(() => requireAvailable(stack({ availableCount: 3 }), 3)).not.toThrow();
    expect(() => requireAvailable(stack({ availableCount: 3 }), 4)).toThrow(
      new NotEnoughCardsError(stack(), 4, 3)
    );
    expect(new NotEnoughCardsError(stack(), 4, 3).message).toBe('Not enough cards in Deck (deck): 4 requested, 3 available');
  });

  it('refuses to move cards from a stack to itself', () => {
    expect(() => requireOtherStack(stack(), stack())).toThrow(SameCardStackError);
    expect(() => requireOtherStack(stack(), stack({ id: 'hand' }))).not.toThrow();
  });

  it("refuses a deck's card that is already out, as the core does", () => {
    expect(() => requireNotOut(card({ drawn: true }), stack())).toThrow(CardAlreadyDrawnError);
    expect(() => requireNotOut(card({ drawn: true }), stack({ type: 'hand' }))).not.toThrow();
  });

  it('lets a card go back into the deck it came from', () => {
    const deck = stack({ cards: [card({ drawn: true })] });

    expect(() => requireCanEnter(card({ originId: 'deck', drawn: true }), stack({ id: 'hand', type: 'hand' }), deck)).not.toThrow();
  });

  it("lets a deck copy its own card into another deck", () => {
    expect(() => requireCanEnter(card(), stack(), stack({ id: 'tarot' }))).not.toThrow();
  });

  it('refuses any other card going into a deck', () => {
    const hand = stack({ id: 'hand', type: 'hand' });

    expect(() => requireCanEnter(card({ originId: 'deck' }), hand, stack({ id: 'tarot', name: 'Tarot' }))).toThrow(
      'Card c1 cannot go into deck Tarot (tarot): a deck only takes back its own cards'
    );
    expect(() => requireCanEnter(card({ originId: null }), hand, stack({ id: 'tarot' }))).toThrow(
      CardCannotEnterDeckError
    );
  });

  it('refuses a card the destination already contains', () => {
    const pile = stack({ id: 'pile', type: 'pile', name: 'Pile', cards: [card()] });

    expect(() => requireCanEnter(card(), stack({ id: 'hand', type: 'hand' }), pile)).toThrow(
      new CardAlreadyInStackError('c1', pile)
    );
  });
});
