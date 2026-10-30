import type { Coc7CheckPort } from '@/systems/coc7/checks/domain';
import { Coc7CheckService } from './Coc7CheckService';

export interface Coc7CheckServiceDependencies {
  readonly checks: Coc7CheckPort;
}

export function createCoc7CheckService(deps: Coc7CheckServiceDependencies): Coc7CheckService {
  return new Coc7CheckService(deps.checks);
}
