import { ActorNotFoundError, ItemNotFoundError } from '@/systems/shared/domain/errors';
import type { RollOutcome } from '@/systems/shared/domain';
import type {
  ActivateItemOptions,
  ActivationUseOutcome,
  ActivityUsedInfo,
  ItemActivationPort,
  TemplatePosition
} from '@/systems/dnd5e/item-actions/domain';
import type { ActivityUsageConfig, FoundryUsageResult } from './foundryItemActionTypes';
import { getGame, getCanvas, getDnd5eCanvas } from './foundryItemActionTypes';
import { resolveActivity } from './activityResolver';
import { toRollOutcomes } from './rollResultMapper';

interface MutableActivationUseOutcome {
  itemId: string;
  itemName: string;
  itemType: string;
  activityUsed?: ActivityUsedInfo;
  rolls: RollOutcome[];
  chatMessageId?: string;
}

/**
 * Monkeypatches dnd5e's AbilityTemplate.drawPreview so the next template draw
 * auto-places at `position` (and restores the prototype). Infra-only — a hack
 * against the dnd5e use-pipeline, intentionally not modelled as a domain port.
 */
function setupAutoTemplatePlace(position: TemplatePosition): void {
  const dnd5eCanvas = getDnd5eCanvas();
  if (!dnd5eCanvas) {
    return;
  }

  const canvas = getCanvas();
  const AbilityTemplate = dnd5eCanvas.AbilityTemplate;
  const origDrawPreview = AbilityTemplate.prototype.drawPreview;

  AbilityTemplate.prototype.drawPreview = async function (this: {
    document: {
      toObject(): Record<string, unknown>;
      updateSource(data: Record<string, unknown>): void;
    };
  }): Promise<unknown> {
    const update: Record<string, unknown> = { x: position.x, y: position.y };
    if (position.direction !== undefined) {
      update['direction'] = position.direction;
    }
    this.document.updateSource(update);
    const data = this.document.toObject();
    AbilityTemplate.prototype.drawPreview = origDrawPreview;
    return canvas.scene?.createEmbeddedDocuments('MeasuredTemplate', [data]);
  };
}

/**
 * Anti-corruption layer for the native item-activation pipeline (activity.use
 * / item.use), including the AoE template auto-placement hack.
 */
export class Dnd5eItemActivationGateway implements ItemActivationPort {
  async activate(
    actorId: string,
    itemId: string,
    options: ActivateItemOptions
  ): Promise<ActivationUseOutcome> {
    const game = getGame();
    const actor = game.actors.get(actorId);
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

    if (options.templatePosition) {
      setupAutoTemplatePlace(options.templatePosition);
    }

    const usageConfig: ActivityUsageConfig = {};
    if (!options.templatePosition) {
      usageConfig.create = { measuredTemplate: false };
    }
    if (options.spellLevel !== undefined) {
      usageConfig.spell = { slot: `spell${String(options.spellLevel)}` };
    }
    const config = Object.keys(usageConfig).length > 0 ? usageConfig : undefined;

    const useResult: FoundryUsageResult | null = activity
      ? await activity.use(config)
      : await item.use(config);

    const outcome: MutableActivationUseOutcome = {
      itemId: item.id,
      itemName: item.name,
      itemType: item.type,
      rolls: toRollOutcomes(useResult?.rolls)
    };
    if (activity) {
      outcome.activityUsed = { id: activity._id, name: activity.name, type: activity.type };
    }
    if (useResult?.message) {
      outcome.chatMessageId = useResult.message.id;
    }
    return outcome;
  }
}
