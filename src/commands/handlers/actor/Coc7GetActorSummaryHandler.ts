import type { Coc7ActorSummary, Coc7GetActorSummaryParams } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createCoc7SummaryService,
  Coc7SummaryGateway,
  getCoc7SummaryGame,
  getActorSummaryRequestSchema,
  RequestToCommandMapper
} from '@/systems/coc7/summary';
import { toCoc7ActorSummary } from './coc7Mappers';

export async function coc7GetActorSummaryHandler(params: Coc7GetActorSummaryParams): Promise<Coc7ActorSummary> {
  requireSystem('CoC7', 'coc7/get-actor-summary');

  const parsed = getActorSummaryRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toGetActorSummaryCommand(parsed.data);
  const service = createCoc7SummaryService({ summaries: new Coc7SummaryGateway(getCoc7SummaryGame()) });

  return toCoc7ActorSummary(await service.getSummary(command));
}
