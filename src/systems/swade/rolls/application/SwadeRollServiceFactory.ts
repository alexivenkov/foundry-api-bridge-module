import type { SwadeRollPort } from '@/systems/swade/rolls/domain';
import { SwadeRollService } from './SwadeRollService';

export interface SwadeRollServiceDependencies {
  readonly rolls: SwadeRollPort;
}

export function createSwadeRollService(deps: SwadeRollServiceDependencies): SwadeRollService {
  return new SwadeRollService(deps.rolls);
}
