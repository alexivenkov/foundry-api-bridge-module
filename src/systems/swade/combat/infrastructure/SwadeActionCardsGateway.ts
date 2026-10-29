import { ValidationError } from '@/systems/shared/domain/errors';
import type { FoundrySwadeCombat, FoundrySwadeCombatant, FoundrySwadeGame } from '@/systems/swade/shared/infrastructure';
import type { SwadeActionCardCombatant, SwadeActionCardsOutcome, SwadeActionCardsPort } from '@/systems/swade/combat/domain';

function toCombatant(combatant: FoundrySwadeCombatant): SwadeActionCardCombatant {
  const system = combatant.system;
  const cardString = system.cardString ?? '';
  return {
    combatantId: combatant.id,
    name: combatant.name,
    actorId: combatant.actorId ?? null,
    tokenId: combatant.tokenId ?? null,
    initiative: combatant.initiative ?? null,
    cardValue: system.cardValue ?? null,
    suitValue: system.suitValue ?? null,
    cardString: cardString === '' ? null : cardString,
    hasJoker: system.hasJoker === true,
    roundHeld: combatant.roundHeld ?? system.roundHeld ?? null,
    turnLost: combatant.turnLost ?? system.turnLost ?? false,
    isGroupLeader: combatant.isGroupLeader ?? false,
    isDefeated: combatant.isDefeated ?? combatant.defeated ?? false
  };
}

/**
 * Anti-corruption layer over SWADE's card initiative (swade 6.0.4): the
 * combatant data model keeps `cardValue`, `suitValue`, `cardString`,
 * `hasJoker`, `roundHeld` and `turnLost`; `initiative` is
 * `cardValue + suitValue / 10`.
 */
export class SwadeActionCardsGateway implements SwadeActionCardsPort {
  constructor(private readonly game: FoundrySwadeGame) {}

  getActionCards(combatId: string | undefined): Promise<SwadeActionCardsOutcome> {
    try {
      const combat = this.resolveCombat(combatId);
      return Promise.resolve({
        combatId: combat.id,
        round: combat.round,
        turn: combat.turn ?? 0,
        combatants: combat.combatants.contents.map(toCombatant)
      });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private resolveCombat(combatId: string | undefined): FoundrySwadeCombat {
    if (combatId !== undefined) {
      const combat = this.game.combats?.get(combatId);
      if (!combat) {
        throw new ValidationError(`Combat not found: ${combatId}`);
      }
      return combat;
    }
    const active = this.game.combat ?? this.game.combats?.active ?? null;
    if (!active) {
      throw new ValidationError('No active combat');
    }
    return active;
  }
}
