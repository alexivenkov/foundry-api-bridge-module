import type { SwadeRollSkillParams, SwadeTraitRollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createSwadeRollService,
  SwadeRollGateway,
  getSwadeRollGame,
  rollSkillRequestSchema,
  RequestToCommandMapper
} from '@/systems/swade/rolls';
import { toSwadeTraitRollResult } from './swadeMappers';

export async function swadeRollSkillHandler(params: SwadeRollSkillParams): Promise<SwadeTraitRollResult> {
  requireSystem('swade', 'swade/roll-skill');

  const parsed = rollSkillRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollSkillCommand(parsed.data);
  const service = createSwadeRollService({ rolls: new SwadeRollGateway(getSwadeRollGame()) });

  return toSwadeTraitRollResult(await service.rollSkill(command));
}
