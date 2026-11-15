import type {
  CombatTrackerConfigChanges,
  CombatantChanges,
  CombatantDraft,
  CombatantGroupChanges,
  CombatantGroupDraft,
  InitiativeRollOptions
} from '@/core/combat/domain';

/** Names the combat a request is about: the one with `combatId`, or the active one when it is omitted. */
export interface CombatAddress {
  readonly combatId: string | undefined;
}

export interface CreateCombatCommand {
  /** Omitted, the encounter is linked to the active scene, if there is one; null links it to none. */
  readonly sceneId: string | null | undefined;
  readonly activate: boolean;
}

export interface SetTurnCommand extends CombatAddress {
  readonly combatantId: string;
}

/** A combatant created from the ids the caller gives, as they are. */
export interface ActorCombatantCommand extends CombatAddress {
  readonly draft: CombatantDraft;
  readonly token?: undefined;
}

/** A token of a scene to add the way the core adds one: with its scene, its actor and its hidden flag. */
export interface TokenCombatantRequest {
  readonly tokenId: string;
  /** Omitted, the encounter's scene, else the active scene. */
  readonly sceneId: string | undefined;
  /** When given, it must be the token's actor. */
  readonly actorId: string | undefined;
  readonly initiative?: number | null | undefined;
  /** Omitted, the token's own hidden flag. */
  readonly hidden?: boolean | undefined;
  readonly groupId?: string | undefined;
}

export interface TokenCombatantCommand extends CombatAddress {
  readonly token: TokenCombatantRequest;
  readonly draft?: undefined;
}

export type AddCombatantCommand = ActorCombatantCommand | TokenCombatantCommand;

export interface CombatantAddress extends CombatAddress {
  readonly combatantId: string;
}

export interface UpdateCombatantCommand extends CombatantAddress {
  readonly changes: CombatantChanges;
}

export interface SetCombatantDefeatedCommand extends CombatantAddress {
  readonly defeated: boolean;
}

export interface SetInitiativeCommand extends CombatantAddress {
  readonly initiative: number | null;
}

export interface RollInitiativeCommand extends CombatAddress {
  readonly combatantIds: readonly string[];
  readonly options: InitiativeRollOptions;
}

export interface RollAllInitiativeCommand extends CombatAddress {
  readonly npcsOnly: boolean;
  readonly options: InitiativeRollOptions;
}

export interface ToggleSceneLinkCommand extends CombatAddress {
  /** The scene to link an unlinked encounter to; omitted, the active scene. */
  readonly sceneId: string | undefined;
}

export interface CreateCombatantGroupCommand extends CombatAddress {
  readonly draft: CombatantGroupDraft;
}

export interface CombatantGroupAddress extends CombatAddress {
  readonly groupId: string;
}

export interface UpdateCombatantGroupCommand extends CombatantGroupAddress {
  readonly changes: CombatantGroupChanges;
}

export interface UpdateTrackerConfigCommand {
  readonly changes: CombatTrackerConfigChanges;
}
