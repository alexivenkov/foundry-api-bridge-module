import type { Pf1CheckResult, Pf1RollSkillParams } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requirePf1 } from '@/systems/pf1/shared/infrastructure';
import {
  createPf1CheckService,
  Pf1CheckGateway,
  getPf1CheckGame,
  rollSkillRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf1/checks';
import { toPf1CheckResult } from './pf1Mappers';

export async function pf1RollSkillHandler(params: Pf1RollSkillParams): Promise<Pf1CheckResult> {
  requirePf1('pf1/roll-skill');

  const parsed = rollSkillRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollSkillCommand(parsed.data);
  const service = createPf1CheckService({ checks: new Pf1CheckGateway(getPf1CheckGame()) });

  return toPf1CheckResult(await service.rollSkill(command));
}
