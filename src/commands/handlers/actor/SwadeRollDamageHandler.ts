import type { SwadeRollDamageParams, SwadeDamageRollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createSwadeRollService,
  SwadeRollGateway,
  getSwadeRollGame,
  rollDamageRequestSchema,
  RequestToCommandMapper
} from '@/systems/swade/rolls';
import { toSwadeDamageRollResult } from './swadeMappers';

export async function swadeRollDamageHandler(params: SwadeRollDamageParams): Promise<SwadeDamageRollResult> {
  requireSystem('swade', 'swade/roll-damage');

  const parsed = rollDamageRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollDamageCommand(parsed.data);
  const service = createSwadeRollService({ rolls: new SwadeRollGateway(getSwadeRollGame()) });

  return toSwadeDamageRollResult(await service.rollDamage(command));
}
