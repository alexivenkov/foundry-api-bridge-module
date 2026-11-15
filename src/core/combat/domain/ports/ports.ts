import type { AsciiMapInput } from '@/core/shared/domain';
import type { Battlefield } from '@/core/combat/domain/model/Battlefield';
import type {
  Combat,
  CombatDraft,
  CombatIdentity,
  CombatToken,
  Combatant,
  CombatantChanges,
  CombatantDraft,
  TurnOverview
} from '@/core/combat/domain/model/Combat';
import type {
  CombatantGroup,
  CombatantGroupChanges,
  CombatantGroupDraft
} from '@/core/combat/domain/model/CombatantGroup';
import type { Encounter } from '@/core/combat/domain/model/Encounter';
import type { InitiativeRollOptions } from '@/core/combat/domain/model/Initiative';
import type { CombatTrackerConfig } from '@/core/combat/domain/model/TrackerConfig';
import type { SightTest } from '@/core/combat/domain/turn/turnSurroundings';

// Reads are synchronous: encounters live in memory. Every method that names a
// combat throws CombatNotFoundError when it is gone.

export interface CombatLocator {
  findCombat(combatId: string): CombatIdentity | null;
  /** The encounter a command means when it names none. */
  findActiveCombat(): CombatIdentity | null;
}

export interface CombatStore {
  readCombat(combatId: string): Combat;
  /** Resolves to null when the core created nothing. */
  createCombat(draft: CombatDraft): Promise<Combat | null>;
  startCombat(combatId: string): Promise<Combat>;
  nextTurn(combatId: string): Promise<Combat>;
  previousTurn(combatId: string): Promise<Combat>;
  /** Hands the turn to the combatant at this position of the turn order; the round stays. */
  setTurn(combatId: string, turn: number): Promise<Combat>;
  deleteCombat(combatId: string): Promise<void>;
}

export interface TurnReader {
  readTurn(combatId: string): TurnOverview;
}

// Writes resolve to null when the combatant is gone (or, for `addCombatant`,
// when nothing was created).
export interface CombatantStore {
  listCombatants(combatId: string): readonly Combatant[];
  findCombatant(combatId: string, combatantId: string): Combatant | null;
  addCombatant(combatId: string, draft: CombatantDraft): Promise<Combatant | null>;
  updateCombatant(combatId: string, combatantId: string, changes: CombatantChanges): Promise<Combatant | null>;
  removeCombatant(combatId: string, combatantId: string): Promise<void>;
}

export interface InitiativeStore {
  /** A null initiative clears it. */
  setInitiative(combatId: string, combatantId: string, initiative: number | null): Promise<void>;
  rollInitiative(combatId: string, combatantIds: readonly string[], options: InitiativeRollOptions): Promise<void>;
  /** Rolls for every combatant that has no initiative yet. */
  rollAll(combatId: string, options: InitiativeRollOptions): Promise<void>;
  /** Rolls for every combatant no player controls that has no initiative yet. */
  rollNpcs(combatId: string, options: InitiativeRollOptions): Promise<void>;
}

export interface ActiveSceneReader {
  findActiveSceneId(): string | null;
}

export interface BattlefieldReader {
  /** Null when the world has no such scene. */
  readScene(sceneId: string): Battlefield | null;
  /** The scene this client views; null when it views none. */
  readViewedScene(): Battlefield | null;
}

export type MapCollisionTest = NonNullable<AsciiMapInput['collisionBackend']>;

/** The core's collision tests. They always answer for the scene on the canvas. */
export interface CanvasCollisions {
  /** Undefined when no canvas can answer sight tests. */
  sightTest(): SightTest | undefined;
  /** Undefined when no canvas can answer movement tests. */
  movementTest(): MapCollisionTest | undefined;
}

/** The encounters of the world as wholes. Writes resolve to the encounter as it stands afterwards. */
export interface EncounterStore {
  listEncounters(): readonly Encounter[];
  readEncounter(combatId: string): Encounter;
  activate(combatId: string): Promise<Encounter>;
  /** A null scene unlinks the encounter. */
  linkScene(combatId: string, sceneId: string | null): Promise<Encounter>;
  nextRound(combatId: string): Promise<Combat>;
  previousRound(combatId: string): Promise<Combat>;
  /** Clears the initiative of every combatant; the turn stays with the current combatant. */
  resetInitiative(combatId: string): Promise<Combat>;
}

export interface CombatantGroupReader {
  /** Combatant groups exist from Foundry 13 on. */
  groupsAvailable(): boolean;
  findGroup(combatId: string, groupId: string): CombatantGroup | null;
}

export interface CombatantGroupStore extends CombatantGroupReader {
  listGroups(combatId: string): readonly CombatantGroup[];
  /** Resolves to null when the core created nothing. */
  createGroup(combatId: string, draft: CombatantGroupDraft): Promise<CombatantGroup | null>;
  /** Resolves to null when the group is gone. */
  updateGroup(combatId: string, groupId: string, changes: CombatantGroupChanges): Promise<CombatantGroup | null>;
  deleteGroup(combatId: string, groupId: string): Promise<void>;
}

/** The tokens an encounter can take in. */
export interface CombatTokenReader {
  /** The scene the encounter is linked to; null when it is linked to none. */
  linkedSceneId(combatId: string): string | null;
  findToken(sceneId: string, tokenId: string): CombatToken | null;
}

export interface TrackerConfigStore {
  /** Turn markers exist from Foundry 13 on. */
  turnMarkersAvailable(): boolean;
  readConfig(): CombatTrackerConfig;
  writeConfig(config: CombatTrackerConfig): Promise<void>;
  /** The turn marker animations the world knows; empty when there is no telling. */
  turnMarkerAnimations(): readonly string[];
}
