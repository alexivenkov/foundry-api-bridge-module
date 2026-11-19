import type { Pf1ActorSummary, Pf1GetActorSummaryParams } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { getPf1Registry, requirePf1 } from '@/systems/pf1/shared/infrastructure';
import {
  createPf1SummaryService,
  Pf1SummaryGateway,
  getPf1SummaryGame,
  getSummaryRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf1/summary';
import { toPf1ActorSummary } from './pf1Mappers';

export async function pf1GetActorSummaryHandler(params: Pf1GetActorSummaryParams): Promise<Pf1ActorSummary> {
  requirePf1('pf1/get-actor-summary');

  const parsed = getSummaryRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toGetSummaryCommand(parsed.data);
  const service = createPf1SummaryService({ summary: new Pf1SummaryGateway(getPf1SummaryGame(), getPf1Registry()) });

  return toPf1ActorSummary(await service.getSummary(command));
}
