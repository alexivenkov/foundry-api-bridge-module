import type { FogExplorationMode, SceneGridType } from '@/core/scenes/domain';

// CONST.GRID_TYPES, verified against Foundry 13.351 and 14.368: GRIDLESS,
// SQUARE, HEXODDR, HEXEVENR, HEXODDQ, HEXEVENQ. Rows (R) are pointy-top
// hexagons, columns (Q) flat-top ones.

const GRID_TYPE_CODE: Readonly<Record<SceneGridType, number>> = {
  gridless: 0,
  square: 1,
  hexPointyOdd: 2,
  hexPointyEven: 3,
  hexFlatOdd: 4,
  hexFlatEven: 5
};

const GRID_TYPE_BY_CODE: Readonly<Record<number, SceneGridType>> = {
  0: 'gridless',
  1: 'square',
  2: 'hexPointyOdd',
  3: 'hexPointyEven',
  4: 'hexFlatOdd',
  5: 'hexFlatEven'
};

export const SQUARE_GRID_CODE = GRID_TYPE_CODE.square;

export function gridTypeToCode(type: SceneGridType): number {
  return GRID_TYPE_CODE[type];
}

export function gridTypeFromCode(code: number): SceneGridType {
  return GRID_TYPE_BY_CODE[code] ?? 'square';
}

// CONST.FOG_EXPLORATION_MODES (Foundry 14): DISABLED, INDIVIDUAL, SHARED. Fog
// exploration is a yes/no for callers, so "on" becomes INDIVIDUAL, the schema
// default, and SHARED is never written.
const FOG_MODE_DISABLED = 0;
const FOG_MODE_INDIVIDUAL = 1;
const FOG_MODE_SHARED = 2;

export function fogModeCode(explorationEnabled: boolean): number {
  return explorationEnabled ? FOG_MODE_INDIVIDUAL : FOG_MODE_DISABLED;
}

/** An unset or unknown mode reads as INDIVIDUAL, the schema default. */
export function fogModeFromCode(code: number | undefined): FogExplorationMode {
  if (code === FOG_MODE_DISABLED) {
    return 'disabled';
  }
  return code === FOG_MODE_SHARED ? 'shared' : 'individual';
}
