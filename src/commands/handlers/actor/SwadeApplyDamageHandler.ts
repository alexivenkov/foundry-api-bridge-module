import type { SwadeApplyDamageParams, SwadeApplyDamageResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createSwadeDamageService,
  SwadeDamageGateway,
  getSwadeDamageGame,
  applyDamageRequestSchema,
  RequestToCommandMapper
} from '@/systems/swade/damage';
import { toSwadeApplyDamageResult } from './swadeMappers';

export async function swadeApplyDamageHandler(params: SwadeApplyDamageParams): Promise<SwadeApplyDamageResult> {
  requireSystem('swade', 'swade/apply-damage');

  const parsed = applyDamageRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toApplyDamageCommand(parsed.data);
  const service = createSwadeDamageService({ damage: new SwadeDamageGateway(getSwadeDamageGame()) });

  return toSwadeApplyDamageResult(await service.applyDamage(command));
}
