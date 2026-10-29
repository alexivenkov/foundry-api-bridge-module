import type { SwadeRollAttackParams, SwadeAttackRollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createSwadeRollService,
  SwadeRollGateway,
  getSwadeRollGame,
  rollAttackRequestSchema,
  RequestToCommandMapper
} from '@/systems/swade/rolls';
import { toSwadeAttackRollResult } from './swadeMappers';

export async function swadeRollAttackHandler(params: SwadeRollAttackParams): Promise<SwadeAttackRollResult> {
  requireSystem('swade', 'swade/roll-attack');

  const parsed = rollAttackRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollAttackCommand(parsed.data);
  const service = createSwadeRollService({ rolls: new SwadeRollGateway(getSwadeRollGame()) });

  return toSwadeAttackRollResult(await service.rollAttack(command));
}
