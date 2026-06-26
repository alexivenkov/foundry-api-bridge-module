import type { Pf2eRollSaveParams, RollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import type { RollOutcome } from '@/systems/shared/domain';
import { requireSystem } from '@/systems';
import {
  createPf2eRollService,
  Pf2eActorRollGateway,
  getPf2eRollGame,
  rollSaveRequestSchema,
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

export async function pf2eRollSaveHandler(params: Pf2eRollSaveParams): Promise<RollResult> {
  requireSystem('pf2e', 'pf2e/roll-save');

  const parsed = rollSaveRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollSaveCommand(parsed.data);

  const gateway = new Pf2eActorRollGateway(getPf2eRollGame());
  const service = createPf2eRollService({ actorRoll: gateway });

  const outcome = await service.rollSave(command);
  return toRollResult(outcome);
}
