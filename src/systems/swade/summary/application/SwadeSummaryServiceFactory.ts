import type { SwadeSummaryPort } from '@/systems/swade/summary/domain';
import { SwadeSummaryService } from './SwadeSummaryService';

export interface SwadeSummaryServiceDependencies {
  readonly summaries: SwadeSummaryPort;
}

export function createSwadeSummaryService(deps: SwadeSummaryServiceDependencies): SwadeSummaryService {
  return new SwadeSummaryService(deps.summaries);
}
