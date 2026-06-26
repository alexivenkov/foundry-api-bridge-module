import type { Pf2eItemUsePort } from '@/systems/pf2e/item-use/domain';
import { Pf2eItemUseService } from './Pf2eItemUseService';

export interface Pf2eItemUseServiceDependencies {
  readonly itemUse: Pf2eItemUsePort;
}

export function createPf2eItemUseService(
  deps: Pf2eItemUseServiceDependencies
): Pf2eItemUseService {
  return new Pf2eItemUseService(deps.itemUse);
}
