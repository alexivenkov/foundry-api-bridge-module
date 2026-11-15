import type { Pf1ApplyDamageParams, Pf1ApplyDamageResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requirePf1 } from '@/systems/pf1/shared/infrastructure';
import {
  createPf1DamageService,
  Pf1DamageGateway,
  getPf1DamageGame,
  applyDamageRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf1/damage';
import { toPf1ApplyDamageResult } from './pf1Mappers';

export async function pf1ApplyDamageHandler(params: Pf1ApplyDamageParams): Promise<Pf1ApplyDamageResult> {
  requirePf1('pf1/apply-damage');

  const parsed = applyDamageRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toApplyDamageCommand(parsed.data);
  const service = createPf1DamageService({ damage: new Pf1DamageGateway(getPf1DamageGame()) });

  return toPf1ApplyDamageResult(await service.applyDamage(command));
}
