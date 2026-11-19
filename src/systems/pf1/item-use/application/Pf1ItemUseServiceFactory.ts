import type { Pf1ItemUsePort } from '@/systems/pf1/item-use/domain';
import { Pf1ItemUseService } from './Pf1ItemUseService';

export interface Pf1ItemUseServiceDependencies {
  readonly items: Pf1ItemUsePort;
}

export function createPf1ItemUseService(deps: Pf1ItemUseServiceDependencies): Pf1ItemUseService {
  return new Pf1ItemUseService(deps.items);
}
