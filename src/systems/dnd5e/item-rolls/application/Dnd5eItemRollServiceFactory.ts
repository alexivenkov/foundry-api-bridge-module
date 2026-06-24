import type { ItemRollPort } from '@/systems/dnd5e/item-rolls/domain';
import { Dnd5eItemRollService } from './Dnd5eItemRollService';

export interface Dnd5eItemRollServiceDependencies {
  readonly itemRoll: ItemRollPort;
}

export function createDnd5eItemRollService(
  deps: Dnd5eItemRollServiceDependencies
): Dnd5eItemRollService {
  return new Dnd5eItemRollService(deps.itemRoll);
}
