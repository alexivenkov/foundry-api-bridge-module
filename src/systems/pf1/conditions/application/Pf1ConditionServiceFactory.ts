import type { Pf1ConditionPort } from '@/systems/pf1/conditions/domain';
import { Pf1ConditionService } from './Pf1ConditionService';

export interface Pf1ConditionServiceDependencies {
  readonly conditions: Pf1ConditionPort;
}

export function createPf1ConditionService(deps: Pf1ConditionServiceDependencies): Pf1ConditionService {
  return new Pf1ConditionService(deps.conditions);
}
