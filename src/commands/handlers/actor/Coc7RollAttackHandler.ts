import type { Coc7AttackRollResult, Coc7RollAttackParams } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createCoc7AttackService,
  Coc7AttackGateway,
  getCoc7AttackGame,
  rollAttackRequestSchema,
  RequestToCommandMapper
} from '@/systems/coc7/attacks';
import { toCoc7AttackRollResult } from './coc7Mappers';

export async function coc7RollAttackHandler(params: Coc7RollAttackParams): Promise<Coc7AttackRollResult> {
  requireSystem('CoC7', 'coc7/roll-attack');

  const parsed = rollAttackRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollAttackCommand(parsed.data);
  const service = createCoc7AttackService({ attacks: new Coc7AttackGateway(getCoc7AttackGame()) });

  return toCoc7AttackRollResult(await service.rollAttack(command));
}
