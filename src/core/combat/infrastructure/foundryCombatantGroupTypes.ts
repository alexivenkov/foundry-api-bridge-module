/** Foundry 13+: an embedded CombatantGroup document of a Combat (`BaseCombatantGroup` and the client document). */
export interface FoundryCombatantGroupDocument {
  id: string;
  /** Unset, or blank, when the group has no name. */
  name: string | null | undefined;
  img: string | null;
  initiative: number | null;
  /** Prepared by the client document: every member is defeated (`Combatant#isDefeated`), or there are none. */
  defeated: boolean;
  /** Prepared by the client document: every member is hidden, or there are none. */
  hidden: boolean;
  /** Prepared by the client document, which rebuilds it whenever the combat changes. */
  members: Iterable<{ id: string }>;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
}

export interface FoundryCombatantGroupsCollection {
  get(id: string): FoundryCombatantGroupDocument | undefined;
  contents: FoundryCombatantGroupDocument[];
}
