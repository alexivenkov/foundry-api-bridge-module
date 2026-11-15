import {
  CombatNotFoundError,
  NoActiveCombatError,
  type CombatIdentity,
  type CombatLocator
} from '@/core/combat/domain';

/** The combat a command addresses: the one with `combatId`, or the active one when it is omitted. */
export function requireCombat(combats: CombatLocator, combatId: string | undefined): CombatIdentity {
  if (combatId === undefined) {
    const active = combats.findActiveCombat();
    if (active === null) {
      throw new NoActiveCombatError();
    }
    return active;
  }

  const combat = combats.findCombat(combatId);
  if (combat === null) {
    throw new CombatNotFoundError(combatId);
  }
  return combat;
}
