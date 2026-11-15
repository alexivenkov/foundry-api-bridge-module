import { CoreFeatureUnavailableError, requireScene, type SceneLocator } from '@/core/shared';
import {
  HistoryScopeConflictError,
  MovementCombatNotFoundError,
  MovementStartedElsewhereError,
  NoTokenMovementError,
  RecordedMovementNotFoundError,
  TokenNotFoundError,
  TokenNotOnCanvasError,
  assertKnownTokenRegistryId,
  historyMovementIds,
  pathDestination,
  samePosition,
  totalHistoryCost,
  type CoreMovementWaypoint,
  type CoreTokenMovement,
  type MovementHistoryEntry,
  type PathMeasurement,
  type PathWaypoint,
  type TokenMovementHistory,
  type TokenMovementStatus
} from '@/core/tokens/domain';
import type {
  ClearMovementHistoryCommand,
  FindTokenPathQuery,
  MeasureTokenPathQuery,
  MoveTokenPathCommand,
  PauseTokenMovementCommand,
  ResumeTokenMovementCommand,
  RevertTokenMovementCommand,
  TokenMovementQuery
} from './commands';

export interface TokenCoreMovementServiceDependencies {
  readonly scenes: SceneLocator;
  readonly movement: CoreTokenMovement;
  readonly history: TokenMovementHistory;
}

export interface MovementStatusResult {
  readonly sceneId: string;
  readonly tokenId: string;
  readonly status: TokenMovementStatus;
}

export interface PathMovementResult extends MovementStatusResult {
  readonly moved: boolean;
  readonly arrived: boolean;
}

export interface MovementToggleResult extends MovementStatusResult {
  /** The movement was or is stopped / paused. */
  readonly done: boolean;
}

export interface PathMeasurementResult {
  readonly sceneId: string;
  readonly tokenId: string;
  readonly units: string;
  readonly measurement: PathMeasurement;
}

export interface FoundPathResult {
  readonly sceneId: string;
  readonly tokenId: string;
  readonly waypoints: readonly PathWaypoint[];
  readonly complete: boolean;
}

export interface MovementHistoryResult {
  readonly sceneId: string;
  readonly tokenId: string;
  readonly entries: readonly MovementHistoryEntry[];
  readonly cost: number | null;
  readonly movementIds: readonly string[];
}

export interface HistoryClearResult {
  readonly scope: 'token' | 'scene' | 'combat';
  readonly sceneId: string | null;
  readonly combatId: string | null;
  readonly tokenIds: readonly string[];
}

export const DEFAULT_PAUSE_KEY = 'foundry-api-bridge';

function isInProgress(status: TokenMovementStatus): boolean {
  return status.state === 'pending' || status.state === 'paused' || status.state === 'planned';
}

/**
 * The core's own movement API (Foundry 13+): movement along waypoints with
 * its wall and terrain rules, the movement lifecycle, measurement, the
 * pathfinder, and the movement history kept during combat.
 */
export class TokenCoreMovementService {
  constructor(private readonly deps: TokenCoreMovementServiceDependencies) {}

  async moveAlongPath(command: MoveTokenPathCommand): Promise<PathMovementResult> {
    const { sceneId, before } = this.locate(command);
    this.assertActions(command.waypoints);
    await this.deps.movement.move(sceneId, command.tokenId, command.waypoints, command.options);
    const after = this.requireStatus(sceneId, command.tokenId);
    return {
      sceneId,
      tokenId: command.tokenId,
      status: after,
      moved: !samePosition(before, after),
      arrived: samePosition(pathDestination(before, command.waypoints), after)
    };
  }

  /** A finished movement is left alone: the core refuses even that for a movement another user started. */
  stop(query: TokenMovementQuery): MovementToggleResult {
    const { sceneId, before } = this.locate(query);
    let done = before.state === 'stopped';
    if (isInProgress(before)) {
      this.assertStartedHere('stop', before);
      done = this.deps.movement.stop(sceneId, query.tokenId);
    }
    return { sceneId, tokenId: query.tokenId, status: this.requireStatus(sceneId, query.tokenId), done };
  }

  /** Pausing a paused movement adds this key to the ones that hold it, as the core does. */
  pause(command: PauseTokenMovementCommand): MovementToggleResult {
    const { sceneId, before } = this.locate(command);
    let done = false;
    if (isInProgress(before)) {
      this.assertStartedHere('pause', before);
      done = this.deps.movement.pause(sceneId, command.tokenId, command.key);
    }
    return { sceneId, tokenId: command.tokenId, status: this.requireStatus(sceneId, command.tokenId), done };
  }

  resume(command: ResumeTokenMovementCommand): MovementStatusResult {
    const { sceneId, before } = this.locate(command);
    const movementId = command.movementId ?? before.movementId;
    if (movementId === null) {
      throw new NoTokenMovementError(command.tokenId);
    }
    this.deps.movement.resume(sceneId, command.tokenId, movementId, command.key);
    return { sceneId, tokenId: command.tokenId, status: this.requireStatus(sceneId, command.tokenId) };
  }

