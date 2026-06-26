import type { RollAttackParams, RollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import type { RollOutcome } from '@/systems/shared/domain';
import { requireSystem } from '@/systems';
import {
  createDnd5eItemRollService,
  Dnd5eItemRollGateway,
  rollAttackRequestSchema,
  RequestToCommandMapper,
  type FoundryItemRollGame
} from '@/systems/dnd5e/item-rolls';

declare const game: FoundryItemRollGame;

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

export async function rollAttackHandler(params: RollAttackParams): Promise<RollResult> {
  requireSystem('dnd5e', 'dnd5e/roll-attack');

  const parsed = rollAttackRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollAttackCommand(parsed.data);

  const gateway = new Dnd5eItemRollGateway(game);
  const service = createDnd5eItemRollService({ itemRoll: gateway });

  const outcome = await service.rollAttack(command);
  return toRollResult(outcome);
}
