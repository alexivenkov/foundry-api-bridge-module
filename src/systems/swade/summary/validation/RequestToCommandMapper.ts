import { toActorTarget } from '@/systems/swade/shared/validation';
import type { GetActorSummaryCommand } from '@/systems/swade/summary/application';
import type { GetActorSummaryRequest } from './SummaryRequestSchema';

export const RequestToCommandMapper = {
  toGetActorSummaryCommand(request: GetActorSummaryRequest): GetActorSummaryCommand {
    return { target: toActorTarget(request) };
  }
};
