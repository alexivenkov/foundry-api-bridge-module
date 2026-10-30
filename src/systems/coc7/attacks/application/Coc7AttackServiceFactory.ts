import type { Coc7AttackPort } from '@/systems/coc7/attacks/domain';
import { Coc7AttackService } from './Coc7AttackService';

export interface Coc7AttackServiceDependencies {
  readonly attacks: Coc7AttackPort;
}

export function createCoc7AttackService(deps: Coc7AttackServiceDependencies): Coc7AttackService {
  return new Coc7AttackService(deps.attacks);
}
