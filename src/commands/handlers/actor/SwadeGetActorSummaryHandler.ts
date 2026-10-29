import type { SwadeGetActorSummaryParams, SwadeActorSummary } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createSwadeSummaryService,
  SwadeSummaryGateway,
  getSwadeSummaryGame,
  getActorSummaryRequestSchema,
  RequestToCommandMapper
} from '@/systems/swade/summary';
import { toSwadeActorSummary } from './swadeMappers';

export async function swadeGetActorSummaryHandler(params: SwadeGetActorSummaryParams): Promise<SwadeActorSummary> {
  requireSystem('swade', 'swade/get-actor-summary');

  const parsed = getActorSummaryRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toGetActorSummaryCommand(parsed.data);
  const service = createSwadeSummaryService({ summaries: new SwadeSummaryGateway(getSwadeSummaryGame()) });

  return toSwadeActorSummary(await service.getSummary(command));
}
