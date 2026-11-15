// Grid vocabulary of the commands. The core's numeric codes are mapped in infrastructure.

export const GRID_TYPES = ['gridless', 'square', 'hexPointyOdd', 'hexPointyEven', 'hexFlatOdd', 'hexFlatEven'] as const;
export type GridType = (typeof GRID_TYPES)[number];

export const GRID_DIAGONAL_RULES = [
  'equidistant',
  'exact',
  'approximate',
  'rectilinear',
  'alternating1',
  'alternating2',
  'illegal'
] as const;
export type GridDiagonalRule = (typeof GRID_DIAGONAL_RULES)[number];

export const GRID_SNAPPING_MODES = [
  'center',
  'edgeMidpoint',
  'vertex',
  'topLeftVertex',
  'topRightVertex',
  'bottomLeftVertex',
  'bottomRightVertex',
  'corner',
  'topLeftCorner',
  'topRightCorner',
  'bottomLeftCorner',
  'bottomRightCorner',
  'sideMidpoint',
  'topSideMidpoint',
  'bottomSideMidpoint',
  'leftSideMidpoint',
  'rightSideMidpoint'
] as const;
export type GridSnappingMode = (typeof GRID_SNAPPING_MODES)[number];

/** A point in scene pixels. */
export interface ScenePoint {
  readonly x: number;
  readonly y: number;
}

export interface GridWaypoint extends ScenePoint {
  /** Grid units. */
  readonly elevation?: number | undefined;
  readonly teleport?: boolean | undefined;
}

export interface GridMeasurement {
  readonly distance: number;
  readonly cost: number;
  readonly spaces: number;
  readonly diagonals: number;
  readonly euclidean: number;
}

export interface GridPathMeasurement extends GridMeasurement {
  readonly segments: readonly GridMeasurement[];
}

export interface SceneGrid {
  readonly type: GridType;
  readonly units: string;
  /** Null on a gridless scene. */
  readonly diagonalRule: GridDiagonalRule | null;
}

export interface GridSnapping {
  /** The nearest candidate of any of the modes wins. */
  readonly modes: readonly GridSnappingMode[];
  readonly resolution: number;
}
