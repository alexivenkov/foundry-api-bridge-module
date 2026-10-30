import type { Coc7DamageRollResult, Coc7RollDamageParams } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createCoc7AttackService,
  Coc7AttackGateway,
  getCoc7AttackGame,
  rollDamageRequestSchema,
  RequestToCommandMapper
} from '@/systems/coc7/attacks';
import { toCoc7DamageRollResult } from './coc7Mappers';

export async function coc7RollDamageHandler(params: Coc7RollDamageParams): Promise<Coc7DamageRollResult> {
  requireSystem('CoC7', 'coc7/roll-damage');

  const parsed = rollDamageRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollDamageCommand(parsed.data);
  const service = createCoc7AttackService({ attacks: new Coc7AttackGateway(getCoc7AttackGame()) });

  return toCoc7DamageRollResult(await service.rollDamage(command));
}
