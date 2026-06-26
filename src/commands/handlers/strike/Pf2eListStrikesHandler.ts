import type { ListStrikesParams, StrikeListResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createPf2eStrikeService,
  Pf2eStrikeGateway,
  getPf2eStrikeGame,
  listStrikesRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf2e/strikes';
import { toStrikeListResult } from './strikeMappers';

export async function pf2eListStrikesHandler(params: ListStrikesParams): Promise<StrikeListResult> {
  requireSystem('pf2e', 'pf2e/list-strikes');

  const parsed = listStrikesRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toListStrikesCommand(parsed.data);

  const gateway = new Pf2eStrikeGateway(getPf2eStrikeGame());
  const service = createPf2eStrikeService({ strikes: gateway });

  const outcome = await service.listStrikes(command);
  return toStrikeListResult(outcome);
}
