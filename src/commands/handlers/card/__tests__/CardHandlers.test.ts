import type { CardGlobalsProvider, FoundryCardGlobals } from '../../../../core/cards';
import type { FoundryCardDocument, FoundryCardsDocument } from '../../../../core/cards/infrastructure';
import { createCreateCardHandler } from '../CreateCardHandler';
import { createCreateCardStackHandler } from '../CreateCardStackHandler';
import { createDealCardsHandler } from '../DealCardsHandler';
import { createDeleteCardHandler } from '../DeleteCardHandler';
import { createDeleteCardStackHandler } from '../DeleteCardStackHandler';
import { createDiscardCardHandler } from '../DiscardCardHandler';
import { createDrawCardsHandler } from '../DrawCardsHandler';
import { createFlipCardHandler } from '../FlipCardHandler';
import { createGetCardStackHandler } from '../GetCardStackHandler';
import { createGetCardStacksHandler } from '../GetCardStacksHandler';
import { createPassCardsHandler } from '../PassCardsHandler';
import { createPlayCardHandler } from '../PlayCardHandler';
import { createRecallCardsHandler } from '../RecallCardsHandler';
import { createShowCardHandler } from '../ShowCardHandler';
import { createShuffleCardsHandler } from '../ShuffleCardsHandler';
import { createUpdateCardHandler } from '../UpdateCardHandler';
import { createUpdateCardStackHandler } from '../UpdateCardStackHandler';

function cardDoc(id: string, sort: number, extra: Partial<FoundryCardDocument> = {}): FoundryCardDocument {
  return {
    id,
    _source: {
      name: `Card ${id}`,
      type: 'base',
      suit: 'clubs',
      value: sort + 1,
      faces: [{ name: `Card ${id}`, text: '', img: `cards/${id}.webp` }],
      face: 0,
      back: { text: '', img: null },
      drawn: false,
      sort,
      system: {},
      flags: {}
    },
    img: `cards/${id}.webp`,
    origin: null,
    update: jest.fn().mockResolvedValue(undefined),
    flip: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    discard: jest.fn().mockResolvedValue(undefined),
    toMessage: jest.fn().mockResolvedValue({ id: 'msg1' }),
    ...extra
  };
}

function stackDoc(id: string, type: string, cards: FoundryCardDocument[] = []): FoundryCardsDocument {
  return {
    id,
    uuid: `Cards.${id}`,
    name: id.toUpperCase(),
    type,
    img: 'icons/svg/card-hand.svg',
    description: '',
    folder: null,
    ownership: { default: 0 },
    cards: { contents: cards, get: (cardId) => cards.find((card) => card.id === cardId) },
    get availableCards() {
      return cards.filter((card) => type !== 'deck' || !card._source.drawn);
    },
    get drawnCards() {
      return cards.filter((card) => card._source.drawn);
    },
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    createEmbeddedDocuments: jest.fn().mockResolvedValue([]),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([]),
    shuffle: jest.fn().mockResolvedValue(undefined),
    deal: jest.fn().mockResolvedValue(undefined),
    draw: jest.fn().mockResolvedValue([]),
    pass: jest.fn().mockResolvedValue([]),
    recall: jest.fn().mockResolvedValue(undefined)
  };
}

/** What `Cards#pass` / `#deal` do with a deck's card: mark it drawn and put a copy, same id, in the destination. */
function dealFromDeck(deck: FoundryCardsDocument, destination: FoundryCardsDocument, cardId: string): void {
  const original = deck.cards.get(cardId);
  if (original === undefined) {
    return;
  }
  original._source.drawn = true;
  destination.cards.contents.push(cardDoc(cardId, 100000, { origin: { id: deck.id } }));
  const copy = destination.cards.contents.at(-1);
  if (copy !== undefined) {
    copy._source.drawn = true;
  }
}

interface World {
  deck: FoundryCardsDocument;
  hand: FoundryCardsDocument;
  pile: FoundryCardsDocument;
  globals: FoundryCardGlobals;
  provider: CardGlobalsProvider;
  create: jest.Mock;
  fetch: jest.Mock;
}

