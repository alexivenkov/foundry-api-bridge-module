import {
  CardAlreadyDrawnError,
  CardCannotEnterDeckError,
  CardMessageFailedError,
  CardNotFoundError,
  CardOperationPreventedError,
  CardStackNotFoundError,
  DeckCannotDrawError,
  DeckDestinationError,
  NoNextCardFaceError,
  NotEnoughCardsError,
  SameCardStackError
} from '../../domain';
import { CardOperationService } from '../CardOperationService';
import { FakeCardWorld, card, stack } from './fakePorts';

const faces = [
  { name: 'Front', text: '', img: null },
  { name: 'Back side', text: '', img: null }
];

function setup(): { service: CardOperationService; world: FakeCardWorld } {
  const world = new FakeCardWorld([
    stack('deck', 'deck', [
      card({ id: 'a', name: 'A', sort: 0 }),
      card({ id: 'b', name: 'B', sort: 1 }),
      card({ id: 'c', name: 'C', sort: 2 }),
      card({ id: 'd', name: 'D', sort: 3, faces, face: 0 })
    ]),
    stack('tarot', 'deck'),
    stack('alice', 'hand'),
    stack('bob', 'hand'),
    stack('pile', 'pile')
  ]);
  return { service: new CardOperationService({ stacks: world, cards: world }), world };
}

