import { CardPresetLoadFailedError, CardStackNotFoundError, UnknownCardPresetError } from '../../domain';
import { FoundryCardStackStore } from '../FoundryCardStackStore';
import { cardDocument, globalsFor, stackDocument, type FakeGlobals } from './foundryCardFakes';

function world(): { store: FoundryCardStackStore; globals: FakeGlobals; deck: ReturnType<typeof stackDocument>; hand: ReturnType<typeof stackDocument>; pile: ReturnType<typeof stackDocument> } {
  const deck = stackDocument(
    'deck',
    'deck',
    [
      cardDocument('c3', { sort: 2 }),
      cardDocument('c1', { sort: 0, drawn: true }),
      cardDocument('c2', { sort: 1 })
    ],
    {
      name: 'Poker',
      img: 'cards/backs/dark-gold.webp',
      description: '<p>House deck</p>',
      folder: { id: 'f-cards', name: 'Card Games' }
    }
  );
  const hand = stackDocument('hand', 'hand', [cardDocument('c1', { drawn: true }, { origin: { id: 'deck' } })], {
    name: 'Alice',
    ownership: { default: 0, alice0000000000a: 3, bob0000000000000b: 2 }
  });
  const pile = stackDocument('pile', 'pile', [], { name: 'Discard', img: undefined, description: undefined });
  const globals = globalsFor([deck, hand, pile]);
  return { store: new FoundryCardStackStore(() => globals), globals, deck, hand, pile };
}

function setGeneration(generation: number): void {
  (globalThis as Record<string, unknown>)['game'] = { release: { generation } };
}

