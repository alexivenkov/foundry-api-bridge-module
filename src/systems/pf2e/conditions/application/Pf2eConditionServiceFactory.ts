import type { Pf2eConditionPort } from '@/systems/pf2e/conditions/domain';
import { Pf2eConditionService } from './Pf2eConditionService';

export interface Pf2eConditionServiceDependencies {
  readonly conditions: Pf2eConditionPort;
}

export function createPf2eConditionService(
  deps: Pf2eConditionServiceDependencies
): Pf2eConditionService {
  return new Pf2eConditionService(deps.conditions);
}
