import { ActorNotFoundError, ItemNotFoundError } from '@/systems/shared/domain/errors';
import type { RollOutcome } from '@/systems/shared/domain';
import type {
  ActivityUsedInfo,
  ItemUsePort,
  UseItemOptions,
  UseItemOutcome
} from '@/systems/dnd5e/item-actions/domain';
import type { ActivityUsageConfig, FoundryItemActionGame } from './foundryItemActionTypes';
import { resolveActivity } from './activityResolver';
import { toRollOutcomes } from './rollResultMapper';

interface MutableUseItemOutcome {
  itemId: string;
  itemName: string;
  itemType: string;
  activityUsed?: ActivityUsedInfo;
  rolls: RollOutcome[];
  chatMessageId?: string;
}

/**
 * Anti-corruption layer between the domain ItemUsePort and the Foundry dnd5e
 * activity/item API. All dnd5e use-pipeline knowledge stays quarantined here.
 */
export class Dnd5eItemUseGateway implements ItemUsePort {
  constructor(private readonly game: FoundryItemActionGame) {}

  async use(actorId: string, itemId: string, options: UseItemOptions): Promise<UseItemOutcome> {
    const actor = this.game.actors.get(actorId);
    if (!actor) {
      throw new ActorNotFoundError(actorId);
    }

    const item = actor.items.get(itemId);
    if (!item) {
      throw new ItemNotFoundError(itemId);
    }

    const activity = resolveActivity(item, {
      activityId: options.activityId,
      activityType: options.activityType
    });

    const messageConfig = { create: options.showInChat };

    if (activity) {
      const usageConfig: ActivityUsageConfig = {
        consume: options.consume ? { resources: true, spellSlot: true } : false,
        scaling: options.scaling,
        concentration: { begin: false },
        create: { measuredTemplate: false },
        event: { shiftKey: true }
      };

      const result = await activity.use(usageConfig, { configure: false }, messageConfig);

      const outcome: MutableUseItemOutcome = {
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        activityUsed: { id: activity._id, name: activity.name, type: activity.type },
        rolls: toRollOutcomes(result?.rolls)
      };
      if (result?.message) {
        outcome.chatMessageId = result.message.id;
      }
      return outcome;
    }

    const card = await item.displayCard(messageConfig);

    const outcome: MutableUseItemOutcome = {
      itemId: item.id,
      itemName: item.name,
      itemType: item.type,
      rolls: []
    };
    if (card?.id) {
      outcome.chatMessageId = card.id;
    }
    return outcome;
  }
}
