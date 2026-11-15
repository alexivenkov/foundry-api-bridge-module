import { toActorTarget } from '@/systems/pf1/shared/validation';
import type { GetSummaryCommand } from '@/systems/pf1/summary/application';
import type { GetSummaryRequest } from './SummaryRequestSchema';

export const RequestToCommandMapper = {
  toGetSummaryCommand(request: GetSummaryRequest): GetSummaryCommand {
    return { target: toActorTarget(request) };
  }
};
