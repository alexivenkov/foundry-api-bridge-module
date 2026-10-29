import type { SwadeActionCardsPort } from '@/systems/swade/combat/domain';
import { SwadeCombatService } from './SwadeCombatService';

export interface SwadeCombatServiceDependencies {
  readonly actionCards: SwadeActionCardsPort;
}

export function createSwadeCombatService(deps: SwadeCombatServiceDependencies): SwadeCombatService {
  return new SwadeCombatService(deps.actionCards);
}