function world(): World {
  const deck = stackDoc('deck', 'deck', [cardDoc('c1', 0), cardDoc('c2', 1), cardDoc('c3', 2)]);
  const hand = stackDoc('hand', 'hand');
  const pile = stackDoc('pile', 'pile');
  const create = jest.fn();
  const fetch = jest.fn();
  const stacks = [deck, hand, pile];
  const globals: FoundryCardGlobals = {
    game: {
      cards: { contents: stacks, get: (id) => stacks.find((stack) => stack.id === id) },
      folders: { get: (id) => (id === 'f1' ? { type: 'Cards' } : undefined) },
      model: { Card: { base: {} } }
    },
    CONFIG: {
      Cards: { documentClass: { create }, presets: { pokerDark: { type: 'deck', src: 'cards/poker-deck-dark.json' } } }
    },
    foundry: { utils: { mergeObject: (original, other) => ({ ...original, ...other }) } },
    fetch
  };
  return { deck, hand, pile, globals, provider: () => globals, create, fetch };
}

describe('card handlers', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    (globalThis as Record<string, unknown>)['game'] = { release: { generation: 14 } };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
    jest.restoreAllMocks();
  });

  describe('get-card-stacks / get-card-stack', () => {
    it('lists the stacks with their counts', async () => {
      const { provider, deck } = world();
      deck.cards.contents[0]!._source.drawn = true;

      const result = await createGetCardStacksHandler({ globals: provider })({ type: 'deck' });

      expect(result).toEqual({
        cardStacks: [
          {
            id: 'deck',
            uuid: 'Cards.deck',
            name: 'DECK',
            type: 'deck',
            img: 'icons/svg/card-hand.svg',
            folderId: null,
            folderName: null,
            ownerIds: [],
            cardCount: 3,
            availableCount: 2,
            drawnCount: 1
          }
        ]
      });
    });

    it('rejects an unknown stack type', async () => {
      await expect(
        createGetCardStacksHandler({ globals: world().provider })({ type: 'tableau' as 'deck' })
      ).rejects.toThrow('type');
    });

    it('returns one stack with its cards from the top', async () => {
      const result = await createGetCardStackHandler({ globals: world().provider })({ stackId: 'deck' });

      expect(result.description).toBe('');
      expect(result.cards.map((card) => card.id)).toEqual(['c1', 'c2', 'c3']);
      expect(result.cards[0]).toEqual({
        id: 'c1',
        name: 'Card c1',
        description: '',
        type: 'base',
        suit: 'clubs',
        value: 1,
        faces: [{ name: 'Card c1', text: '', img: 'cards/c1.webp' }],
        face: 0,
        faceUp: true,
        back: { name: null, text: '', img: null },
        img: 'cards/c1.webp',
        drawn: false,
        originId: null,
        sort: 0,
        system: {},
        flags: {}
      });
    });

    it('answers not found for an unknown stack', async () => {
      await expect(createGetCardStackHandler({ globals: world().provider })({ stackId: 'ghost' })).rejects.toThrow(
        'Card stack not found: ghost'
      );
    });
  });

  describe('stack CRUD', () => {
    it('creates a deck from a preset', async () => {
      const { provider, create, fetch } = world();
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ name: 'Poker Deck - Dark', type: 'deck', cards: [] }) });
      create.mockResolvedValue(stackDoc('new', 'deck'));

      const result = await createCreateCardStackHandler({ globals: provider })({ name: 'Poker', preset: 'pokerDark', folderId: 'f1' });

      expect(create).toHaveBeenCalledWith({ name: 'Poker', type: 'deck', cards: [], folder: 'f1' });
      expect(result).toEqual(expect.objectContaining({ id: 'new', type: 'deck', cards: [] }));
    });

    it('rejects a new stack without a type or preset', async () => {
      await expect(createCreateCardStackHandler({ globals: world().provider })({ name: 'X' })).rejects.toThrow(
        'type is required unless preset is given'
      );
    });

    it('updates a stack', async () => {
      const { provider, pile } = world();

      const result = await createUpdateCardStackHandler({ globals: provider })({ stackId: 'pile', description: null, folderId: null });

      expect(pile.update).toHaveBeenCalledWith({ description: '', folder: null });
      expect(result.id).toBe('pile');
    });

    it('deletes a stack and refuses a silent deletion before Foundry 14', async () => {
      const { provider, hand } = world();

      await expect(createDeleteCardStackHandler({ globals: provider })({ stackId: 'hand', chatNotification: false })).resolves.toEqual({
        deleted: true,
        stackId: 'hand',
        moved: []
      });
      expect(hand.delete).toHaveBeenCalledWith({ chatNotification: false });

      (globalThis as Record<string, unknown>)['game'] = { release: { generation: 13 } };
      await expect(
        createDeleteCardStackHandler({ globals: provider })({ stackId: 'hand', chatNotification: false })
      ).rejects.toThrow('Deleting a card stack without a chat notification requires Foundry 14 or newer');
    });
  });

  describe('card CRUD', () => {
    it('creates a card with one default face shown', async () => {
      const { provider, pile } = world();
      (pile.createEmbeddedDocuments as jest.Mock).mockResolvedValue([cardDoc('new', 0)]);

      const result = await createCreateCardHandler({ globals: provider })({ stackId: 'pile', name: 'Fool' });

      expect(pile.createEmbeddedDocuments).toHaveBeenCalledWith('Card', [{ name: 'Fool', faces: [{}], face: 0 }]);
      expect(result).toEqual({ stackId: 'pile', card: expect.objectContaining({ id: 'new' }) as unknown });
    });

    it('updates and deletes a card', async () => {
      const { provider, deck } = world();

      const updated = await createUpdateCardHandler({ globals: provider })({ stackId: 'deck', cardId: 'c2', suit: null, back: { img: 'b.webp' } });
      const deleted = await createDeleteCardHandler({ globals: provider })({ stackId: 'deck', cardId: 'c3' });

      expect(deck.cards.get('c2')?.update).toHaveBeenCalledWith({ suit: '', back: { img: 'b.webp' } });
      expect(updated.card.id).toBe('c2');
      expect(deleted).toEqual({ deleted: true, stackId: 'deck', cardId: 'c3' });
      expect(deck.deleteEmbeddedDocuments).toHaveBeenCalledWith('Card', ['c3']);
    });

    it('answers not found for a card the stack does not have', async () => {
      await expect(
        createUpdateCardHandler({ globals: world().provider })({ stackId: 'hand', cardId: 'c1', name: 'X' })
      ).rejects.toThrow('Card not found in card stack hand: c1');
    });
  });

  describe('operations', () => {
    it('deals cards and reports what moved, read from the stacks afterwards', async () => {
      const { provider, deck, hand, pile } = world();
      (deck.deal as jest.Mock).mockImplementation(() => {
        dealFromDeck(deck, hand, 'c1');
        dealFromDeck(deck, pile, 'c2');
        return Promise.resolve(deck);
      });

      const result = await createDealCardsHandler({ globals: provider })({
        stackId: 'deck',
        toStackIds: ['hand', 'pile'],
        faceDown: true,
        chatNotification: false
      });

      expect(deck.deal).toHaveBeenCalledWith([hand, pile], 1, { updateData: { face: null }, chatNotification: false, how: 0 });
      expect(result.moved).toEqual([
        { cardId: 'c1', name: 'Card c1', fromStackId: 'deck', toStackId: 'hand' },
        { cardId: 'c2', name: 'Card c2', fromStackId: 'deck', toStackId: 'pile' }
      ]);
      expect(result.stacks.map((stack) => [stack.id, stack.cardCount, stack.availableCount, stack.drawnCount])).toEqual([
        ['deck', 3, 1, 2],
        ['hand', 1, 1, null],
        ['pile', 1, 1, null]
      ]);
    });

    it('rejects a deal of zero cards and fails a deal a hook prevented', async () => {
      const { provider } = world();

      await expect(createDealCardsHandler({ globals: provider })({ stackId: 'deck', toStackIds: ['hand'], count: 0 })).rejects.toThrow(
        'count'
      );
      await expect(createDealCardsHandler({ globals: provider })({ stackId: 'deck', toStackIds: ['hand'] })).rejects.toThrow(
        'The deal moved no card'
      );
    });

    it('draws, passes, plays and discards through the core methods', async () => {
      const { provider, deck, hand, pile } = world();
      (hand.draw as jest.Mock).mockImplementation(() => {
        dealFromDeck(deck, hand, 'c3');
        dealFromDeck(deck, hand, 'c2');
        return Promise.resolve([]);
      });
      (hand.pass as jest.Mock).mockImplementation(() => {
        const index = hand.cards.contents.findIndex((card) => card.id === 'c3');
        pile.cards.contents.push(...hand.cards.contents.splice(index, 1));
        return Promise.resolve([]);
      });

      const drawn = await createDrawCardsHandler({ globals: provider })({ stackId: 'hand', fromStackId: 'deck', count: 2, drawMode: 'bottom' });
      const passed = await createPassCardsHandler({ globals: provider })({ stackId: 'hand', toStackId: 'pile', cardIds: ['c3'] });

      expect(hand.draw).toHaveBeenCalledWith(deck, 2, { how: 1 });
      expect(drawn.moved.map((move) => move.cardId)).toEqual(['c3', 'c2']);
      expect(hand.pass).toHaveBeenCalledWith(pile, ['c3'], {});
      expect(passed.moved).toEqual([{ cardId: 'c3', name: 'Card c3', fromStackId: 'hand', toStackId: 'pile' }]);

      const card = hand.cards.get('c2');
      (card?.play as jest.Mock).mockImplementation(() => {
        pile.cards.contents.push(...hand.cards.contents.splice(0, 1));
        return Promise.resolve(undefined);
      });
      const played = await createPlayCardHandler({ globals: provider })({ stackId: 'hand', cardId: 'c2', toStackId: 'pile', faceDown: false });

      expect(card?.play).toHaveBeenCalledWith(pile, { updateData: { face: 0 } });
      expect(played.moved).toEqual([{ cardId: 'c2', name: 'Card c2', fromStackId: 'hand', toStackId: 'pile' }]);
      await expect(
        createDiscardCardHandler({ globals: provider })({ stackId: 'pile', cardId: 'c2', toStackId: 'deck' })
      ).rejects.toThrow('Cards can only be discarded to a hand or a pile; DECK (deck) is a deck');
    });

    it('shuffles and recalls', async () => {
      const { provider, deck } = world();

      const shuffled = await createShuffleCardsHandler({ globals: provider })({ stackId: 'deck', chatNotification: false });
      const recalled = await createRecallCardsHandler({ globals: provider })({ stackId: 'deck', faceDown: true });

      expect(deck.shuffle).toHaveBeenCalledWith({ chatNotification: false });
      expect(deck.recall).toHaveBeenCalledWith({ updateData: { face: null } });
      expect(shuffled).toEqual({ moved: [], stacks: [expect.objectContaining({ id: 'deck', cardCount: 3 }) as unknown] });
      expect(recalled.moved).toEqual([]);
    });

    it('flips a card and shows it in chat', async () => {
      const { provider, deck } = world();
      const card = deck.cards.get('c1');
      (card?.flip as jest.Mock).mockImplementation((face: number | null) => {
        if (card !== undefined) {
          card._source.face = face;
        }
        return Promise.resolve(card);
      });

      const flipped = await createFlipCardHandler({ globals: provider })({ stackId: 'deck', cardId: 'c1', face: null });
      const shown = await createShowCardHandler({ globals: provider })({ stackId: 'deck', cardId: 'c1', whisperTo: ['u1'] });

      expect(flipped).toEqual({ stackId: 'deck', card: expect.objectContaining({ id: 'c1', face: null, faceUp: false }) as unknown });
      expect(card?.toMessage).toHaveBeenCalledWith({ whisper: ['u1'] });
      expect(shown).toEqual({ stackId: 'deck', cardId: 'c1', messageId: 'msg1' });
      await expect(createFlipCardHandler({ globals: provider })({ stackId: 'deck', cardId: 'c1', face: 'previous' })).rejects.toThrow(
        'lies face down; there is no previous face'
      );
    });
  });
});
