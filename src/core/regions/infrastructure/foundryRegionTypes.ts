import type { FoundryScenesGame } from '@/core/shared';
import type { FoundryRegionBehaviorDocument, FoundryRegionBehaviorsCollection } from './foundryRegionBehaviorTypes';

/**
 * A region's stored data (`toObject()`), `BaseRegion` schema of Foundry 13.351 and
 * 14.368. The fields after `locked` exist on Foundry 14+ only.
 */
export interface FoundryRegionSource {
  _id: string;
  name: string;
  color: string;
  shapes: Record<string, unknown>[];
  elevation: { bottom: number | null; top: number | null; topInclusive?: boolean };
  visibility: number;
  locked: boolean;
  levels?: string[];
  restriction?: { enabled: boolean; type: string; priority: number };
  attachment?: { token: string | null };
  highlightMode?: string;
  displayMeasurements?: boolean;
  hidden?: boolean;
  _shapeConstraints?: number[][] | null;
}

export interface FoundryRegionToken {
  id: string;
  name: string | null;
}

/** The client `RegionDocument`. */
export interface FoundryRegionDocument {
  id: string;
  toObject(): FoundryRegionSource;
  behaviors: FoundryRegionBehaviorsCollection;
  /** The tokens the core records as inside (each token's `_regions`). */
  tokens?: ReadonlySet<FoundryRegionToken>;
  /** Foundry 13+: `testPoint({x, y, elevation})`; Foundry 12: `testPoint({x, y}, elevation)`. */
  testPoint?(point: { x: number; y: number; elevation: number }, elevation: number): boolean;
  update(data: Record<string, unknown>): Promise<unknown>;
  createEmbeddedDocuments(
    type: 'RegionBehavior',
    data: Record<string, unknown>[]
  ): Promise<FoundryRegionBehaviorDocument[]>;
  deleteEmbeddedDocuments(type: 'RegionBehavior', ids: string[]): Promise<unknown[]>;
}

export interface FoundryRegionScene {
  id: string;
  regions?: { get(id: string): FoundryRegionDocument | undefined; contents: FoundryRegionDocument[] };
  tokens: { get(id: string): FoundryRegionToken | undefined };
  /** Foundry 14+. */
  levels?: { get(id: string): unknown };
  createEmbeddedDocuments(type: 'Region', data: Record<string, unknown>[]): Promise<FoundryRegionDocument[]>;
  deleteEmbeddedDocuments(type: 'Region', ids: string[]): Promise<unknown[]>;
}

export type FoundryRegionGame = FoundryScenesGame<FoundryRegionScene>;
