/** One participant of an encounter. */
export interface Combatant {
  readonly id: string;
  readonly actorId: string;
  /** Null for a combatant that has no token on a scene. */
  readonly tokenId: string | null;
  readonly name: string;
  readonly img: string;
  /** Null until initiative is rolled or set. */
  readonly initiative: number | null;
  readonly defeated: boolean;
  readonly hidden: boolean;
  /** Foundry 13+: the group the combatant is in, null when none. Absent on cores without combatant groups. */
  readonly groupId?: string | null;
}

export interface CombatIdentity {
  readonly id: string;
}

export interface Combat {
  readonly id: string;
  readonly round: number;
  /** Position of the current combatant in the turn order. */
  readonly turn: number;
  readonly started: boolean;
  readonly turnOrder: readonly Combatant[];
  /** Whose turn it is; null when it is no one's. */
  readonly current: Combatant | null;
}

/** What a turn description needs from an encounter: whose turn it is, and who takes part. */
export interface TurnOverview {
  readonly round: number;
  readonly turn: number;
  readonly current: Combatant | null;
  /** The scene the token of the current combatant is on; null when that is not known. */
  readonly currentSceneId: string | null;
  readonly combatants: readonly Combatant[];
}

export interface CombatDraft {
  /** The scene the encounter is linked to; null links it to none. Omitted, the core decides. */
  readonly sceneId?: string | null | undefined;
  /** Whether the new encounter also becomes the active one. */
  readonly activate: boolean;
}

export interface CombatantDraft {
  readonly actorId: string;
  readonly tokenId?: string | null | undefined;
  /** The scene of the token. Omitted, the core looks the token up on the encounter's scene. */
  readonly sceneId?: string | undefined;
  readonly initiative?: number | null | undefined;
  readonly hidden?: boolean | undefined;
  readonly groupId?: string | undefined;
}

/** An omitted attribute is left untouched; a null initiative clears it, a null group takes the combatant out of its group. */
export interface CombatantChanges {
  readonly initiative?: number | null | undefined;
  readonly defeated?: boolean | undefined;
  readonly hidden?: boolean | undefined;
  readonly groupId?: string | null | undefined;
}

/** A token of a scene, as adding it to an encounter needs it. */
export interface CombatToken {
  readonly id: string;
  readonly sceneId: string;
  /** The actor the token stands for (for an unlinked token, the world actor it was placed from); null when none. */
  readonly actorId: string | null;
  readonly hidden: boolean;
}

/** The core keeps a token in an encounter once; it knows a combatant's token by its id alone. */
export function hasTokenCombatant(combatants: readonly Combatant[], tokenId: string): boolean {
  return combatants.some((combatant) => combatant.tokenId === tokenId);
}

export function hasCombatantChanges(changes: CombatantChanges): boolean {
  return Object.values(changes).some((value) => value !== undefined);
}

/** The combatant's position in the turn order; null when it is not part of it. */
export function turnOf(combat: Combat, combatantId: string): number | null {
  const index = combat.turnOrder.findIndex((combatant) => combatant.id === combatantId);
  return index === -1 ? null : index;
}

/** The tokens that take part in the encounter. */
export function participantTokenIds(combatants: readonly Combatant[]): ReadonlySet<string> {
  const tokenIds = new Set<string>();
  for (const combatant of combatants) {
    if (combatant.tokenId) {
      tokenIds.add(combatant.tokenId);
    }
  }
  return tokenIds;
}
