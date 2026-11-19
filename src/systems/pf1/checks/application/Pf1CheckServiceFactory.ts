import type { Pf1CheckPort } from '@/systems/pf1/checks/domain';
import { Pf1CheckService } from './Pf1CheckService';

export interface Pf1CheckServiceDependencies {
  readonly checks: Pf1CheckPort;
}

export function createPf1CheckService(deps: Pf1CheckServiceDependencies): Pf1CheckService {
  return new Pf1CheckService(deps.checks);
}
