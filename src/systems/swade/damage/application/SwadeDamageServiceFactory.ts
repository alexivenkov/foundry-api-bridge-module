import type { SwadeDamagePort } from '@/systems/swade/damage/domain';
import { SwadeDamageService } from './SwadeDamageService';

export interface SwadeDamageServiceDependencies {
  readonly damage: SwadeDamagePort;
}

export function createSwadeDamageService(deps: SwadeDamageServiceDependencies): SwadeDamageService {
  return new SwadeDamageService(deps.damage);
}