describe('CardOperationService', () => {
  describe('shuffle', () => {
    it('shuffles the stack and reports its counts', async () => {
      const { service, world } = setup();

      const result = await service.shuffle({ stackId: 'deck', options: { facing: 'down', chatNotification: false } });

      expect(world.calls).toEqual([{ method: 'shuffle', args: ['deck', { facing: 'down', chatNotification: false }] }]);
      expect(result.moved).toEqual([]);
      expect(result.stacks.map((s) => [s.id, s.cardCount, s.availableCount])).toEqual([['deck', 4, 4]]);
    });
  });

  describe('deal', () => {
    it('reports every card dealt and the counts of the stacks involved', async () => {
      const { service, world } = setup();

      const result = await service.deal({ stackId: 'deck', toStackIds: ['alice', 'bob'], count: 2, mode: 'top', options: {} });

      expect(world.calls[0]).toEqual({ method: 'deal', args: ['deck', ['alice', 'bob'], 2, 'top', {}] });
      expect(result.moved.map((m) => `${m.cardId}:${String(m.fromStackId)}>${String(m.toStackId)}`)).toEqual([
        'a:deck>alice',
        'c:deck>alice',
        'b:deck>bob',
        'd:deck>bob'
      ]);
      expect(result.stacks.map((s) => [s.id, s.availableCount, s.drawnCount])).toEqual([
        ['deck', 0, 4],
        ['alice', 2, null],
        ['bob', 2, null]
      ]);
    });

    it('refuses a deck as destination, the source itself, too few cards and unknown stacks', async () => {
      const { service, world } = setup();
      const deal = (toStackIds: string[], count = 1): Promise<unknown> =>
        service.deal({ stackId: 'deck', toStackIds, count, mode: 'top', options: {} });

      await expect(deal(['tarot'])).rejects.toThrow(
        'Cards can only be dealt to a hand or a pile; tarot (tarot) is a deck'
      );
      await expect(deal(['alice', 'deck'])).rejects.toThrow(SameCardStackError);
      await expect(deal(['alice', 'bob'], 3)).rejects.toThrow(
        'Not enough cards in deck (deck): 6 requested, 4 available'
      );
      await expect(deal(['ghost'])).rejects.toThrow(new CardStackNotFoundError('ghost'));
      expect(world.methods()).toEqual([]);
    });

    it('fails when a hook prevented the deal', async () => {
      const { service, world } = setup();
      world.vetoed = true;

      await expect(
        service.deal({ stackId: 'deck', toStackIds: ['alice'], count: 1, mode: 'top', options: {} })
      ).rejects.toThrow(new CardOperationPreventedError('deal'));
    });
  });

  describe('draw', () => {
    it('lets a hand draw from a deck', async () => {
      const { service, world } = setup();

      const result = await service.draw({ stackId: 'alice', fromStackId: 'deck', count: 2, mode: 'random', options: {} });

      expect(world.calls[0]).toEqual({ method: 'draw', args: ['alice', 'deck', 2, 'random', {}] });
      expect(result.moved.map((m) => [m.cardId, m.fromStackId, m.toStackId])).toEqual([
        ['a', 'deck', 'alice'],
        ['b', 'deck', 'alice']
      ]);
      expect(result.stacks.map((s) => s.id)).toEqual(['deck', 'alice']);
    });

    it('refuses a deck that draws, the same stack and too few cards', async () => {
      const { service } = setup();

      await expect(
        service.draw({ stackId: 'tarot', fromStackId: 'deck', count: 1, mode: 'top', options: {} })
      ).rejects.toThrow(DeckCannotDrawError);
      await expect(
        service.draw({ stackId: 'alice', fromStackId: 'alice', count: 1, mode: 'top', options: {} })
      ).rejects.toThrow(SameCardStackError);
      await expect(
        service.draw({ stackId: 'alice', fromStackId: 'pile', count: 1, mode: 'top', options: {} })
      ).rejects.toThrow(NotEnoughCardsError);
    });
  });

  describe('pass', () => {
    it('passes cards of a hand to a pile', async () => {
      const { service, world } = setup();
      await world.deal('deck', ['alice'], 2, 'top', {});

      const result = await service.pass({ stackId: 'alice', toStackId: 'pile', cardIds: ['b'], options: {} });

      expect(result.moved).toEqual([{ cardId: 'b', name: 'B', fromStackId: 'alice', toStackId: 'pile' }]);
    });

    it('passes a card back into the deck it came from', async () => {
      const { service, world } = setup();
      await world.deal('deck', ['alice'], 1, 'top', {});

      const result = await service.pass({ stackId: 'alice', toStackId: 'deck', cardIds: ['a'], options: {} });

      expect(result.moved).toEqual([{ cardId: 'a', name: 'A', fromStackId: 'alice', toStackId: 'deck' }]);
      expect(result.stacks.find((s) => s.id === 'deck')?.availableCount).toBe(4);
    });

    it("reports a deck's own card copied into another deck as coming from the first", async () => {
      const { service } = setup();

      const result = await service.pass({ stackId: 'deck', toStackId: 'tarot', cardIds: ['a'], options: {} });

      expect(result.moved).toEqual([{ cardId: 'a', name: 'A', fromStackId: 'deck', toStackId: 'tarot' }]);
    });

    it('refuses a card that is out, one going into a foreign deck, and one the stack does not have', async () => {
      const { service, world } = setup();
      await world.deal('deck', ['alice'], 1, 'top', {});
      const before = world.calls.length;

      await expect(service.pass({ stackId: 'deck', toStackId: 'pile', cardIds: ['a'], options: {} })).rejects.toThrow(
        CardAlreadyDrawnError
      );
      await expect(service.pass({ stackId: 'alice', toStackId: 'tarot', cardIds: ['a'], options: {} })).rejects.toThrow(
        CardCannotEnterDeckError
      );
      await expect(service.pass({ stackId: 'alice', toStackId: 'pile', cardIds: ['zz'], options: {} })).rejects.toThrow(
        new CardNotFoundError('alice', 'zz')
      );
      expect(world.calls).toHaveLength(before);
    });
  });

  describe('play and discard', () => {
    it('plays and discards a card of a hand to a pile', async () => {
      const { service, world } = setup();
      await world.deal('deck', ['alice'], 2, 'top', {});

      const played = await service.play({ stackId: 'alice', cardId: 'a', toStackId: 'pile', options: { facing: 'up' } });
      const discarded = await service.discard({ stackId: 'alice', cardId: 'b', toStackId: 'pile', options: {} });

      expect(played.moved).toEqual([{ cardId: 'a', name: 'A', fromStackId: 'alice', toStackId: 'pile' }]);
      expect(discarded.moved).toEqual([{ cardId: 'b', name: 'B', fromStackId: 'alice', toStackId: 'pile' }]);
      expect(world.methods().slice(-2)).toEqual(['play', 'discard']);
      expect(world.calls.at(-2)?.args).toEqual(['alice', 'a', 'pile', { facing: 'up' }]);
    });

    it('refuses a deck as destination', async () => {
      const { service, world } = setup();
      await world.deal('deck', ['alice'], 1, 'top', {});

      await expect(service.play({ stackId: 'alice', cardId: 'a', toStackId: 'tarot', options: {} })).rejects.toThrow(
        new DeckDestinationError('played', { id: 'tarot', name: 'tarot' })
      );
      await expect(service.discard({ stackId: 'alice', cardId: 'a', toStackId: 'deck', options: {} })).rejects.toThrow(
        'Cards can only be discarded to a hand or a pile; deck (deck) is a deck'
      );
    });

    it('fails when a hook prevented the play', async () => {
      const { service, world } = setup();
      await world.deal('deck', ['alice'], 1, 'top', {});
      world.vetoed = true;

      await expect(service.play({ stackId: 'alice', cardId: 'a', toStackId: 'pile', options: {} })).rejects.toThrow(
        'The play moved no card: a module or the game system prevented it'
      );
    });
  });

  describe('recall', () => {
    it('lets a deck take back its cards from every stack', async () => {
      const { service, world } = setup();
      await world.deal('deck', ['alice', 'pile'], 1, 'top', {});

      const result = await service.recall({ stackId: 'deck', options: { chatNotification: false } });

      expect(result.moved.map((m) => [m.cardId, m.fromStackId, m.toStackId])).toEqual([
        ['a', 'alice', 'deck'],
        ['b', 'pile', 'deck']
      ]);
      expect(result.stacks.map((s) => s.id)).toEqual(['deck', 'alice', 'pile']);
    });

    it('reports an empty recall without failing', async () => {
      const result = await setup().service.recall({ stackId: 'alice', options: {} });

      expect(result).toEqual({ moved: [], stacks: [expect.objectContaining({ id: 'alice' }) as unknown] });
    });
  });

  describe('flip', () => {
    it('flips to the face resolved from the request', async () => {
      const { service, world } = setup();

      const result = await service.flip({ stackId: 'deck', cardId: 'd', face: 'next' });

      expect(world.calls).toEqual([{ method: 'flip', args: ['deck', 'd', 1] }]);
      expect(result.card.face).toBe(1);
    });

    it("leaves an absent face to the core's flip", async () => {
      const { service, world } = setup();

      await service.flip({ stackId: 'deck', cardId: 'a' });

      expect(world.calls[0]?.args).toEqual(['deck', 'a', undefined]);
    });

    it('refuses a step past the last face and an unknown card', async () => {
      const { service } = setup();

      await expect(service.flip({ stackId: 'deck', cardId: 'a', face: 'next' })).rejects.toThrow(NoNextCardFaceError);
      await expect(service.flip({ stackId: 'deck', cardId: 'zz', face: null })).rejects.toThrow(CardNotFoundError);
    });
  });

  describe('show', () => {
    it('shows the card in chat, whispered when asked', async () => {
      const { service, world } = setup();

      const result = await service.show({ stackId: 'deck', cardId: 'a', whisperTo: ['u1'] });

      expect(result).toEqual({ stackId: 'deck', cardId: 'a', messageId: 'msg1' });
      expect(world.calls).toEqual([{ method: 'showInChat', args: ['deck', 'a', ['u1']] }]);
    });

    it('fails when the core created no message', async () => {
      const { service, world } = setup();
      world.messageId = null;

      await expect(service.show({ stackId: 'deck', cardId: 'a', whisperTo: [] })).rejects.toThrow(CardMessageFailedError);
    });
  });
});
