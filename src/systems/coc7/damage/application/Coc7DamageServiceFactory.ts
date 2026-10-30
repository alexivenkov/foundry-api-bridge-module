import type { Coc7DamagePort } from '@/systems/coc7/damage/domain';
import { Coc7DamageService } from './Coc7DamageService';

export interface Coc7DamageServiceDependencies {
  readonly damage: Coc7DamagePort;
}

export function createCoc7DamageService(deps: Coc7DamageServiceDependencies): Coc7DamageService {
  return new Coc7DamageService(deps.damage);
}
