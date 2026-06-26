import type { RollPerceptionParams, RollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import type { RollOutcome } from '@/systems/shared/domain';
import { requireSystem } from '@/systems';
import {
  createPf2eRollService,
  Pf2eActorRollGateway,
  getPf2eRollGame,
  rollPerceptionRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf2e/rolls';

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

export async function pf2eRollPerceptionHandler(params: RollPerceptionParams): Promise<RollResult> {
  requireSystem('pf2e', 'pf2e/roll-perception');

  const parsed = rollPerceptionRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollPerceptionCommand(parsed.data);

  const gateway = new Pf2eActorRollGateway(getPf2eRollGame());
  const service = createPf2eRollService({ actorRoll: gateway });

  const outcome = await service.rollPerception(command);
  return toRollResult(outcome);
}
