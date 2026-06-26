import { Pf2eItemUseGateway } from '../Pf2eItemUseGateway';
import type {
  FoundryItemUseActor,
  FoundryPf2eItemUseGame,
  FoundryUsableItem
} from '../foundryPf2eItemUseTypes';
import {
  ActorNotFoundError,
  ItemNotFoundError,
  ValidationError
} from '@/systems/shared/domain/errors';

function createGame(actor: FoundryItemUseActor | undefined, itemsAfter?: Map<string, FoundryUsableItem>): {
  game: FoundryPf2eItemUseGame;
} {
  const game = {
    actors: { get: jest.fn().mockReturnValue(actor) }
  } as unknown as FoundryPf2eItemUseGame;
  if (actor && itemsAfter) {
    (actor.items.get as jest.Mock).mockImplementation((id: string) => itemsAfter.get(id));
  }
  return { game };
}

function actorWith(item: FoundryUsableItem): FoundryItemUseActor {
  return {
    id: 'a1',
    name: 'Hero',
    items: { get: jest.fn().mockReturnValue(item) }
  } as unknown as FoundryItemUseActor;
}

describe('Pf2eItemUseGateway', () => {
  it('consumes a consumable and reports remaining uses/quantity', async () => {
    const consume = jest.fn().mockResolvedValue(undefined);
    const before: FoundryUsableItem = {
      id: 'potion',
      name: 'Healing Potion',
      type: 'consumable',
      quantity: 2,
      system: { uses: { value: 1, max: 1 } },
      consume
    };
    const after: FoundryUsableItem = { ...before, quantity: 1, system: { uses: { value: 1, max: 1 } } };
    const actor = actorWith(before);
    (actor.items.get as jest.Mock).mockReturnValueOnce(before).mockReturnValue(after);
    const gateway = new Pf2eItemUseGateway(createGame(actor).game);

    const outcome = await gateway.useConsumable('a1', 'potion', 1);

    expect(consume).toHaveBeenCalledWith(1);
    expect(outcome).toEqual({
      itemId: 'potion',
      itemName: 'Healing Potion',
      consumed: true,
      remainingUses: 1,
      remainingQuantity: 1
    });
  });

  it('rejects using a non-consumable as a consumable', async () => {
    const actor = actorWith({ id: 'sword', name: 'Sword', type: 'weapon' });
    const gateway = new Pf2eItemUseGateway(createGame(actor).game);

    await expect(gateway.useConsumable('a1', 'sword', 1)).rejects.toThrow(ValidationError);
  });

  it('casts a spell via its spellcasting entry', async () => {
    const cast = jest.fn().mockResolvedValue(undefined);
    const spell: FoundryUsableItem = {
      id: 'fireball',
      name: 'Fireball',
      type: 'spell',
      rank: 3,
      spellcasting: { cast }
    };
    const actor = actorWith(spell);
    const gateway = new Pf2eItemUseGateway(createGame(actor).game);

    const outcome = await gateway.castSpell('a1', 'fireball', 5, { showInChat: true });

    expect(cast).toHaveBeenCalledWith(spell, { message: true, rank: 5 });
    expect(outcome).toEqual({ spellId: 'fireball', spellName: 'Fireball', rank: 5, cast: true });
  });

  it('defaults the cast rank to the spell rank', async () => {
    const cast = jest.fn().mockResolvedValue(undefined);
    const spell: FoundryUsableItem = {
      id: 'magic-missile',
      name: 'Magic Missile',
      type: 'spell',
      rank: 1,
      spellcasting: { cast }
    };
    const actor = actorWith(spell);
    const gateway = new Pf2eItemUseGateway(createGame(actor).game);

    const outcome = await gateway.castSpell('a1', 'magic-missile', undefined, { showInChat: false });

    expect(cast).toHaveBeenCalledWith(spell, { message: false });
    expect(outcome.rank).toBe(1);
  });

  it('rejects casting a spell with no spellcasting entry', async () => {
    const actor = actorWith({ id: 'orphan', name: 'Orphan Spell', type: 'spell', rank: 2, spellcasting: null });
    const gateway = new Pf2eItemUseGateway(createGame(actor).game);

    await expect(
      gateway.castSpell('a1', 'orphan', undefined, { showInChat: false })
    ).rejects.toThrow('Spell orphan has no spellcasting entry');
  });

  it('posts an item to chat and returns the message id', async () => {
    const toMessage = jest.fn().mockResolvedValue({ id: 'msg-1' });
    const actor = actorWith({ id: 'wand', name: 'Wand', type: 'equipment', toMessage });
    const gateway = new Pf2eItemUseGateway(createGame(actor).game);

    const outcome = await gateway.postItem('a1', 'wand', { showInChat: true });

    expect(toMessage).toHaveBeenCalledWith(null, { create: true });
    expect(outcome).toEqual({
      itemId: 'wand',
      itemName: 'Wand',
      itemType: 'equipment',
      posted: true,
      chatMessageId: 'msg-1'
    });
  });

  it('throws ItemNotFoundError when the item is missing', async () => {
    const actor = { id: 'a1', name: 'Hero', items: { get: jest.fn().mockReturnValue(undefined) } } as unknown as FoundryItemUseActor;
    const gateway = new Pf2eItemUseGateway(createGame(actor).game);

    await expect(gateway.useConsumable('a1', 'missing', 1)).rejects.toThrow(ItemNotFoundError);
  });

  it('throws ActorNotFoundError when the actor is missing', async () => {
    const gateway = new Pf2eItemUseGateway(createGame(undefined).game);

    await expect(gateway.postItem('missing', 'x', { showInChat: true })).rejects.toThrow(ActorNotFoundError);
  });
});
