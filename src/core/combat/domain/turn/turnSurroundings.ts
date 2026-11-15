import type { BattlefieldGrid, BattlefieldToken } from '@/core/combat/domain/model/Battlefield';

export interface GridCell {
  readonly column: number;
  readonly row: number;
}

/** The block of cells a token covers. */
export interface Footprint extends GridCell {
  readonly columns: number;
  readonly rows: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Answers whether something blocks sight between two points of the scene. */
export type SightTest = (from: Point, to: Point) => boolean;

type Positioned = Pick<BattlefieldToken, 'x' | 'y'>;
type Sized = Pick<BattlefieldToken, 'x' | 'y' | 'width' | 'height'>;

/** How far the map of a turn reaches from the current combatant, in cells. */
export const TURN_MAP_RADIUS = 12;

/** The cell the token's top-left corner is in. */
export function cellOf(token: Positioned, cellSize: number): GridCell {
  return { column: Math.floor(token.x / cellSize), row: Math.floor(token.y / cellSize) };
}

// A size is rounded to the nearest half cell, and a started cell counts as a
// whole one — the way the core counts the grid spaces a token occupies.
function cellsCovered(size: number): number {
  return Math.max(1, Math.ceil(Math.round(size * 2) / 2));
}

/** The cells a token covers, from the cell of its top-left corner. Every grid is read as a square one. */
export function footprintOf(token: Sized, cellSize: number): Footprint {
  return { ...cellOf(token, cellSize), columns: cellsCovered(token.width), rows: cellsCovered(token.height) };
}

function gap(start: number, length: number, otherStart: number, otherLength: number): number {
  return Math.max(0, otherStart - (start + length - 1), start - (otherStart + otherLength - 1));
}

/**
 * Cells from one footprint to the other, where a diagonal step costs as much
 * as a straight one: 0 when they share a cell, 1 when they touch.
 */
export function footprintDistance(from: Footprint, to: Footprint): number {
  return Math.max(
    gap(from.column, from.columns, to.column, to.columns),
    gap(from.row, from.rows, to.row, to.rows)
  );
}

/** The middle of the token: the point it sees from and is seen at. */
export function centreOf(token: Sized, cellSize: number): Point {
  return { x: token.x + (token.width * cellSize) / 2, y: token.y + (token.height * cellSize) / 2 };
}

export interface NearbyToken {
  readonly token: BattlefieldToken;
  readonly cell: GridCell;
  /** From the current combatant, in the units of the scene grid. */
  readonly distance: number;
  readonly lineOfSight: boolean;
}

export interface TurnSurroundings {
  /** The token of the combatant whose turn it is. */
  readonly current: BattlefieldToken;
  readonly tokens: readonly BattlefieldToken[];
  readonly participantTokenIds: ReadonlySet<string>;
  readonly grid: BattlefieldGrid;
  /** Absent when nothing can answer sight tests: every token then counts as visible. */
  readonly sightTest?: SightTest | undefined;
}

/** The tokens of the scene that take part in the encounter, in scene order. */
export function participantTokens(
  tokens: readonly BattlefieldToken[],
  participantTokenIds: ReadonlySet<string>
): BattlefieldToken[] {
  return tokens.filter((token) => participantTokenIds.has(token.id));
}

/** The other participants around the current combatant, nearest first. */
export function surveyNearbyTokens(surroundings: TurnSurroundings): NearbyToken[] {
  const { current, grid, sightTest } = surroundings;
  const ground = footprintOf(current, grid.size);
  const eye = centreOf(current, grid.size);

  return participantTokens(surroundings.tokens, surroundings.participantTokenIds)
    .filter((token) => token.id !== current.id)
    .map((token) => ({
      token,
      cell: cellOf(token, grid.size),
      distance: footprintDistance(ground, footprintOf(token, grid.size)) * grid.distance,
      lineOfSight: sightTest === undefined || !sightTest(eye, centreOf(token, grid.size))
    }))
    .sort((nearer, farther) => nearer.distance - farther.distance);
}
