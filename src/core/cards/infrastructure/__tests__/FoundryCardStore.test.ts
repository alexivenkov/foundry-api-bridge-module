import { CardNotFoundError, CardStackNotFoundError } from '../../domain';
import { FoundryCardStore } from '../FoundryCardStore';
import { cardDocument, globalsFor, stackDocument } from './foundryCardFakes';

function world(): {
  store: FoundryCardStore;
  card: ReturnType<typeof cardDocument>;
  hand: ReturnType<typeof stackDocument>;
  pile: ReturnType<typeof stackDocument>;
} {
  const card = cardDocument('c1', { name: 'Ace', faces: [{ name: 'Ace', text: '', img: 'a.webp' }, { text: '', img: 'b.webp' }] });
  const hand = stackDocument('hand', 'hand', [card]);
  const pile = stackDocument('pile', 'pile');
  const globals = globalsFor([hand, pile]);
  return { store: new FoundryCardStore(() => globals), card, hand, pile };
}

describe('FoundryCardStore', () => {
  describe('createCard', () => {
    it('creates the card with only the fields given', async () => {
      const { store, hand } = world();
      (hand.createEmbeddedDocuments as jest.Mock).mockResolvedValue([cardDocument('new', { name: 'Fool' })]);

      const created = await store.createCard('hand', {
        name: 'Fool',
        type: 'base',
        faces: [{}],
        face: 0,
        back: { name: 'Back', img: 'cards/backs/dark-gold.webp' },
        flags: { mod: { a: 1 } }
      });

      expect(hand.createEmbeddedDocuments).toHaveBeenCalledWith('Card', [
        {
          name: 'Fool',
          type: 'base',
          faces: [{}],
          face: 0,
          back: { name: 'Back', img: 'cards/backs/dark-gold.webp' },
          flags: { mod: { a: 1 } }
        }
      ]);
      expect(created?.name).toBe('Fool');
    });

    it('resolves to null when the core created nothing and fails on a missing stack', async () => {
      const { store } = world();

      await expect(store.createCard('hand', { name: 'X' })).resolves.toBeNull();
      await expect(store.createCard('ghost', { name: 'X' })).rejects.toThrow(new CardStackNotFoundError('ghost'));
    });
  });

  describe('updateCard', () => {
    it('clears texts to empty strings and keeps null for the value and images', async () => {
      const { store, card } = world();

      await store.updateCard('hand', 'c1', {
        description: null,
        suit: null,
        value: null,
        back: { name: null, text: null, img: null },
        faces: [{ name: 'Front', img: null }],
        face: null,
        sort: 3,
        system: { power: 2 }
      });

      expect(card.update).toHaveBeenCalledWith({
        description: '',
        suit: '',
        value: null,
        back: { name: null, text: '', img: null },
        faces: [{ name: 'Front', img: null }],
        face: null,
        sort: 3,
        system: { power: 2 }
      });
    });

    it('resolves to null for a card that is gone', async () => {
      await expect(world().store.updateCard('hand', 'zz', { name: 'X' })).resolves.toBeNull();
    });
  });

  it('deletes a card of the stack', async () => {
    const { store, hand } = world();

    await store.deleteCard('hand', 'c1');

    expect(hand.deleteEmbeddedDocuments).toHaveBeenCalledWith('Card', ['c1']);
  });

  it('plays and discards through the Card methods with the options mapped', async () => {
    const { store, card, pile } = world();

    await store.play('hand', 'c1', 'pile', { facing: 'up', chatNotification: false });
    await store.discard('hand', 'c1', 'pile', {});

    expect(card.play).toHaveBeenCalledWith(pile, { updateData: { face: 0 }, chatNotification: false });
    expect(card.discard).toHaveBeenCalledWith(pile, {});
    await expect(store.play('hand', 'zz', 'pile', {})).rejects.toThrow(new CardNotFoundError('hand', 'zz'));
    await expect(store.discard('hand', 'c1', 'ghost', {})).rejects.toThrow(CardStackNotFoundError);
  });

  describe('flip', () => {
    it("calls Card#flip without an argument for the core's default", async () => {
      const { store, card } = world();

      await store.flip('hand', 'c1', undefined);

      expect(card.flip).toHaveBeenCalledWith();
    });

    it('flips to a face index or face down', async () => {
      const { store, card } = world();

      await store.flip('hand', 'c1', 1);
      await store.flip('hand', 'c1', null);

      expect(card.flip).toHaveBeenNthCalledWith(1, 1);
      expect(card.flip).toHaveBeenNthCalledWith(2, null);
      await expect(store.flip('hand', 'zz', null)).resolves.toBeNull();
    });
  });

  describe('showInChat', () => {
    it('posts the card, whispered when recipients are given', async () => {
      const { store, card } = world();

      await expect(store.showInChat('hand', 'c1', [])).resolves.toBe('msg1');
      await store.showInChat('hand', 'c1', ['u1']);

      expect(card.toMessage).toHaveBeenNthCalledWith(1, {});
      expect(card.toMessage).toHaveBeenNthCalledWith(2, { whisper: ['u1'] });
    });

    it('resolves to null when the core created no message', async () => {
      const { store, card } = world();
      (card.toMessage as jest.Mock).mockResolvedValue(undefined);

      await expect(store.showInChat('hand', 'c1', [])).resolves.toBeNull();
    });
  });
});
