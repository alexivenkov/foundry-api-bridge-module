import type { RollStrikeParams, RollResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createPf2eStrikeService,
  Pf2eStrikeGateway,
  getPf2eStrikeGame,
  rollStrikeRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf2e/strikes';
import { toRollResult } from './strikeMappers';

export async function pf2eRollStrikeHandler(params: RollStrikeParams): Promise<RollResult> {
  requireSystem('pf2e', 'pf2e/roll-strike');

  const parsed = rollStrikeRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollStrikeCommand(parsed.data);

  const gateway = new Pf2eStrikeGateway(getPf2eStrikeGame());
  const service = createPf2eStrikeService({ strikes: gateway });

  const outcome = await service.rollStrike(command);
  return toRollResult(outcome);
}
