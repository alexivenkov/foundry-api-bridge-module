import { toActorTarget } from '@/systems/coc7/shared/validation';
import type { GetActorSummaryCommand } from '@/systems/coc7/summary/application';
import type { GetActorSummaryRequest } from './SummaryRequestSchema';

export const RequestToCommandMapper = {
  toGetActorSummaryCommand(request: GetActorSummaryRequest): GetActorSummaryCommand {
    return { target: toActorTarget(request) };
  }
};
