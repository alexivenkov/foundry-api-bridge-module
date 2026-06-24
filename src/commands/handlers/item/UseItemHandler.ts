import type { UseItemParams, UseItemResult, RollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import type { RollOutcome } from '@/systems/shared/domain';
import {
  createDnd5eItemUseService,
  Dnd5eItemUseGateway,
  useItemRequestSchema,
  RequestToCommandMapper,
  type FoundryItemActionGame,
  type UseItemOutcome
} from '@/systems/dnd5e/item-actions';

declare const game: FoundryItemActionGame;

function toRollResult(outcome: RollOutcome): RollResult {
  const result: RollResult = {
    total: outcome.total,
    formula: outcome.formula,
    dice: outcome.dice.map((d) => ({
      type: d.type,
      count: d.count,
      results: [...d.results]
    }))
  };

  if (outcome.isCritical) {
    result.isCritical = true;
  }
  if (outcome.isFumble) {
    result.isFumble = true;
  }

  return result;
}

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

export async function useItemHandler(params: UseItemParams): Promise<UseItemResult> {
  const parsed = useItemRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toUseItemCommand(parsed.data);

  const gateway = new Dnd5eItemUseGateway(game);
  const service = createDnd5eItemUseService({ itemUse: gateway });

  const outcome = await service.useItem(command);
  return toUseItemResult(outcome);
}
