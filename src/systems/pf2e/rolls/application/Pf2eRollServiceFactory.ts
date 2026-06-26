import type { Pf2eActorRollPort } from '@/systems/pf2e/rolls/domain';
import { Pf2eRollService } from './Pf2eRollService';

export interface Pf2eRollServiceDependencies {
  readonly actorRoll: Pf2eActorRollPort;
}

export function createPf2eRollService(
  deps: Pf2eRollServiceDependencies
): Pf2eRollService {
  return new Pf2eRollService(deps.actorRoll);
}
