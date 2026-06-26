import type { RollDamageParams, RollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import type { RollOutcome } from '@/systems/shared/domain';
import { requireSystem } from '@/systems';
import {
  createDnd5eItemRollService,
  Dnd5eItemRollGateway,
  rollDamageRequestSchema,
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

export async function rollDamageHandler(params: RollDamageParams): Promise<RollResult> {
  requireSystem('dnd5e', 'dnd5e/roll-damage');

  const parsed = rollDamageRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollDamageCommand(parsed.data);

  const gateway = new Dnd5eItemRollGateway(game);
  const service = createDnd5eItemRollService({ itemRoll: gateway });

  const outcome = await service.rollDamage(command);
  const result = toRollResult(outcome);

  // Damage crit is decided by the request flag, not the Foundry damage roll.
  if (command.critical) {
    result.isCritical = true;
  }

  return result;
}
