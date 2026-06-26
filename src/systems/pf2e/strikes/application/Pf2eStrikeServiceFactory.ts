import type { Pf2eStrikePort } from '@/systems/pf2e/strikes/domain';
import { Pf2eStrikeService } from './Pf2eStrikeService';

export interface Pf2eStrikeServiceDependencies {
  readonly strikes: Pf2eStrikePort;
}

export function createPf2eStrikeService(
  deps: Pf2eStrikeServiceDependencies
): Pf2eStrikeService {
  return new Pf2eStrikeService(deps.strikes);
}
