import type { SwadeActionCardsOutcome } from '@/systems/swade/combat/domain/ActionCardsOutcome';

/** Outbound port for the action cards a SWADE combat has dealt (`combatant.system.cardValue` & co.). */
export interface SwadeActionCardsPort {
  getActionCards(combatId: string | undefined): Promise<SwadeActionCardsOutcome>;
}
