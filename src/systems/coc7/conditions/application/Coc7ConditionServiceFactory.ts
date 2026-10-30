import type { Coc7ConditionPort } from '@/systems/coc7/conditions/domain';
import { Coc7ConditionService } from './Coc7ConditionService';

export interface Coc7ConditionServiceDependencies {
  readonly conditions: Coc7ConditionPort;
}

export function createCoc7ConditionService(deps: Coc7ConditionServiceDependencies): Coc7ConditionService {
  return new Coc7ConditionService(deps.conditions);
}
