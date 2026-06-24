import { Dnd5eItemUseGateway } from '../Dnd5eItemUseGateway';
import type { FoundryItemActionGame } from '../foundryItemActionTypes';
import type { UseItemOptions } from '@/systems/dnd5e/item-actions/domain';
import { ActorNotFoundError } from '@/systems/shared/domain/errors';

const usageResult = {
  rolls: [
    {
      total: 18,
      formula: '1d20 + 5',
      terms: [{ faces: 20, number: 1, results: [{ result: 13 }] }],
      isCritical: false,
      isFumble: false
    }
  ],
  message: { id: 'msg-1' }
};

function gameWith(item: unknown): FoundryItemActionGame {
  const actor = { id: 'a1', name: 'Hero', items: { get: jest.fn().mockReturnValue(item) } };
  return { actors: { get: jest.fn().mockReturnValue(actor) } } as unknown as FoundryItemActionGame;
}

function weapon(activityUse: jest.Mock) {
  const activity = { _id: 'act-1', name: 'Attack', type: 'attack', use: activityUse };
  return {
    id: 'i1',
    name: 'Sword',
    type: 'weapon',
    system: {
      activities: {
        contents: [activity],
        get: jest.fn().mockReturnValue(activity),
        find: jest.fn().mockReturnValue(activity)
      }
    },
    displayCard: jest.fn()
  };
}

const baseOpts: UseItemOptions = {
  activityId: undefined,
  activityType: undefined,
  consume: true,
  scaling: false,
  showInChat: false
};

describe('Dnd5eItemUseGateway', () => {
  it('uses the first activity and maps activityUsed / rolls / chatMessageId', async () => {
    const use = jest.fn().mockResolvedValue(usageResult);
    const gateway = new Dnd5eItemUseGateway(gameWith(weapon(use)));

    const outcome = await gateway.use('a1', 'i1', baseOpts);

    expect(use).toHaveBeenCalledWith(
      {
        consume: { resources: true, spellSlot: true },
        scaling: false,
        concentration: { begin: false },
        create: { measuredTemplate: false },
        event: { shiftKey: true }
      },
      { configure: false },
      { create: false }
    );
    expect(outcome.activityUsed).toEqual({ id: 'act-1', name: 'Attack', type: 'attack' });
    expect(outcome.rolls).toHaveLength(1);
    expect(outcome.rolls[0]?.total).toBe(18);
    expect(outcome.chatMessageId).toBe('msg-1');
  });

  it('passes consume:false through to the usage config', async () => {
    const use = jest.fn().mockResolvedValue(usageResult);
    const gateway = new Dnd5eItemUseGateway(gameWith(weapon(use)));

    await gateway.use('a1', 'i1', { ...baseOpts, consume: false });

    expect(use).toHaveBeenCalledWith(
      expect.objectContaining({ consume: false }),
      { configure: false },
      { create: false }
    );
  });

  it('falls back to displayCard when the item has no activity', async () => {
    const item = {
      id: 'i2',
      name: 'Potion',
      type: 'consumable',
      system: {},
      displayCard: jest.fn().mockResolvedValue({ id: 'card-1' })
    };
    const gateway = new Dnd5eItemUseGateway(gameWith(item));

    const outcome = await gateway.use('a1', 'i2', baseOpts);

    expect(item.displayCard).toHaveBeenCalledWith({ create: false });
    expect(outcome.activityUsed).toBeUndefined();
    expect(outcome.rolls).toHaveLength(0);
    expect(outcome.chatMessageId).toBe('card-1');
  });

  it('handles activity.use returning null', async () => {
    const use = jest.fn().mockResolvedValue(null);
    const gateway = new Dnd5eItemUseGateway(gameWith(weapon(use)));

    const outcome = await gateway.use('a1', 'i1', baseOpts);

    expect(outcome.rolls).toHaveLength(0);
    expect(outcome.chatMessageId).toBeUndefined();
  });

  it('throws ActorNotFoundError when the actor is missing', async () => {
    const game = { actors: { get: jest.fn().mockReturnValue(undefined) } } as unknown as FoundryItemActionGame;
    await expect(new Dnd5eItemUseGateway(game).use('missing', 'i1', baseOpts)).rejects.toThrow(
      ActorNotFoundError
    );
  });

  it('throws ItemNotFoundError when the item is missing', async () => {
    const actor = { id: 'a1', name: 'Hero', items: { get: jest.fn().mockReturnValue(undefined) } };
    const game = { actors: { get: jest.fn().mockReturnValue(actor) } } as unknown as FoundryItemActionGame;
    await expect(new Dnd5eItemUseGateway(game).use('a1', 'missing', baseOpts)).rejects.toThrow(
      'Item not found: missing'
    );
  });
});
