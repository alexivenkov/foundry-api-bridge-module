import type { SwadeGetActionCardsParams, SwadeActionCardsResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createSwadeCombatService,
  SwadeActionCardsGateway,
  getSwadeCombatGame,
  getActionCardsRequestSchema,
  RequestToCommandMapper
} from '@/systems/swade/combat';

export async function swadeGetActionCardsHandler(params: SwadeGetActionCardsParams): Promise<SwadeActionCardsResult> {
  requireSystem('swade', 'swade/get-action-cards');

  const parsed = getActionCardsRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toGetActionCardsCommand(parsed.data);
  const service = createSwadeCombatService({ actionCards: new SwadeActionCardsGateway(getSwadeCombatGame()) });

  const outcome = await service.getActionCards(command);
  return {
    combatId: outcome.combatId,
    round: outcome.round,
    turn: outcome.turn,
    combatants: outcome.combatants.map((combatant) => ({ ...combatant }))
  };
}
