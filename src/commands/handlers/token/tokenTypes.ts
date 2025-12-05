import type { TokenResult } from '@/commands/types';

export interface TokenUpdateData {
  x?: number;
  y?: number;
  elevation?: number;
  rotation?: number;
  hidden?: boolean;
  scale?: number;
  name?: string;
  displayName?: number;
  disposition?: number;
  lockRotation?: boolean;
}

export interface FoundryToken {
  id: string;
  name: string;
  x: number;
  y: number;
  elevation: number;
  rotation: number;
  hidden: boolean;
  texture: {
    src: string;
  };
  disposition: number;
  actor: {
    id: string;
  } | null;
  update(data: TokenUpdateData, options?: TokenUpdateOptions): Promise<FoundryToken>;
  delete(): Promise<FoundryToken>;
}

export interface TokenUpdateOptions {
  animate?: boolean;
}

export interface FoundryTokensCollection {
  get(id: string): FoundryToken | undefined;
  contents: FoundryToken[];
}

export interface TokenCreateData {
  actorId: string;
  x: number;
  y: number;
  hidden?: boolean;
  elevation?: number;
  rotation?: number;
  scale?: number;
}

export interface FoundryScene {
  id: string;
  name: string;
  tokens: FoundryTokensCollection;
  createEmbeddedDocuments(
    type: 'Token',
    data: TokenCreateData[]
  ): Promise<FoundryToken[]>;
  deleteEmbeddedDocuments(type: 'Token', ids: string[]): Promise<unknown[]>;
}

export interface FoundryScenesCollection {
  get(id: string): FoundryScene | undefined;
  active: FoundryScene | null;
}

export interface FoundryGame {
  scenes: FoundryScenesCollection;
}

export function mapTokenToResult(token: FoundryToken): TokenResult {
  return {
    id: token.id,
    name: token.name,
    actorId: token.actor?.id ?? null,
    x: token.x,
    y: token.y,
    elevation: token.elevation,
    rotation: token.rotation,
    hidden: token.hidden,
    img: token.texture.src,
    disposition: token.disposition
  };
}

export function getActiveScene(game: FoundryGame, sceneId?: string): FoundryScene {
  if (sceneId) {
    const scene = game.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene not found: ${sceneId}`);
    }
    return scene;
  }

  const activeScene = game.scenes.active;
  if (!activeScene) {
    throw new Error('No active scene');
  }
  return activeScene;
}

export function getToken(scene: FoundryScene, tokenId: string): FoundryToken {
  const token = scene.tokens.get(tokenId);
  if (!token) {
    throw new Error(`Token not found: ${tokenId}`);
  }
  return token;
}