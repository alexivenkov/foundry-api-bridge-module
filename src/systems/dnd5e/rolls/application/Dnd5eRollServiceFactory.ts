import type { ActorRollPort } from '@/systems/dnd5e/rolls/domain';
import { Dnd5eRollService } from './Dnd5eRollService';

export interface Dnd5eRollServiceDependencies {
  readonly actorRoll: ActorRollPort;
}

export function createDnd5eRollService(
  deps: Dnd5eRollServiceDependencies
): Dnd5eRollService {
  return new Dnd5eRollService(deps.actorRoll);
}
