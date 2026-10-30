import type { Coc7SummaryPort } from '@/systems/coc7/summary/domain';
import { Coc7SummaryService } from './Coc7SummaryService';

export interface Coc7SummaryServiceDependencies {
  readonly summaries: Coc7SummaryPort;
}

export function createCoc7SummaryService(deps: Coc7SummaryServiceDependencies): Coc7SummaryService {
  return new Coc7SummaryService(deps.summaries);
}
