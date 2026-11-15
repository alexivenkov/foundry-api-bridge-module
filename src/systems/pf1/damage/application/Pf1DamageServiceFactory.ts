import type { Pf1DamagePort } from '@/systems/pf1/damage/domain';
import { Pf1DamageService } from './Pf1DamageService';

export interface Pf1DamageServiceDependencies {
  readonly damage: Pf1DamagePort;
}

export function createPf1DamageService(deps: Pf1DamageServiceDependencies): Pf1DamageService {
  return new Pf1DamageService(deps.damage);
}
