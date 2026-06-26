import type { RollSkillParams, RollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import type { RollOutcome } from '@/systems/shared/domain';
import { requireSystem } from '@/systems';
import {
  createDnd5eRollService,
  Dnd5eActorRollGateway,
  getDnd5eRollGame,
  rollSkillRequestSchema,
  RequestToCommandMapper
} from '@/systems/dnd5e/rolls';

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

export async function dnd5eRollSkillHandler(params: RollSkillParams): Promise<RollResult> {
  requireSystem('dnd5e', 'dnd5e/roll-skill');

  const parsed = rollSkillRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollSkillCommand(parsed.data);

  const gateway = new Dnd5eActorRollGateway(getDnd5eRollGame());
  const service = createDnd5eRollService({ actorRoll: gateway });

  const outcome = await service.rollSkill(command);
  return toRollResult(outcome);
}
