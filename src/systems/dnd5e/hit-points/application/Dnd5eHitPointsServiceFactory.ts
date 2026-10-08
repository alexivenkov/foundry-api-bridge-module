import type { HitPointsPort } from '@/systems/dnd5e/hit-points/domain';
import { Dnd5eHitPointsService } from './Dnd5eHitPointsService';

export interface Dnd5eHitPointsServiceDependencies {
  readonly hitPoints: HitPointsPort;
}

export function createDnd5eHitPointsService(deps: Dnd5eHitPointsServiceDependencies): Dnd5eHitPointsService {
  return new Dnd5eHitPointsService(deps.hitPoints);
}
