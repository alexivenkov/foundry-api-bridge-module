import type { Token, TokenChanges, TokenDraft, TokenPlacement } from '@/core/tokens/domain/model/Token';
import type { PassageWall } from '@/core/tokens/domain/movement/DoorAwareCollision';
import type { CollisionChecker } from '@/core/tokens/domain/movement/GridPathfinder';

export interface PlacementOptions {
  readonly animate: boolean;
  /** The step crosses a door that has just been opened. */
  readonly throughDoor: boolean;
}

// Reads are synchronous: a scene's tokens live in memory. Writes resolve to
// null when the token is gone (or, for `createToken`, when nothing was created).
export interface TokenStore {
  listTokens(sceneId: string): readonly Token[];
  findToken(sceneId: string, tokenId: string): Token | null;
  createToken(sceneId: string, draft: TokenDraft): Promise<Token | null>;
  updateToken(sceneId: string, tokenId: string, changes: TokenChanges): Promise<Token | null>;
  placeToken(
    sceneId: string,
    tokenId: string,
    placement: TokenPlacement,
    options: PlacementOptions
  ): Promise<Token | null>;
  deleteToken(sceneId: string, tokenId: string): Promise<void>;
}

export interface MovementSurfaceProbe {
  readonly gridSize: number;
  readonly collision: CollisionChecker;
}

/** What movement planning needs from the canvas; null when no canvas can answer collision tests. */
export interface MovementSurface {
  probe(): MovementSurfaceProbe | null;
}

/** The walls and doors a moving token meets. */
export interface Passages {
  listWalls(sceneId: string): readonly PassageWall[];
  /** Opens the door if it is still closed; resolves to whether it did. */
  openDoor(sceneId: string, wallId: string): Promise<boolean>;
}

export interface SceneGrid {
  readonly size: number | null;
  readonly distance: number | null;
  readonly units: string | null;
}

export interface SceneGridReader {
  readGrid(sceneId: string): SceneGrid;
}

/** The current user's targets on the canvas. */
export interface TokenTargeting {
  isAvailable(): boolean;
  /** False when the token is not on the canvas. */
  setTarget(tokenId: string, targeted: boolean, releaseOthers: boolean): boolean;
  /** Releases every target and returns how many there were. */
  clearTargets(): number;
}