  measure(query: MeasureTokenPathQuery): PathMeasurementResult {
    const { sceneId } = this.locate(query);
    this.assertActions(query.waypoints);
    return {
      sceneId,
      tokenId: query.tokenId,
      units: this.deps.movement.units(sceneId),
      measurement: this.deps.movement.measure(sceneId, query.tokenId, query.waypoints)
    };
  }

  async findPath(query: FindTokenPathQuery): Promise<FoundPathResult> {
    const { sceneId, before } = this.locate(query);
    this.assertActions(query.waypoints);
    if (!this.deps.movement.canFindPath(sceneId, query.tokenId)) {
      throw new TokenNotOnCanvasError(query.tokenId);
    }
    const waypoints = await this.deps.movement.findPath(sceneId, query.tokenId, query.waypoints, query.options);
    const last = waypoints.at(-1);
    return {
      sceneId,
      tokenId: query.tokenId,
      waypoints,
      complete: last !== undefined && samePosition(pathDestination(before, query.waypoints), last)
    };
  }

  getHistory(query: TokenMovementQuery): MovementHistoryResult {
    const { sceneId } = this.locate(query);
    const all = this.deps.history.history(sceneId, query.tokenId);
    return {
      sceneId,
      tokenId: query.tokenId,
      entries: all.filter((entry) => !entry.intermediate),
      cost: totalHistoryCost(all),
      movementIds: historyMovementIds(all)
    };
  }

  /** Undoes the given recorded movement and every later one; the last one by default. */
  async revert(command: RevertTokenMovementCommand): Promise<MovementToggleResult> {
    const { sceneId } = this.locate(command);
    const movementIds = historyMovementIds(this.deps.history.history(sceneId, command.tokenId));
    const movementId = command.movementId ?? movementIds.at(-1);
    let done = false;
    if (movementId !== undefined) {
      if (!movementIds.includes(movementId)) {
        throw new RecordedMovementNotFoundError(movementId);
      }
      done = await this.deps.history.revert(sceneId, command.tokenId, movementId);
    }
    return { sceneId, tokenId: command.tokenId, status: this.requireStatus(sceneId, command.tokenId), done };
  }

  async clearHistory(command: ClearMovementHistoryCommand): Promise<HistoryClearResult> {
    this.assertAvailable();
    if (command.tokenId !== undefined && command.combatId !== undefined) {
      throw new HistoryScopeConflictError();
    }
    if (command.combatId !== undefined) {
      if (!this.deps.history.hasCombat(command.combatId)) {
        throw new MovementCombatNotFoundError(command.combatId);
      }
      const tokenIds = await this.deps.history.clearCombat(command.combatId);
      return { scope: 'combat', sceneId: null, combatId: command.combatId, tokenIds };
    }
    const scene = requireScene(this.deps.scenes, command.sceneId);
    if (command.tokenId !== undefined) {
      const tokenId = command.tokenId;
      const hadHistory = this.requireHistory(scene.id, tokenId).length > 0;
      if (hadHistory) {
        await this.deps.history.clearToken(scene.id, tokenId);
      }
      return { scope: 'token', sceneId: scene.id, combatId: null, tokenIds: hadHistory ? [tokenId] : [] };
    }
    const tokenIds = await this.deps.history.clearScene(scene.id);
    return { scope: 'scene', sceneId: scene.id, combatId: null, tokenIds };
  }

  private assertAvailable(): void {
    if (!this.deps.movement.isAvailable()) {
      throw new CoreFeatureUnavailableError('Core token movement requires Foundry 13 or newer');
    }
  }

  private locate(query: TokenMovementQuery): { sceneId: string; before: TokenMovementStatus } {
    this.assertAvailable();
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { sceneId: scene.id, before: this.requireStatus(scene.id, query.tokenId) };
  }

  private requireStatus(sceneId: string, tokenId: string): TokenMovementStatus {
    const status = this.deps.movement.status(sceneId, tokenId);
    if (status === null) {
      throw new TokenNotFoundError(tokenId);
    }
    return status;
  }

  private requireHistory(sceneId: string, tokenId: string): readonly MovementHistoryEntry[] {
    this.requireStatus(sceneId, tokenId);
    return this.deps.history.history(sceneId, tokenId);
  }

  private assertStartedHere(action: 'stop' | 'pause', status: TokenMovementStatus): void {
    if (!status.startedHere) {
      throw new MovementStartedElsewhereError(action, status.userName);
    }
  }

  private assertActions(waypoints: readonly CoreMovementWaypoint[]): void {
    const known = this.deps.movement.movementActions();
    for (const waypoint of waypoints) {
      assertKnownTokenRegistryId('movement action', waypoint.action, known);
    }
  }
}
