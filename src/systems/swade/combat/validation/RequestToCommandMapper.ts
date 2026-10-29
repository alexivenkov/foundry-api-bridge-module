import type { GetActionCardsCommand } from '@/systems/swade/combat/application';
import type { GetActionCardsRequest } from './CombatRequestSchemas';

export const RequestToCommandMapper = {
  toGetActionCardsCommand(request: GetActionCardsRequest): GetActionCardsCommand {
    return { combatId: request.combatId };
  }
};
