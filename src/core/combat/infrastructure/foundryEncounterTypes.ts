import type { FoundrySceneLike, FoundryScenesCollection, GameProvider } from '@/core/shared';
import type { FoundryCombatantGroupDocument, FoundryCombatantGroupsCollection } from './foundryCombatantGroupTypes';
import type { FoundryCombatDocument, FoundryCombatantDocument } from './foundryCombatTypes';
import type { FoundryTrackerSettings } from './foundryTrackerConfigTypes';

// What the encounter, group, token and tracker-configuration gateways read
// (`BaseCombat` schema and the client `Combat`, Foundry 13–14). Kept apart
// from `FoundryCombatGame`, which the older gateways read and whose shape
// their tests pin down.

export interface FoundryEncounterCombatant extends FoundryCombatantDocument {
  /** The combatant's own scene; null when its token is looked up on the encounter's. */
  sceneId: string | null;
}

export interface FoundryEncounterDocument extends FoundryCombatDocument {
  /** Foundry 14+: blank when the encounter has no name. */
  name?: string;
  /** A getter of the client document: the linked scene, null when there is none. */
  scene: { id: string } | null;
  active: boolean;
  combatants: {
    get(id: string): FoundryEncounterCombatant | undefined;
    contents: FoundryEncounterCombatant[];
  };
  /** Foundry 13+, absent before. */
  groups?: FoundryCombatantGroupsCollection;
  /** Foundry 13–14 resolve both to the combat itself. */
  nextRound(): Promise<FoundryCombatDocument | null | undefined>;
  previousRound(): Promise<FoundryCombatDocument | null | undefined>;
  /** Foundry 13 resolves to nothing, 14 to the combat. */
  resetAll(): Promise<unknown>;
  createEmbeddedDocuments(type: 'Combatant', data: Record<string, unknown>[]): Promise<FoundryCombatantDocument[]>;
  createEmbeddedDocuments(
    type: 'CombatantGroup',
    data: Record<string, unknown>[]
  ): Promise<FoundryCombatantGroupDocument[]>;
}

export interface FoundryCombatSceneToken {
  id: string;
  /** For an unlinked token, the world actor it was placed from; null when it stands for none. */
  actorId: string | null;
  hidden: boolean;
}

export interface FoundryCombatTokenScene extends FoundrySceneLike {
  tokens: { get(id: string): FoundryCombatSceneToken | undefined };
}

export interface FoundryCombatWorldGame {
  /** The encounter the combat tracker of this client shows; null when it shows none. */
  combat: FoundryEncounterDocument | null | undefined;
  combats: {
    get(id: string): FoundryEncounterDocument | undefined;
    contents: FoundryEncounterDocument[];
  };
  scenes: FoundryScenesCollection<FoundryCombatTokenScene>;
  settings: FoundryTrackerSettings;
}

export type CombatWorldGameProvider = GameProvider<FoundryCombatWorldGame>;
