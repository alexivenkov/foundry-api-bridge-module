import { ValidationError } from '../../../../kernel';
import { CoreFeatureUnavailableError } from '../../../shared';
import {
  CardCreationFailedError,
  CardFaceOutOfRangeError,
  CardNotFoundError,
  CardPresetTypeMismatchError,
  CardStackCreationFailedError,
  CardStackFolderNotFoundError,
  CardStackNotFoundError,
  NotACardStackFolderError,
  UnknownCardPresetError,
  UnknownCardTypeError
} from '../../domain';
import { CardStackService } from '../CardStackService';
import { FakeCardWorld, card, stack } from './fakePorts';

function setup(): { service: CardStackService; world: FakeCardWorld } {
  const world = new FakeCardWorld([
    stack('deck', 'deck', [card({ id: 'a', sort: 0 }), card({ id: 'b', sort: 1 })]),
    stack('alice', 'hand'),
    stack('pile', 'pile')
  ]);
  return { service: new CardStackService({ stacks: world, cards: world }), world };
}

describe('CardStackService', () => {
  describe('reading', () => {
    it('lists every stack, or the stacks of one type', () => {
      const { service } = setup();

      expect(service.listStacks({}).map((s) => s.id)).toEqual(['deck', 'alice', 'pile']);
      expect(service.listStacks({ type: 'hand' }).map((s) => s.id)).toEqual(['alice']);
    });

    it('returns a stack with its cards and refuses an unknown one', () => {
      const { service } = setup();

      expect(service.getStack({ stackId: 'deck' }).cards.map((c) => c.id)).toEqual(['a', 'b']);
      expect(() => service.getStack({ stackId: 'nope' })).toThrow(new CardStackNotFoundError('nope'));
    });
  });

  describe('createStack', () => {
    it('creates a stack of the given type in a folder of card stacks', async () => {
      const { service, world } = setup();

      const created = await service.createStack({ name: 'Bob', type: 'hand', changes: { folderId: 'f-cards' } });

      expect(created.type).toBe('hand');
      expect(world.calls).toEqual([
        { method: 'createStack', args: [{ name: 'Bob', type: 'hand', folderId: 'f-cards' }, undefined] }
      ]);
    });

    it('takes the type of the preset when none is given', async () => {
      const { service, world } = setup();

      await service.createStack({ name: 'Poker', preset: 'pokerDark', changes: {} });

      expect(world.calls[0]?.args).toEqual([{ name: 'Poker', type: 'deck' }, 'pokerDark']);
    });

    it('refuses a preset of another type, an unknown preset, and no type at all', async () => {
      const { service, world } = setup();

      await expect(service.createStack({ name: 'X', type: 'hand', preset: 'pokerDark', changes: {} })).rejects.toThrow(
        new CardPresetTypeMismatchError('pokerDark', 'deck', 'hand')
      );
      await expect(service.createStack({ name: 'X', preset: 'uno', changes: {} })).rejects.toThrow(
        'Unknown card preset: uno; available presets: pokerDark'
      );
      await expect(service.createStack({ name: 'X', changes: {} })).rejects.toThrow(ValidationError);
      world.presets = [];
      await expect(service.createStack({ name: 'X', preset: 'uno', changes: {} })).rejects.toThrow(
        UnknownCardPresetError
      );
      expect(world.methods()).toEqual([]);
    });

    it('refuses a folder that is missing or holds other documents', async () => {
      const { service } = setup();

      await expect(service.createStack({ name: 'X', type: 'pile', changes: { folderId: 'nope' } })).rejects.toThrow(
        CardStackFolderNotFoundError
      );
      await expect(service.createStack({ name: 'X', type: 'pile', changes: { folderId: 'f-actors' } })).rejects.toThrow(
        NotACardStackFolderError
      );
    });

    it('fails when the core created nothing', async () => {
      const { service, world } = setup();
      world.createsNothing = true;

      await expect(service.createStack({ name: 'X', type: 'pile', changes: {} })).rejects.toThrow(
        CardStackCreationFailedError
      );
    });
  });

  describe('updateStack', () => {
    it('updates an existing stack and may move it to the root', async () => {
      const { service, world } = setup();

      const updated = await service.updateStack({ stackId: 'alice', changes: { name: 'Alice', folderId: null } });

      expect(updated.name).toBe('Alice');
      expect(world.calls).toEqual([{ method: 'updateStack', args: ['alice', { name: 'Alice', folderId: null }] }]);
    });

    it('refuses an unknown stack and a wrong folder', async () => {
      const { service, world } = setup();

      await expect(service.updateStack({ stackId: 'nope', changes: {} })).rejects.toThrow(CardStackNotFoundError);
      await expect(service.updateStack({ stackId: 'alice', changes: { folderId: 'f-actors' } })).rejects.toThrow(
        NotACardStackFolderError
      );
      expect(world.methods()).toEqual([]);
    });
  });

  describe('deleteStack', () => {
    it("reports the cards the deletion's recall took out of other stacks", async () => {
      const { service, world } = setup();
      await world.deal('deck', ['alice'], 1, 'top', {});

      const result = await service.deleteStack({ stackId: 'deck', chatNotification: false });

      expect(result).toEqual({
        stackId: 'deck',
        moved: [{ cardId: 'a', name: 'Ace of Spades', fromStackId: 'alice', toStackId: null }]
      });
      expect(world.calls.at(-1)).toEqual({ method: 'deleteStack', args: ['deck', false] });
    });

    it('reports a deleted hand returning its cards to their deck', async () => {
      const { service, world } = setup();
      await world.deal('deck', ['alice'], 2, 'top', {});

      const result = await service.deleteStack({ stackId: 'alice' });

      expect(result.moved.map((move) => [move.cardId, move.fromStackId, move.toStackId])).toEqual([
        ['a', 'alice', 'deck'],
        ['b', 'alice', 'deck']
      ]);
    });

    it('refuses to skip the chat notification on a core that cannot', async () => {
      const { service, world } = setup();
      world.silenceable = false;

      await expect(service.deleteStack({ stackId: 'deck', chatNotification: false })).rejects.toThrow(
        new CoreFeatureUnavailableError('Deleting a card stack without a chat notification requires Foundry 14 or newer')
      );
      await expect(service.deleteStack({ stackId: 'pile', chatNotification: true })).resolves.toEqual({
        stackId: 'pile',
        moved: []
      });
    });

    it('refuses an unknown stack', async () => {
      await expect(setup().service.deleteStack({ stackId: 'nope' })).rejects.toThrow(CardStackNotFoundError);
    });
  });

  describe('cards', () => {
    it('creates a card with the sheet defaults in the stack', async () => {
      const { service, world } = setup();

      const result = await service.createCard({ stackId: 'pile', draft: { name: 'Fool', type: 'base' } });

      expect(result.stackId).toBe('pile');
      expect(world.calls).toEqual([
        { method: 'createCard', args: ['pile', { name: 'Fool', type: 'base', faces: [{}], face: 0 }] }
      ]);
    });

    it('refuses an unknown card type, a face out of range, and a creation that made nothing', async () => {
      const { service, world } = setup();

      await expect(service.createCard({ stackId: 'pile', draft: { name: 'X', type: 'tarot' } })).rejects.toThrow(
        UnknownCardTypeError
      );
      await expect(service.createCard({ stackId: 'pile', draft: { name: 'X', faces: [], face: 0 } })).rejects.toThrow(
        CardFaceOutOfRangeError
      );
      world.createsNothing = true;
      await expect(service.createCard({ stackId: 'pile', draft: { name: 'X' } })).rejects.toThrow(
        CardCreationFailedError
      );
    });

    it('skips the type check when the core lists no types', async () => {
      const { service, world } = setup();
      world.cardTypes = [];

      await expect(service.createCard({ stackId: 'pile', draft: { name: 'X', type: 'tarot' } })).resolves.toBeDefined();
    });

    it('updates a card of the stack and checks the face it leaves', async () => {
      const { service, world } = setup();

      const result = await service.updateCard({ stackId: 'deck', cardId: 'a', changes: { name: 'Renamed' } });

      expect(result).toEqual({ stackId: 'deck', card: expect.objectContaining({ id: 'a', name: 'Renamed' }) as unknown });
      await expect(service.updateCard({ stackId: 'deck', cardId: 'a', changes: { face: 4 } })).rejects.toThrow(
        CardFaceOutOfRangeError
      );
      expect(world.methods()).toEqual(['updateCard']);
    });

    it('refuses to update or delete a card the stack does not have', async () => {
      const { service, world } = setup();

      await expect(service.updateCard({ stackId: 'deck', cardId: 'zz', changes: {} })).rejects.toThrow(
        new CardNotFoundError('deck', 'zz')
      );
      await expect(service.deleteCard({ stackId: 'alice', cardId: 'a' })).rejects.toThrow(CardNotFoundError);
      expect(world.methods()).toEqual([]);
    });

    it('deletes a card of the stack', async () => {
      const { service, world } = setup();

      await expect(service.deleteCard({ stackId: 'deck', cardId: 'b' })).resolves.toEqual({ stackId: 'deck', cardId: 'b' });
      expect(world.calls).toEqual([{ method: 'deleteCard', args: ['deck', 'b'] }]);
    });
  });
});
