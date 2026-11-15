/**
 * Foundry 13+: combatants of one encounter grouped together. While the group
 * has an initiative, the core gives it to every member in place of the member's
 * own (`Combatant#_prepareGroup`), so they share one place in the turn order.
 */
export interface CombatantGroup {
  readonly id: string;
  readonly name: string | null;
  readonly img: string | null;
  readonly initiative: number | null;
  /** Derived by the core: every member is defeated, or the group has none. */
  readonly defeated: boolean;
  /** Derived by the core: every member is hidden, or the group has none. */
  readonly hidden: boolean;
  readonly memberIds: readonly string[];
}

export interface CombatantGroupDraft {
  readonly name?: string | undefined;
  readonly img?: string | undefined;
  readonly initiative?: number | undefined;
}

/** An omitted attribute is left untouched; null clears it. */
export interface CombatantGroupChanges {
  readonly name?: string | null | undefined;
  readonly img?: string | null | undefined;
  readonly initiative?: number | null | undefined;
}

export function hasGroupChanges(changes: CombatantGroupChanges): boolean {
  return Object.values(changes).some((value) => value !== undefined);
}
