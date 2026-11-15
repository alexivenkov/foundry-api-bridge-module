import type { FoundryScenesGame } from '@/core/shared';

/** `GridMeasurePathResult` (Foundry 13–14); an impassable cost is `Infinity`. */
export interface FoundryMeasuredPath {
  distance: number;
  cost: number;
  spaces: number;
  diagonals: number;
  segments: Array<{ distance: number; cost: number; spaces: number; diagonals: number }>;
}

export interface FoundryPathWaypoint {
  x: number;
  y: number;
  elevation: number;
  action: string;
}

/** A stored `_movementHistory` entry; `cost` null stands for an infinite cost. */
export interface FoundryHistoryWaypoint {
  x: number;
  y: number;
  elevation: number;
  action: string;
  movementId: string;
  userId?: string | null;
  cost?: number | null;
  checkpoint?: boolean;
  explicit?: boolean;
  snapped?: boolean;
  intermediate?: boolean;
}

/** `TokenDocument#movement`; `user` is the User document that started it. */
export interface FoundryTokenMovementData {
  id: string;
  state: string;
  user?: { id: string; name?: string; isSelf?: boolean } | null;
}

export interface FoundryTokenPlaceable {
  measureMovementPath(waypoints: Record<string, unknown>[]): FoundryMeasuredPath;
  findMovementPath(
    waypoints: Record<string, unknown>[],
    options: Record<string, unknown>
  ): { promise: Promise<FoundryPathWaypoint[] | null> };
}

/** The movement API of a Token document (Foundry 13–14). */
export interface FoundryMovableToken {
  id: string;
  x: number;
  y: number;
  elevation: number;
  movement: FoundryTokenMovementData;
  _source: { _movementHistory: FoundryHistoryWaypoint[] };
  /** The placeable, while the token's scene is on the canvas. */
  object?: FoundryTokenPlaceable | null;
  move(waypoints: Record<string, unknown>[], options: Record<string, unknown>): Promise<boolean>;
  stopMovement(): boolean;
  pauseMovement(key: string): Promise<boolean> | null;
  resumeMovement(movementId: string, key: string): void;
  measureMovementPath(waypoints: Record<string, unknown>[]): FoundryMeasuredPath;
  revertRecordedMovement(movementId?: string): Promise<boolean>;
  clearMovementHistory(): Promise<void>;
}

export interface FoundryMovementScene {
  id: string;
  name?: string;
  grid?: { units?: string } | undefined;
  tokens: { get(id: string): FoundryMovableToken | undefined; contents: FoundryMovableToken[] };
  clearMovementHistories(): Promise<void>;
}

export interface FoundryMovementCombat {
  combatants: { contents: Array<{ token?: FoundryMovableToken | null }> };
  clearMovementHistories(): Promise<void>;
}

export interface FoundryMovementGame extends FoundryScenesGame<FoundryMovementScene> {
  combats: { get(id: string): FoundryMovementCombat | undefined };
}

export interface FoundryMovementGlobals {
  CONFIG?: { Token?: { movement?: { actions?: Record<string, unknown> | undefined } | undefined } };
}
