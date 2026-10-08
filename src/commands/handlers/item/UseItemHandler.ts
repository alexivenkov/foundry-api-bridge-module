import type { UseItemParams, UseItemResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createDnd5eItemUseService,
  Dnd5eItemUseGateway,
  useItemRequestSchema,
  RequestToCommandMapper,
  type FoundryItemActionGame,
  type ItemActivationOutcome,
  type UseItemCommand,
  type UseItemOutcome
} from '@/systems/dnd5e/item-actions';
import { createActivationService, toAppliedHitPointsResult, toRollResult } from './ActivateItemHandler';

declare const game: FoundryItemActionGame;

function toUseItemResult(outcome: UseItemOutcome): UseItemResult {
  const result: UseItemResult = {
    itemId: outcome.itemId,
    itemName: outcome.itemName,
    itemType: outcome.itemType,
    rolls: outcome.rolls.map(toRollResult)
  };

  if (outcome.activityUsed) {
    result.activityUsed = {
      id: outcome.activityUsed.id,
      name: outcome.activityUsed.name,
      type: outcome.activityUsed.type
    };
  }
  if (outcome.chatMessageId !== undefined) {
    result.chatMessageId = outcome.chatMessageId;
  }

  return result;
}

function activationToUseItemResult(outcome: ItemActivationOutcome): UseItemResult {
  const result: UseItemResult = {
    itemId: outcome.itemId,
    itemName: outcome.itemName,
    itemType: outcome.itemType,
    rolls: outcome.rolls.map(toRollResult),
    status: outcome.status
  };
  if (outcome.activityUsed) {
    result.activityUsed = { ...outcome.activityUsed };
  }
  if (outcome.chatMessageId !== undefined) {
    result.chatMessageId = outcome.chatMessageId;
  }
  if (outcome.dialog !== undefined) {
    result.dialog = outcome.dialog;
  }
  if (outcome.warning !== undefined) {
    result.warning = outcome.warning;
  }
  if (outcome.appliedHealing) {
    result.appliedHealing = toAppliedHitPointsResult(outcome.appliedHealing);
  }
  return result;
}

// A self-targeted heal (Second Wind, Lay on Hands on yourself) only rolls and
// lands through the activation pipeline; use() alone posts a card with a
// button nobody clicks.
async function useAsSelfHeal(command: UseItemCommand): Promise<UseItemResult> {
  const outcome = await createActivationService().activate({
    actorId: command.actorId,
    itemId: command.itemId,
    activityId: command.activityId,
    activityType: command.activityType,
    targetTokenIds: [],
    templatePosition: undefined,
    spellLevel: undefined,
    attackerTokenId: undefined,
    attackMode: undefined,
    ammunition: undefined,
    consume: command.consume ? undefined : { spellSlot: false, itemUses: false },
    fastForward: true,
    advantage: false,
    disadvantage: false,
    attackBonus: undefined,
    damageBonus: undefined,
    targetAcBonus: undefined
  });
  return activationToUseItemResult(outcome);
}

export async function useItemHandler(params: UseItemParams): Promise<UseItemResult> {
  requireSystem('dnd5e', 'dnd5e/use-item');

  const parsed = useItemRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toUseItemCommand(parsed.data);

  const gateway = new Dnd5eItemUseGateway(game);
  const activity = gateway.describeActivity(command.actorId, command.itemId, {
    activityId: command.activityId,
    activityType: command.activityType
  });
  if (activity?.type === 'heal' && activity.affectsSelf) {
    return useAsSelfHeal(command);
  }

  const service = createDnd5eItemUseService({ itemUse: gateway });
  const outcome = await service.useItem(command);
  return toUseItemResult(outcome);
}
