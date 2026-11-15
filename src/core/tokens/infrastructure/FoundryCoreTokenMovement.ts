import { foundryGeneration } from '@/compat/foundryVersion';
import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import {
  TOKEN_MOVEMENT_STATES,
  TokenNotFoundError,
  type CoreMovementOptions,
  type CoreMovementWaypoint,
  type CoreTokenMovement,
  type MovementHistoryEntry,
  type PathMeasurement,
  type PathWaypoint,
  type TokenMovementHistory,
  type TokenMovementState,
  type TokenMovementStatus
} from '@/core/tokens/domain';
import type {
  FoundryMeasuredPath,
  FoundryMovableToken,
  FoundryMovementGame,
  FoundryMovementScene,
  FoundryMovementGlobals,
  FoundryPathWaypoint
} from './foundryMovementTypes';

export type MovementGameProvider = GameProvider<FoundryMovementGame>;
export type MovementGlobalsProvider = () => FoundryMovementGlobals;

const fromGlobalThis: MovementGlobalsProvider = () => globalThis as unknown as FoundryMovementGlobals;

/** How long `move` waits for Foundry 14's movement promise, which only settles once the token has arrived. */
export const MOVE_WAIT_MS = 15_000;

/** Resolves after the delay, or at once (clearing its timer) when the signal aborts. */
function delay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

function toState(state: string): TokenMovementState {
  return (TOKEN_MOVEMENT_STATES as readonly string[]).includes(state) ? (state as TokenMovementState) : 'completed';
}

/** The core serializes an infinite cost as null. */
function finite(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toMeasurement(result: FoundryMeasuredPath, costBasis: PathMeasurement['costBasis']): PathMeasurement {
  return {
    distance: result.distance,
    cost: finite(result.cost),
    spaces: result.spaces,
    diagonals: result.diagonals,
    segments: result.segments.map((segment) => ({
      distance: segment.distance,
      cost: finite(segment.cost),
      spaces: segment.spaces,
      diagonals: segment.diagonals
    })),
    costBasis
  };
}

function toCoreWaypoints(waypoints: readonly CoreMovementWaypoint[]): Record<string, unknown>[] {
  return waypoints.map((waypoint) => {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(waypoint)) {
      if (value !== undefined) {
        data[key] = value;
      }
    }
    return data;
  });
}

function toPathWaypoint(waypoint: FoundryPathWaypoint): PathWaypoint {
  return { x: waypoint.x, y: waypoint.y, elevation: waypoint.elevation, action: waypoint.action };
}

/**
 * The movement API of `TokenDocument` (Foundry 13.351 and 14.368): `move`,
 * `stopMovement`, `pauseMovement(key)`, `resumeMovement`,
 * `measureMovementPath`, `revertRecordedMovement`, `clearMovementHistory`,
 * `Scene#clearMovementHistories`, `Combat#clearMovementHistories`, and the
 * placeable's `measureMovementPath` / `findMovementPath`, which need the
 * token on the canvas. Foundry 14 also takes the constrain options of the
 * pathfinder inside `constrainOptions`; 13 takes them at the top level.
 */
export class FoundryCoreTokenMovement implements CoreTokenMovement, TokenMovementHistory {
  constructor(
    private readonly gameProvider: MovementGameProvider,
    private readonly globals: MovementGlobalsProvider = fromGlobalThis,
    private readonly generation: () => number = foundryGeneration,
    private readonly wait: (milliseconds: number, signal: AbortSignal) => Promise<void> = delay
  ) {}

  isAvailable(): boolean {
    const generation = this.generation();
    return generation === 0 || generation >= 13;
  }

  movementActions(): readonly string[] | null {
    const actions = this.globals().CONFIG?.Token?.movement?.actions;
    return actions ? Object.keys(actions) : null;
  }

  status(sceneId: string, tokenId: string): TokenMovementStatus | null {
    const token = this.requireScene(sceneId).tokens.get(tokenId);
    if (token === undefined) {
      return null;
    }
    const movement = token.movement;
    const user = movement.user ?? null;
    return {
      x: token.x,
      y: token.y,
      elevation: token.elevation,
      state: toState(movement.state),
      movementId: movement.id !== '' ? movement.id : null,
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      startedHere: user?.isSelf ?? true
    };
  }

  async move(
    sceneId: string,
    tokenId: string,
    waypoints: readonly CoreMovementWaypoint[],
    options: CoreMovementOptions
  ): Promise<void> {
    const token = this.requireToken(sceneId, tokenId);
    const moving = token.move(toCoreWaypoints(waypoints), {
      constrainOptions: { ignoreWalls: options.ignoreWalls, ignoreCost: options.ignoreCost },
      autoRotate: options.autoRotate,
      showRuler: options.showRuler
    });
    const settled = new AbortController();
    try {
      await Promise.race([moving, this.wait(MOVE_WAIT_MS, settled.signal)]);
    } finally {
      settled.abort();
    }
  }

