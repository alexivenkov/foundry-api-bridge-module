export const TOKEN_MOVEMENT_STATES = ['completed', 'pending', 'paused', 'stopped', 'planned'] as const;
export type TokenMovementState = (typeof TOKEN_MOVEMENT_STATES)[number];

/** One step of a movement through the core's movement API; omitted fields carry over from the previous one. */
export interface CoreMovementWaypoint {
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly elevation?: number | undefined;
  readonly action?: string | undefined;
  readonly snapped?: boolean | undefined;
  readonly explicit?: boolean | undefined;
  readonly checkpoint?: boolean | undefined;
}

export interface CoreMovementOptions {
  readonly ignoreWalls: boolean;
  readonly ignoreCost: boolean;
  readonly autoRotate: boolean;
  readonly showRuler: boolean;
}

export interface TokenPosition {
  readonly x: number;
  readonly y: number;
  readonly elevation: number;
}

/** A token's movement as the core tracks it, and where the token stands. */
export interface TokenMovementStatus extends TokenPosition {
  readonly state: TokenMovementState;
  /** null when the token has not moved since the scene was loaded. */
  readonly movementId: string | null;
  readonly userId: string | null;
  readonly userName: string | null;
  /** The movement was started by the user this module acts as. */
  readonly startedHere: boolean;
}

export interface PathSegmentMeasurement {
  readonly distance: number;
  /** null = impassable. */
  readonly cost: number | null;
  readonly spaces: number;
  readonly diagonals: number;
}

export interface PathMeasurement {
  readonly distance: number;
  readonly cost: number | null;
  readonly spaces: number;
  readonly diagonals: number;
  readonly segments: readonly PathSegmentMeasurement[];
  /** `terrain` when the token's own cost rules were applied, `distance` when cost equals distance. */
  readonly costBasis: 'terrain' | 'distance';
}

export interface PathWaypoint extends TokenPosition {
  readonly action: string;
}

export interface MovementHistoryEntry extends TokenPosition {
  readonly action: string;
  readonly movementId: string;
  readonly userId: string | null;
  /** null = impassable or unknown. */
  readonly cost: number | null;
  readonly checkpoint: boolean;
  readonly explicit: boolean;
  readonly snapped: boolean;
  /** Added by the core at region boundaries rather than requested. */
  readonly intermediate: boolean;
}

/** Where a path ends: each waypoint's given coordinates, the previous ones' (from the token) otherwise. */
export function pathDestination(origin: TokenPosition, waypoints: readonly CoreMovementWaypoint[]): TokenPosition {
  return waypoints.reduce<TokenPosition>(
    (position, waypoint) => ({
      x: waypoint.x ?? position.x,
      y: waypoint.y ?? position.y,
      elevation: waypoint.elevation ?? position.elevation
    }),
    origin
  );
}

export function samePosition(a: TokenPosition, b: TokenPosition): boolean {
  return Math.round(a.x) === Math.round(b.x) && Math.round(a.y) === Math.round(b.y) && a.elevation === b.elevation;
}

/** The total of the recorded costs; one impassable or unknown segment makes it unknown. */
export function totalHistoryCost(entries: readonly MovementHistoryEntry[]): number | null {
  let total = 0;
  for (const entry of entries) {
    if (entry.cost === null) {
      return null;
    }
    total += entry.cost;
  }
  return total;
}

/** The distinct movements of a history, oldest first. */
export function historyMovementIds(entries: readonly MovementHistoryEntry[]): string[] {
  return [...new Set(entries.map((entry) => entry.movementId))];
}
