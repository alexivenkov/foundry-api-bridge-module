import type { Combatant } from '@/core/combat/domain/model/Combat';

export interface InitiativeRollOptions {
  /** A dice formula that replaces the game system's own; null, like none, rolls the system's. */
  readonly formula?: string | null | undefined;
}

export interface InitiativeScore {
  readonly combatantId: string;
  readonly name: string;
  readonly initiative: number;
}

const UNKNOWN_COMBATANT = 'Unknown';

/** What a roll reports for a combatant: one that left the encounter meanwhile is reported as unknown, with 0. */
export function initiativeScoreOf(combatantId: string, combatant: Combatant | null): InitiativeScore {
  return {
    combatantId,
    name: combatant?.name ?? UNKNOWN_COMBATANT,
    initiative: combatant?.initiative ?? 0
  };
}

/**
 * What a roll for the combatants without initiative gave: the scores of those
 * who had none before it and have one after it.
 */
export function rolledInitiativeScores(
  before: readonly Combatant[],
  after: readonly Combatant[]
): InitiativeScore[] {
  const unrolled = new Set(before.filter((combatant) => combatant.initiative === null).map((combatant) => combatant.id));
  return after
    .filter((combatant) => unrolled.has(combatant.id) && combatant.initiative !== null)
    .map((combatant) => ({
      combatantId: combatant.id,
      name: combatant.name,
      initiative: combatant.initiative ?? 0
    }));
}
