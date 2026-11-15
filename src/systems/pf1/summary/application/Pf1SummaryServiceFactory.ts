import type { Pf1SummaryPort } from '@/systems/pf1/summary/domain';
import { Pf1SummaryService } from './Pf1SummaryService';

export interface Pf1SummaryServiceDependencies {
  readonly summary: Pf1SummaryPort;
}

export function createPf1SummaryService(deps: Pf1SummaryServiceDependencies): Pf1SummaryService {
  return new Pf1SummaryService(deps.summary);
}
