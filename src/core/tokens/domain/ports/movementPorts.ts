import type {
  CoreMovementOptions,
  CoreMovementWaypoint,
  MovementHistoryEntry,
  PathMeasurement,
  PathWaypoint,
  TokenMovementStatus
} from '@/core/tokens/domain/model/CoreMovement';

/** The core's token movement API (Foundry 13+), for tokens of a scene. Reads return null for a missing token. */
export interface CoreTokenMovement {
  isAvailable(): boolean;
  /** The movement action ids the world registers; null when they cannot be read. */
  movementActions(): readonly string[] | null;
  status(sceneId: string, tokenId: string): TokenMovementStatus | null;
  /** Resolves when the core has accepted the movement, or after a bounded wait while it is still running. */
  move(
    sceneId: string,
    tokenId: string,
    waypoints: readonly CoreMovementWaypoint[],
    options: CoreMovementOptions
  ): Promise<void>;
  /** True when the movement was or is stopped; only for a movement started here. */
  stop(sceneId: string, tokenId: string): boolean;
  /** True when the movement was or is paused; only for a movement started here. */
  pause(sceneId: string, tokenId: string, key: string): boolean;
  resume(sceneId: string, tokenId: string, movementId: string, key: string): void;
  /** Measures from the token's position through the waypoints. */
  measure(sceneId: string, tokenId: string, waypoints: readonly CoreMovementWaypoint[]): PathMeasurement;
  /** The core pathfinder needs the token on the canvas. */
  canFindPath(sceneId: string, tokenId: string): boolean;
  findPath(
    sceneId: string,
    tokenId: string,
    waypoints: readonly CoreMovementWaypoint[],
    options: Pick<CoreMovementOptions, 'ignoreWalls' | 'ignoreCost'>
  ): Promise<readonly PathWaypoint[]>;
  /** The scene's distance unit label. */
  units(sceneId: string): string;
}

export interface TokenMovementHistory {
  history(sceneId: string, tokenId: string): readonly MovementHistoryEntry[];
  /** Undoes the movement and every later one; false when the core undid nothing. */
  revert(sceneId: string, tokenId: string, movementId: string): Promise<boolean>;
  clearToken(sceneId: string, tokenId: string): Promise<void>;
  /** Clears every token of the scene; returns the tokens that had a history. */
  clearScene(sceneId: string): Promise<readonly string[]>;
  hasCombat(combatId: string): boolean;
  /** Clears the tokens of the combat's combatants; returns those that had a history. */
  clearCombat(combatId: string): Promise<readonly string[]>;
}
