import type {
  ElevatedPoint,
  Region,
  RegionChanges,
  RegionDraft,
  RegionTokenRef
} from '@/core/regions/domain/model/Region';
import type {
  RegionBehavior,
  RegionBehaviorChanges,
  RegionBehaviorConfigInput,
  RegionBehaviorDraft
} from '@/core/regions/domain/model/RegionBehavior';
import type { RegionShapeType, RegionVisibility } from '@/core/regions/domain/value-objects';

/** What the running Foundry generation's region model offers. */
export interface RegionFeatures {
  /** Scene regions exist at all (Foundry 12+). */
  readonly available: boolean;
  readonly shapeTypes: readonly RegionShapeType[];
  readonly visibilities: readonly RegionVisibility[];
  /** The Foundry 14 model: levels, restriction, attachment, highlight / measurement / hidden, `topInclusive`, shape options. */
  readonly extendedModel: boolean;
}

export type RegionPointTest =
  | { readonly kind: 'answered'; readonly inside: boolean }
  | { readonly kind: 'shape-not-computed' }
  | { readonly kind: 'unavailable' };

// Reads are synchronous: a scene's regions live in memory. Writes resolve to null
// when the core created nothing (a hook vetoed it) or the region is gone.
export interface RegionStore {
  features(): RegionFeatures;
  listRegions(sceneId: string): readonly Region[];
  findRegion(sceneId: string, regionId: string): Region | null;
  createRegion(sceneId: string, draft: RegionDraft): Promise<Region | null>;
  updateRegion(sceneId: string, regionId: string, changes: RegionChanges): Promise<Region | null>;
  deleteRegion(sceneId: string, regionId: string): Promise<void>;
  hasToken(sceneId: string, tokenId: string): boolean;
  /** The ids among `levelIds` that name no level of the scene. */
  findMissingLevels(sceneId: string, levelIds: readonly string[]): readonly string[];
  /** The tokens the core records as inside the region. */
  listTokensInside(sceneId: string, regionId: string): readonly RegionTokenRef[];
  testPoint(sceneId: string, regionId: string, point: ElevatedPoint): RegionPointTest;
}

export interface RegionBehaviorStore {
  createBehavior(sceneId: string, regionId: string, draft: RegionBehaviorDraft): Promise<RegionBehavior | null>;
  updateBehavior(
    sceneId: string,
    regionId: string,
    behaviorId: string,
    changes: RegionBehaviorChanges
  ): Promise<RegionBehavior | null>;
  deleteBehavior(sceneId: string, regionId: string, behaviorId: string): Promise<void>;
}

/** What the world registers for behaviors. A list the core cannot tell answers null and is not checked. */
export interface RegionBehaviorCatalog {
  registeredTypes(): readonly string[] | null;
  regionEvents(): readonly string[] | null;
  /** The movement actions `modifyMovementCost` holds a difficulty for. */
  movementCostActions(): readonly string[] | null;
  /** Foundry 14 teleports: several destinations, placement, snap, reveal, dialog and transition options. */
  extendedTeleport(): boolean;
}

/** Whether the world lets this module create and change script behaviors (the script-macro opt-in). */
export interface ScriptBehaviorPolicy {
  allowsScripts(): boolean;
}

/** Resolves the Macro an executeMacro behavior points at, world or compendium. */
export interface RegionMacroResolver {
  /** The macro's type (`script`, `chat`), or null when the UUID names no Macro. */
  findMacroType(macroUuid: string): Promise<string | null>;
}

/** Turns a caller's config object into the settings of `type`; throws a ValidationError. */
export interface BehaviorConfigReader {
  read(type: string, config: Readonly<Record<string, unknown>>): RegionBehaviorConfigInput;
}
