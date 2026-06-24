import {
  ActorNotFoundError,
  ItemNotFoundError,
  ActivityResolutionError
} from '@/systems/shared/domain/errors';
import type { FoundryAttackActivity, FoundryItemRollGame } from './foundryItemRollTypes';

/**
 * Resolves an item's 'attack' activity from the Foundry dnd5e model.
 * Shared by attack and damage rolls — the single source of truth for these
 * resolution error messages.
 */
export function resolveAttackActivity(
  game: FoundryItemRollGame,
  actorId: string,
  itemId: string
): FoundryAttackActivity {
  const actor = game.actors.get(actorId);
  if (!actor) {
    throw new ActorNotFoundError(actorId);
  }

  const item = actor.items.get(itemId);
  if (!item) {
    throw new ItemNotFoundError(itemId);
  }

  if (!item.system.activities) {
    throw new ActivityResolutionError(`Item has no activities: ${item.name}`);
  }

  const activity = item.system.activities.find((a) => a.type === 'attack');
  if (!activity) {
    throw new ActivityResolutionError(`Item has no attack activity: ${item.name}`);
  }

  return activity;
}
