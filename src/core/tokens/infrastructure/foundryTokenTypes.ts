import type { FoundryActorWithAttributes, FoundryScenesGame } from '@/core/shared';
import type { FoundryTokenSource } from './foundryTokenAppearanceTypes';

export interface FoundryTokenActor extends FoundryActorWithAttributes {
  id: string;
  type?: string;
  statuses?: Set<string>;
}

export interface FoundryTokenTexture {
  src: string;
  /** Size multipliers; a negative value mirrors the image on that axis. */
  scaleX?: number;
  scaleY?: number;
}

export interface FoundryTokenUpdateOptions {
  animate?: boolean;
  teleport?: boolean;
}

/** The Token document fields the context reads and writes (`BaseToken` schema, Foundry 13–14). */
export interface FoundryTokenDocument {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  elevation: number;
  rotation: number;
  hidden: boolean;
  texture: FoundryTokenTexture;
  disposition: number;
  actorId?: string | null;
  actorLink?: boolean;
  actor: FoundryTokenActor | null;
  /** The stored data; the appearance is read from here, where colors are plain strings. */
  _source?: FoundryTokenSource | undefined;
  update(data: Record<string, unknown>, options?: FoundryTokenUpdateOptions): Promise<unknown>;
  delete(): Promise<unknown>;
}

export interface FoundryTokensCollection {
  get(id: string): FoundryTokenDocument | undefined;
  contents: FoundryTokenDocument[];
}

export interface FoundryTokenSceneGrid {
  size?: number;
  distance?: number;
  units?: string;
}

export interface FoundryTokenScene {
  id: string;
  name?: string;
  tokens: FoundryTokensCollection;
  grid?: FoundryTokenSceneGrid | undefined;
  createEmbeddedDocuments(type: 'Token', data: Record<string, unknown>[]): Promise<FoundryTokenDocument[]>;
}

export type FoundryTokenGame = FoundryScenesGame<FoundryTokenScene>;
