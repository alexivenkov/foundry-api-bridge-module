import type { RollStrikeDamageParams, RollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createPf2eStrikeService,
  Pf2eStrikeGateway,
  getPf2eStrikeGame,
  rollStrikeDamageRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf2e/strikes';
import { toRollResult } from './strikeMappers';

export async function pf2eRollStrikeDamageHandler(
  params: RollStrikeDamageParams
): Promise<RollResult> {
  requireSystem('pf2e', 'pf2e/roll-strike-damage');

  const parsed = rollStrikeDamageRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollStrikeDamageCommand(parsed.data);

  const gateway = new Pf2eStrikeGateway(getPf2eStrikeGame());
  const service = createPf2eStrikeService({ strikes: gateway });

  const outcome = await service.rollStrikeDamage(command);
  return toRollResult(outcome);
}
