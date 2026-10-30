import type { Coc7ApplyDamageParams, Coc7ApplyDamageResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createCoc7DamageService,
  Coc7DamageGateway,
  getCoc7DamageGame,
  applyDamageRequestSchema,
  RequestToCommandMapper
} from '@/systems/coc7/damage';
import { toCoc7ApplyDamageResult } from './coc7Mappers';

export async function coc7ApplyDamageHandler(params: Coc7ApplyDamageParams): Promise<Coc7ApplyDamageResult> {
  requireSystem('CoC7', 'coc7/apply-damage');

  const parsed = applyDamageRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toApplyDamageCommand(parsed.data);
  const service = createCoc7DamageService({ damage: new Coc7DamageGateway(getCoc7DamageGame()) });

  return toCoc7ApplyDamageResult(await service.applyDamage(command));
}
