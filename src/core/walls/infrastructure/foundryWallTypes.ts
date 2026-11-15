import type { FoundryScenesGame } from '@/core/shared';

/** `BaseWall#threshold`: distances in scene units (positive or null). */
export interface FoundryWallThreshold {
  light: number | null;
  sight: number | null;
  sound: number | null;
  attenuation: boolean;
}

/** `BaseWall#animation` (Foundry 13–14); `direction` is 1 or -1 (reverse). */
export interface FoundryWallAnimation {
  type?: string;
  direction?: number;
  double?: boolean;
  duration?: number;
  flip?: boolean;
  strength?: number;
  texture?: string | null;
}

/**
 * The Wall document fields the context reads and writes (`BaseWall` schema,
 * Foundry 13–14). `threshold` and `doorSound` exist from 11 on, `animation`
 * (null when not configured) from 13 on; `doorSound` is unset until chosen.
 */
export interface FoundryWallDocument {
  _id: string;
  c: number[];
  door: number;
  ds: number | undefined;
  move: number | undefined;
  sight: number | undefined;
  sound: number | undefined;
  light: number | undefined;
  dir: number | undefined;
  threshold?: FoundryWallThreshold | undefined;
  doorSound?: string | undefined;
  animation?: FoundryWallAnimation | null | undefined;
  update(data: Record<string, unknown>): Promise<unknown>;
}

/** `CONFIG.Wall` registries and the localizer (client globals). */
export interface FoundryWallGlobals {
  CONFIG?: {
    Wall?: {
      doorSounds?: Record<string, { label?: string } | undefined> | undefined;
      animationTypes?: Record<string, unknown> | undefined;
    };
  };
  game?: { i18n?: { localize(key: string): string } | undefined } | undefined;
}

export interface FoundryWallsCollection {
  get(id: string): FoundryWallDocument | undefined;
  contents: FoundryWallDocument[];
}

export interface FoundryWallScene {
  id: string;
  walls: FoundryWallsCollection;
  createEmbeddedDocuments(type: 'Wall', data: Record<string, unknown>[]): Promise<FoundryWallDocument[]>;
  deleteEmbeddedDocuments(type: 'Wall', ids: string[]): Promise<unknown[]>;
}

export type FoundryWallGame = FoundryScenesGame<FoundryWallScene>;
