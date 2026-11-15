/** An encounter of the world, apart from its turn order. */
export interface Encounter {
  readonly id: string;
  /** Foundry 14+: the encounter's own name, null when it has none. Absent on older cores. */
  readonly name?: string | null;
  /** The scene the encounter is linked to; null when it is shown on every scene. */
  readonly sceneId: string | null;
  /** The encounter's own flag; the server keeps at most one encounter of the world active. */
  readonly active: boolean;
  /** Whether a command that names no encounter means this one. */
  readonly isDefault: boolean;
  readonly started: boolean;
  readonly round: number;
  /** Null while it is no one's turn. */
  readonly turn: number | null;
  readonly combatantCount: number;
  /** The scenes its combatants are placed on by a scene of their own. */
  readonly combatantSceneIds: readonly string[];
}

/** The core refuses to link an encounter to a scene while one of its combatants is placed on another. */
export function canLinkToScene(encounter: Encounter, sceneId: string): boolean {
  return encounter.combatantSceneIds.every((combatantSceneId) => combatantSceneId === sceneId);
}
