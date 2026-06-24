import type { RollSaveParams, RollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import type { RollOutcome } from '@/systems/shared/domain';
import {
  createDnd5eRollService,
  Dnd5eActorRollGateway,
  rollSaveRequestSchema,
  RequestToCommandMapper,
  type FoundryRollGame
} from '@/systems/dnd5e/rolls';

declare const game: FoundryRollGame;

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

export async function rollSaveHandler(params: RollSaveParams): Promise<RollResult> {
  const parsed = rollSaveRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollSaveCommand(parsed.data);

  const gateway = new Dnd5eActorRollGateway(game);
  const service = createDnd5eRollService({ actorRoll: gateway });

  const outcome = await service.rollSave(command);
  return toRollResult(outcome);
}
