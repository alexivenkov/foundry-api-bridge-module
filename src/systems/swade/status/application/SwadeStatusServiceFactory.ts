import type { SwadeStatusPort } from '@/systems/swade/status/domain';
import { SwadeStatusService } from './SwadeStatusService';

export interface SwadeStatusServiceDependencies {
  readonly statuses: SwadeStatusPort;
}

export function createSwadeStatusService(deps: SwadeStatusServiceDependencies): SwadeStatusService {
  return new SwadeStatusService(deps.statuses);
}
