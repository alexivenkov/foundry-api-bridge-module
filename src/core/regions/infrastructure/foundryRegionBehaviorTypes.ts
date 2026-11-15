/** A behavior's stored data (`toObject()`), `BaseRegionBehavior` schema of Foundry 13.351 and 14.368. */
export interface FoundryRegionBehaviorSource {
  _id: string;
  name: string;
  type: string;
  disabled: boolean;
  system: Record<string, unknown>;
}

export interface FoundryRegionBehaviorDocument {
  id: string;
  toObject(): FoundryRegionBehaviorSource;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryRegionBehaviorsCollection {
  get(id: string): FoundryRegionBehaviorDocument | undefined;
  contents: FoundryRegionBehaviorDocument[];
}

interface FoundrySchemaFieldLike {
  fields?: Readonly<Record<string, FoundrySchemaFieldLike>>;
}

/** The globals the behavior gateways read besides `game.scenes`. */
export interface FoundryRegionGlobals {
  game?: { documentTypes?: Readonly<Record<string, readonly string[]>> };
  CONST?: { REGION_EVENTS?: Readonly<Record<string, string>> };
  CONFIG?: { RegionBehavior?: { dataModels?: Readonly<Record<string, { schema?: FoundrySchemaFieldLike }>> } };
  foundry?: {
    utils?: {
      parseUuid?(uuid: string, options: { relative: unknown }): { uuid?: string | null } | null;
      /** Loads a compendium document when needed (Foundry 13 / 14 `client/utils/helpers.mjs`). */
      fromUuid?: (uuid: string) => Promise<unknown>;
    };
    data?: { operators?: { ForcedReplacement?: { create(value: unknown): unknown } } };
  };
  /** The global alias the client also installs (Foundry 12 has only this one). */
  fromUuid?: (uuid: string) => Promise<unknown>;
}

export type RegionGlobalsProvider = () => FoundryRegionGlobals;

export const regionGlobalsFromGlobalThis: RegionGlobalsProvider = () => globalThis as unknown as FoundryRegionGlobals;
