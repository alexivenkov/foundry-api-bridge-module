import type { SwadeRollAttributeParams, SwadeTraitRollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createSwadeRollService,
  SwadeRollGateway,
  getSwadeRollGame,
  rollAttributeRequestSchema,
  RequestToCommandMapper
} from '@/systems/swade/rolls';
import { toSwadeTraitRollResult } from './swadeMappers';

export async function swadeRollAttributeHandler(params: SwadeRollAttributeParams): Promise<SwadeTraitRollResult> {
  requireSystem('swade', 'swade/roll-attribute');

  const parsed = rollAttributeRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollAttributeCommand(parsed.data);
  const service = createSwadeRollService({ rolls: new SwadeRollGateway(getSwadeRollGame()) });

  return toSwadeTraitRollResult(await service.rollAttribute(command));
}