  stop(sceneId: string, tokenId: string): boolean {
    return this.requireToken(sceneId, tokenId).stopMovement();
  }

  /**
   * The keyed form returns a promise that settles once the movement resumes;
   * it is not awaited. A second pause with the same key throws in the core;
   * the movement is paused already then.
   */
  pause(sceneId: string, tokenId: string, key: string): boolean {
    const token = this.requireToken(sceneId, tokenId);
    try {
      const resumed = token.pauseMovement(key);
      if (resumed !== null) {
        resumed.catch(() => undefined);
        return true;
      }
    } catch {
      // Already paused with this key.
    }
    return token.movement.state === 'paused';
  }

  resume(sceneId: string, tokenId: string, movementId: string, key: string): void {
    this.requireToken(sceneId, tokenId).resumeMovement(movementId, key);
  }

  /** From the token's position: an empty first waypoint takes the token's own position and movement action. */
  measure(sceneId: string, tokenId: string, waypoints: readonly CoreMovementWaypoint[]): PathMeasurement {
    const token = this.requireToken(sceneId, tokenId);
    const path = [{}, ...toCoreWaypoints(waypoints)];
    const placeable = token.object ?? null;
    return placeable
      ? toMeasurement(placeable.measureMovementPath(path), 'terrain')
      : toMeasurement(token.measureMovementPath(path), 'distance');
  }

  canFindPath(sceneId: string, tokenId: string): boolean {
    return Boolean(this.requireScene(sceneId).tokens.get(tokenId)?.object);
  }

  async findPath(
    sceneId: string,
    tokenId: string,
    waypoints: readonly CoreMovementWaypoint[],
    options: Pick<CoreMovementOptions, 'ignoreWalls' | 'ignoreCost'>
  ): Promise<readonly PathWaypoint[]> {
    const token = this.requireToken(sceneId, tokenId);
    const placeable = token.object;
    if (!placeable) {
      return [];
    }
    const origin = { x: token.x, y: token.y, elevation: token.elevation };
    const constrain = { ignoreWalls: options.ignoreWalls, ignoreCost: options.ignoreCost, history: false };
    const generation = this.generation();
    const job = placeable.findMovementPath(
      [origin, ...toCoreWaypoints(waypoints)],
      generation === 0 || generation >= 14 ? { constrainOptions: constrain } : constrain
    );
    const path = await job.promise;
    return (path ?? []).map(toPathWaypoint);
  }

  units(sceneId: string): string {
    return this.requireScene(sceneId).grid?.units ?? '';
  }

  history(sceneId: string, tokenId: string): readonly MovementHistoryEntry[] {
    return (this.requireScene(sceneId).tokens.get(tokenId)?._source._movementHistory ?? []).map((waypoint) => ({
      x: waypoint.x,
      y: waypoint.y,
      elevation: waypoint.elevation,
      action: waypoint.action,
      movementId: waypoint.movementId,
      userId: waypoint.userId ?? null,
      cost: finite(waypoint.cost),
      checkpoint: waypoint.checkpoint === true,
      explicit: waypoint.explicit === true,
      snapped: waypoint.snapped === true,
      intermediate: waypoint.intermediate === true
    }));
  }

  revert(sceneId: string, tokenId: string, movementId: string): Promise<boolean> {
    return this.requireToken(sceneId, tokenId).revertRecordedMovement(movementId);
  }

  async clearToken(sceneId: string, tokenId: string): Promise<void> {
    await this.requireToken(sceneId, tokenId).clearMovementHistory();
  }

  async clearScene(sceneId: string): Promise<readonly string[]> {
    const scene = this.requireScene(sceneId);
    const tokenIds = scene.tokens.contents.filter(hasHistory).map((token) => token.id);
    await scene.clearMovementHistories();
    return tokenIds;
  }

  hasCombat(combatId: string): boolean {
    return this.gameProvider.getGame().combats.get(combatId) !== undefined;
  }

  async clearCombat(combatId: string): Promise<readonly string[]> {
    const combat = this.gameProvider.getGame().combats.get(combatId);
    if (combat === undefined) {
      return [];
    }
    const tokenIds = combat.combatants.contents
      .map((combatant) => combatant.token)
      .filter((token): token is FoundryMovableToken => token !== null && token !== undefined && hasHistory(token))
      .map((token) => token.id);
    await combat.clearMovementHistories();
    return [...new Set(tokenIds)];
  }

  private requireToken(sceneId: string, tokenId: string): FoundryMovableToken {
    const token = this.requireScene(sceneId).tokens.get(tokenId);
    if (token === undefined) {
      throw new TokenNotFoundError(tokenId);
    }
    return token;
  }

  private requireScene(sceneId: string): FoundryMovementScene {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return scene;
  }
}

function hasHistory(token: FoundryMovableToken): boolean {
  return token._source._movementHistory.length > 0;
}
