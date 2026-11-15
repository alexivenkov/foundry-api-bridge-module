import type { GridDiagonalRule, GridSnappingMode, GridType, ScrollingTextAnchor } from '@/core/ui/domain';

// Constants of common/constants.mjs, identical in Foundry 13.351 and 14.368.

/** CONST.GRID_SNAPPING_MODES. */
const SNAPPING_MODE_CODE: Readonly<Record<GridSnappingMode, number>> = {
  center: 0x1,
  edgeMidpoint: 0x2,
  topLeftVertex: 0x10,
  topRightVertex: 0x20,
  bottomLeftVertex: 0x40,
  bottomRightVertex: 0x80,
  vertex: 0xf0,
  topLeftCorner: 0x100,
  topRightCorner: 0x200,
  bottomLeftCorner: 0x400,
  bottomRightCorner: 0x800,
  corner: 0xf00,
  topSideMidpoint: 0x1000,
  bottomSideMidpoint: 0x2000,
  leftSideMidpoint: 0x4000,
  rightSideMidpoint: 0x8000,
  sideMidpoint: 0xf000
};

/** CONST.GRID_DIAGONALS. */
const DIAGONAL_RULE_BY_CODE: Readonly<Record<number, GridDiagonalRule>> = {
  0: 'equidistant',
  1: 'exact',
  2: 'approximate',
  3: 'rectilinear',
  4: 'alternating1',
  5: 'alternating2',
  6: 'illegal'
};

/** CONST.GRID_TYPES: rows (R) are pointy-top hexagons, columns (Q) flat-top ones. */
const GRID_TYPE_BY_CODE: Readonly<Record<number, GridType>> = {
  0: 'gridless',
  1: 'square',
  2: 'hexPointyOdd',
  3: 'hexPointyEven',
  4: 'hexFlatOdd',
  5: 'hexFlatEven'
};

/** CONST.TEXT_ANCHOR_POINTS. */
const TEXT_ANCHOR_CODE: Readonly<Record<ScrollingTextAnchor, number>> = {
  center: 0,
  bottom: 1,
  top: 2,
  left: 3,
  right: 4
};

export const GRIDLESS_CODE = 0;

/** The modes combine into one mask; the core snaps to the nearest candidate of any of them. */
export function snappingModeMask(modes: readonly GridSnappingMode[]): number {
  return modes.reduce((mask, mode) => mask | SNAPPING_MODE_CODE[mode], 0);
}

export function diagonalRuleFromCode(code: number | undefined): GridDiagonalRule | null {
  return code === undefined ? null : (DIAGONAL_RULE_BY_CODE[code] ?? null);
}

export function gridTypeFromCode(code: number): GridType {
  return GRID_TYPE_BY_CODE[code] ?? 'square';
}

export function textAnchorCode(anchor: ScrollingTextAnchor): number {
  return TEXT_ANCHOR_CODE[anchor];
}
