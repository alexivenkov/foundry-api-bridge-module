import { emptyAsAbsent } from '@/core/shared';
import {
  DEFAULT_PAUSE_KEY,
  type ClearMovementHistoryCommand,
  type FindTokenPathQuery,
  type MeasureTokenPathQuery,
  type MoveTokenPathCommand,
  type PauseTokenMovementCommand,
  type ResumeTokenMovementCommand,
  type RevertTokenMovementCommand,
  type TokenMovementQuery
} from '@/core/tokens/application';
import type {
  ClearTokenMovementHistoryRequest,
  FindTokenPathRequest,
  MeasureTokenPathRequest,
  MoveTokenPathRequest,
  PauseTokenMovementRequest,
  ResumeTokenMovementRequest,
  RevertTokenMovementRequest,
  TokenMovementRequest
} from './movementSchemas';

export function toTokenMovementQuery(request: TokenMovementRequest): TokenMovementQuery {
  return { sceneId: emptyAsAbsent(request.sceneId), tokenId: request.tokenId };
}

export function toMoveTokenPathCommand(request: MoveTokenPathRequest): MoveTokenPathCommand {
  return {
    ...toTokenMovementQuery(request),
    waypoints: request.waypoints,
    options: {
      ignoreWalls: request.ignoreWalls === true,
      ignoreCost: request.ignoreCost === true,
      autoRotate: request.autoRotate === true,
      showRuler: request.showRuler === true
    }
  };
}

export function toPauseTokenMovementCommand(request: PauseTokenMovementRequest): PauseTokenMovementCommand {
  return { ...toTokenMovementQuery(request), key: request.key ?? DEFAULT_PAUSE_KEY };
}

export function toResumeTokenMovementCommand(request: ResumeTokenMovementRequest): ResumeTokenMovementCommand {
  return { ...toTokenMovementQuery(request), movementId: request.movementId, key: request.key ?? DEFAULT_PAUSE_KEY };
}

export function toMeasureTokenPathQuery(request: MeasureTokenPathRequest): MeasureTokenPathQuery {
  return { ...toTokenMovementQuery(request), waypoints: request.waypoints };
}

export function toFindTokenPathQuery(request: FindTokenPathRequest): FindTokenPathQuery {
  return {
    ...toTokenMovementQuery(request),
    waypoints: request.waypoints,
    options: { ignoreWalls: request.ignoreWalls === true, ignoreCost: request.ignoreCost === true }
  };
}

export function toRevertTokenMovementCommand(request: RevertTokenMovementRequest): RevertTokenMovementCommand {
  return { ...toTokenMovementQuery(request), movementId: request.movementId };
}

export function toClearMovementHistoryCommand(request: ClearTokenMovementHistoryRequest): ClearMovementHistoryCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    tokenId: emptyAsAbsent(request.tokenId),
    combatId: emptyAsAbsent(request.combatId)
  };
}
