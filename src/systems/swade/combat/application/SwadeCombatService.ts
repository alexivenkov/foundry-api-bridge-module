import type { SwadeActionCardsOutcome, SwadeActionCardsPort } from '@/systems/swade/combat/domain';
import type { GetActionCardsCommand } from './CombatCommands';

export class SwadeCombatService {
  constructor(private readonly actionCards: SwadeActionCardsPort) {}

  async getActionCards(command: GetActionCardsCommand): Promise<SwadeActionCardsOutcome> {
    return this.actionCards.getActionCards(command.combatId);
  }
}
