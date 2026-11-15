import type {
  MeasureTokenPathResult,
  TokenMovementHistoryEntry,
  TokenMovementSnapshot
} from '@/commands/types';
import type {
  CoreMovementWiring,
  MovementHistoryEntry,
  MovementStatusResult,
  PathMeasurementResult
} from '@/core/tokens';

export type TokenMovementHandlerDependencies = CoreMovementWiring;

export function toWireMovementSnapshot({ sceneId, tokenId, status }: MovementStatusResult): TokenMovementSnapshot {
  return {
    sceneId,
    tokenId,
    state: status.state,
    movementId: status.movementId,
    userId: status.userId,
    x: status.x,
    y: status.y,
    elevation: status.elevation
  };
}

export function toWireMeasurement({ sceneId, tokenId, units, measurement }: PathMeasurementResult): MeasureTokenPathResult {
  return {
    sceneId,
    tokenId,
    distance: measurement.distance,
    cost: measurement.cost,
    spaces: measurement.spaces,
    diagonals: measurement.diagonals,
    units,
    segments: measurement.segments.map((segment) => ({ ...segment })),
    costBasis: measurement.costBasis
  };
}

export function toWireHistoryEntry(entry: MovementHistoryEntry): TokenMovementHistoryEntry {
  return {
    x: entry.x,
    y: entry.y,
    elevation: entry.elevation,
    action: entry.action,
    movementId: entry.movementId,
    userId: entry.userId,
    cost: entry.cost,
    checkpoint: entry.checkpoint,
    explicit: entry.explicit,
    snapped: entry.snapped
  };
}
