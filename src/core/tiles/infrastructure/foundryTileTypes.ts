import type { FoundryScenesGame } from '@/core/shared';

/**
 * The persisted tile data (`BaseTile` schema, Foundry 13.351 and 14.368). The
 * mapper reads `_source`: the document's own fields hold a `Color` for the tint
 * and a `Set` for the occlusion modes.
 */
export interface FoundryTileTextureSource {
  src?: string | null;
  tint?: string | null;
  scaleX?: number;
  scaleY?: number;
  anchorX?: number;
  anchorY?: number;
  fit?: string;
  alphaThreshold?: number;
  /** Foundry 12–13 (`TextureData`); Foundry 14 dropped it. */
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
}

export interface FoundryTileSource {
  _id: string;
  /** Foundry 14+. */
  name?: string | null;
  texture?: FoundryTileTextureSource;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  elevation?: number;
  /** Foundry 14+. */
  levels?: string[];
  sort?: number;
  rotation?: number;
  alpha?: number;
  hidden?: boolean;
  locked?: boolean;
  restrictions?: { light?: boolean; weather?: boolean };
  /** `mode` (one code) on Foundry 12–13, `modes` (a set of codes) on Foundry 14+. */
  occlusion?: { mode?: number; modes?: number[]; alpha?: number };
  video?: { loop?: boolean; autoplay?: boolean; volume?: number };
}

export interface FoundryTileDocument {
  id: string;
  _source: FoundryTileSource;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryTilesCollection {
  get(id: string): FoundryTileDocument | undefined;
  contents: FoundryTileDocument[];
}

export interface FoundryTileScene {
  id: string;
  name?: string;
  tiles: FoundryTilesCollection;
  createEmbeddedDocuments(type: 'Tile', data: Record<string, unknown>[]): Promise<FoundryTileDocument[]>;
  deleteEmbeddedDocuments(type: 'Tile', ids: string[]): Promise<unknown[]>;
}

export type FoundryTileGame = FoundryScenesGame<FoundryTileScene>;
