import { resolveAttackActivity } from '../attackActivityResolver';
import type { FoundryItemRollGame } from '../foundryItemRollTypes';
import {
  ActorNotFoundError,
  ItemNotFoundError
} from '@/systems/shared/domain/errors';

const attackActivity = { _id: 'a1', type: 'attack', rollAttack: jest.fn(), rollDamage: jest.fn() };

function gameReturning(actor: unknown): FoundryItemRollGame {
  return { actors: { get: jest.fn().mockReturnValue(actor) } } as unknown as FoundryItemRollGame;
}

function actorWithItem(item: unknown) {
  return { id: 'actor-1', name: 'Hero', items: { get: jest.fn().mockReturnValue(item) } };
}

describe('resolveAttackActivity', () => {
  it('returns the attack activity for a valid item', () => {
    const item = {
      id: 'item-1',
      name: 'Sword',
      type: 'weapon',
      system: { activities: { find: jest.fn().mockReturnValue(attackActivity) } }
    };
    const game = gameReturning(actorWithItem(item));

    expect(resolveAttackActivity(game, 'actor-1', 'item-1')).toBe(attackActivity);
  });

  it('throws ActorNotFoundError when the actor is missing', () => {
    const game = gameReturning(undefined);
    expect(() => resolveAttackActivity(game, 'missing', 'item-1')).toThrow(ActorNotFoundError);
    expect(() => resolveAttackActivity(game, 'missing', 'item-1')).toThrow('Actor not found: missing');
  });

  it('throws ItemNotFoundError when the item is missing', () => {
    const game = gameReturning(actorWithItem(undefined));
    expect(() => resolveAttackActivity(game, 'actor-1', 'missing')).toThrow(ItemNotFoundError);
    expect(() => resolveAttackActivity(game, 'actor-1', 'missing')).toThrow('Item not found: missing');
  });

  it('throws when the item has no activities', () => {
    const item = { id: 'item-1', name: 'Broken', type: 'weapon', system: {} };
    const game = gameReturning(actorWithItem(item));
    expect(() => resolveAttackActivity(game, 'actor-1', 'item-1')).toThrow('Item has no activities: Broken');
  });

  it('throws when the item has no attack activity', () => {
    const item = {
      id: 'item-1',
      name: 'Wand',
      type: 'weapon',
      system: { activities: { find: jest.fn().mockReturnValue(undefined) } }
    };
    const game = gameReturning(actorWithItem(item));
    expect(() => resolveAttackActivity(game, 'actor-1', 'item-1')).toThrow('Item has no attack activity: Wand');
  });
});