describe('FoundryCardStackStore', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  describe('reading', () => {
    it('summarizes each stack with the counts of the core getters', () => {
      expect(world().store.listStacks()).toEqual([
        {
          id: 'deck',
          uuid: 'Cards.deck',
          name: 'Poker',
          type: 'deck',
          img: 'cards/backs/dark-gold.webp',
          folderId: 'f-cards',
          folderName: 'Card Games',
          ownerIds: [],
          cardCount: 3,
          availableCount: 2,
          drawnCount: 1
        },
        expect.objectContaining({ id: 'hand', ownerIds: ['alice0000000000a'], cardCount: 1, availableCount: 1, drawnCount: null }),
        expect.objectContaining({ id: 'pile', img: null, folderId: null, folderName: null, cardCount: 0, drawnCount: null })
      ]);
    });

    it('returns a stack with its cards from the top, read from their stored data', () => {
      const stack = world().store.findStack('deck');

      expect(stack?.description).toBe('<p>House deck</p>');
      expect(stack?.cards.map((card) => card.id)).toEqual(['c1', 'c2', 'c3']);
      expect(stack?.cards[0]).toEqual({
        id: 'c1',
        name: 'Card c1',
        description: '',
        type: 'base',
        suit: '',
        value: null,
        faces: [{ name: 'Card c1', text: '', img: 'cards/c1.webp' }],
        face: 0,
        faceUp: true,
        back: { name: null, text: '', img: null },
        img: 'cards/c1.webp',
        drawn: true,
        originId: null,
        sort: 0,
        system: {},
        flags: {}
      });
    });

    it('reads a face-down card by its own name and the origin it was drawn from', () => {
      const { store, hand } = world();
      hand.cards.contents[0] = cardDocument('c1', { name: 'Ace of Spades', face: null, drawn: true }, {
        origin: { id: 'deck' },
        img: 'cards/backs/dark-gold.webp'
      });

      expect(store.findStack('hand')?.cards[0]).toEqual(
        expect.objectContaining({ name: 'Ace of Spades', face: null, faceUp: false, originId: 'deck', img: 'cards/backs/dark-gold.webp' })
      );
      expect(store.findStack('ghost')).toBeNull();
    });

    it('reads what each stack holds: a deck its cards that are not out, top first', () => {
      expect(world().store.readHoldings()).toEqual([
        { stackId: 'deck', cards: [{ id: 'c2', name: 'Card c2' }, { id: 'c3', name: 'Card c3' }] },
        { stackId: 'hand', cards: [{ id: 'c1', name: 'Card c1' }] },
        { stackId: 'pile', cards: [] }
      ]);
    });

    it('tells folders of card stacks from other folders', () => {
      const { store } = world();

      expect(store.findFolderKind('f-cards')).toBe('card-stacks');
      expect(store.findFolderKind('f-actors')).toBe('other');
      expect(store.findFolderKind('nope')).toBeNull();
    });

    it('lists the presets of CONFIG.Cards and the card types of the world', () => {
      const { store, globals } = world();

      expect(store.listPresets()).toEqual([
        { key: 'pokerDark', type: 'deck' },
        { key: 'pokerLight', type: 'deck' }
      ]);
      expect(store.listCardTypes()).toEqual(['base']);
      globals.CONFIG.Cards.presets = undefined;
      globals.game.model = undefined;
      expect(store.listPresets()).toEqual([]);
      expect(store.listCardTypes()).toEqual([]);
    });
  });

  describe('creating', () => {
    it('creates a stack from the draft, the folder as `folder`', async () => {
      const { store, globals } = world();
      globals.create.mockResolvedValue(stackDocument('new', 'hand', [], { name: 'Bob' }));

      const created = await store.createStack({ name: 'Bob', type: 'hand', folderId: 'f-cards', description: null }, undefined);

      expect(globals.create).toHaveBeenCalledWith({ name: 'Bob', type: 'hand', folder: 'f-cards', description: '' });
      expect(created?.name).toBe('Bob');
      expect(globals.fetchMock).not.toHaveBeenCalled();
    });

    it("loads a preset's data as the creation dialog does and lets the caller's fields override it", async () => {
      const { store, globals } = world();
      const presetData = { name: 'Poker Deck - Dark', type: 'deck', img: 'cards/backs/dark-gold.webp', cards: [{ name: 'Ace of Clubs' }] };
      globals.fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(presetData) });
      globals.create.mockResolvedValue(stackDocument('new', 'deck'));

      await store.createStack({ name: 'Poker', type: 'deck' }, 'pokerDark');

      expect(globals.fetchMock).toHaveBeenCalledWith('cards/poker-deck-dark.json');
      expect(globals.create).toHaveBeenCalledWith({
        name: 'Poker',
        type: 'deck',
        img: 'cards/backs/dark-gold.webp',
        cards: [{ name: 'Ace of Clubs' }]
      });
    });

    it('fails on a preset that cannot be loaded or is not an object', async () => {
      const { store, globals } = world();

      globals.fetchMock.mockResolvedValueOnce({ ok: false, json: () => Promise.reject(new Error('404')) });
      await expect(store.createStack({ name: 'X', type: 'deck' }, 'pokerDark')).rejects.toThrow(CardPresetLoadFailedError);
      globals.fetchMock.mockRejectedValueOnce(new Error('offline'));
      await expect(store.createStack({ name: 'X', type: 'deck' }, 'pokerDark')).rejects.toThrow(
        'Failed to load card preset pokerDark'
      );
      globals.fetchMock.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      await expect(store.createStack({ name: 'X', type: 'deck' }, 'pokerDark')).rejects.toThrow(CardPresetLoadFailedError);
      await expect(store.createStack({ name: 'X', type: 'deck' }, 'uno')).rejects.toThrow(UnknownCardPresetError);
      expect(globals.create).not.toHaveBeenCalled();
    });

    it('resolves to null when the core created nothing', async () => {
      await expect(world().store.createStack({ name: 'X', type: 'pile' }, undefined)).resolves.toBeNull();
    });
  });

  describe('updating and deleting', () => {
    it('updates only the fields given; a cleared description is empty, a null folder the root', async () => {
      const { store, pile } = world();

      await store.updateStack('pile', { name: 'Graveyard', description: null, folderId: null });

      expect(pile.update).toHaveBeenCalledWith({ name: 'Graveyard', description: '', folder: null });
      await expect(store.updateStack('ghost', {})).resolves.toBeNull();
    });

    it('deletes without options unless the caller set the chat notification', async () => {
      const { store, deck, hand } = world();

      await store.deleteStack('deck', undefined);
      await store.deleteStack('hand', false);

      expect(deck.delete).toHaveBeenCalledWith();
      expect(hand.delete).toHaveBeenCalledWith({ chatNotification: false });
      await expect(store.deleteStack('ghost', undefined)).rejects.toThrow(CardStackNotFoundError);
    });

    it('can silence the recall of a deletion from Foundry 14 on only', () => {
      const { store } = world();

      setGeneration(13);
      expect(store.canSilenceDeletionRecall()).toBe(false);
      setGeneration(14);
      expect(store.canSilenceDeletionRecall()).toBe(true);
    });
  });

  describe('operations', () => {
    it('shuffles and recalls with the options mapped to the core', async () => {
      const { store, deck, hand } = world();

      await store.shuffle('deck', { facing: 'down', chatNotification: false });
      await store.recall('hand', {});
      await store.recall('deck', { facing: 'up' });

      expect(deck.shuffle).toHaveBeenCalledWith({ updateData: { face: null }, chatNotification: false });
      expect(hand.recall).toHaveBeenCalledWith({});
      expect(deck.recall).toHaveBeenCalledWith({ updateData: { face: 0 } });
    });

    it.each([
      ['top', 0],
      ['bottom', 1],
      ['random', 2]
    ] as const)('deals %s as CONST.CARD_DRAW_MODES %i to the destination documents', async (mode, how) => {
      const { store, deck, hand, pile } = world();

      await store.deal('deck', ['hand', 'pile'], 3, mode, { facing: 'down' });

      expect(deck.deal).toHaveBeenCalledWith([hand, pile], 3, { updateData: { face: null }, how });
    });

    it('lets the drawer draw from the source document', async () => {
      const { store, deck, hand } = world();

      await store.draw('hand', 'deck', 2, 'random', { chatNotification: false });

      expect(hand.draw).toHaveBeenCalledWith(deck, 2, { chatNotification: false, how: 2 });
    });

    it('passes the given card ids to the destination document', async () => {
      const { store, hand, pile } = world();

      await store.pass('hand', 'pile', ['c1'], { facing: 'up' });

      expect(hand.pass).toHaveBeenCalledWith(pile, ['c1'], { updateData: { face: 0 } });
    });

    it('fails on a stack that is gone', async () => {
      const { store } = world();

      await expect(store.shuffle('ghost', {})).rejects.toThrow(new CardStackNotFoundError('ghost'));
      await expect(store.deal('deck', ['ghost'], 1, 'top', {})).rejects.toThrow(CardStackNotFoundError);
      await expect(store.draw('hand', 'ghost', 1, 'top', {})).rejects.toThrow(CardStackNotFoundError);
      await expect(store.pass('hand', 'ghost', ['c1'], {})).rejects.toThrow(CardStackNotFoundError);
    });
  });
});
