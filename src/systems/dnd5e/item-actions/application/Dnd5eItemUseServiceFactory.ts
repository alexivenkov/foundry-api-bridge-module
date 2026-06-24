import type { ItemUsePort } from '@/systems/dnd5e/item-actions/domain';
import { Dnd5eItemUseService } from './Dnd5eItemUseService';

export interface Dnd5eItemUseServiceDependencies {
  readonly itemUse: ItemUsePort;
}

export function createDnd5eItemUseService(
  deps: Dnd5eItemUseServiceDependencies
): Dnd5eItemUseService {
  return new Dnd5eItemUseService(deps.itemUse);
}
