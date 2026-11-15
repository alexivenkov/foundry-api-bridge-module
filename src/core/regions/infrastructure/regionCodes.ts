import type {
  DarknessMode,
  RegionVisibility,
  TextVisibility,
  TokenShapeKind
} from '@/core/regions/domain';

// Core codes verified against Foundry 13.351 and 14.368: CONST.REGION_VISIBILITY
// (OBSERVER and LAYER_UNLOCKED are 14+), CONST.TOKEN_SHAPES,
// AdjustDarknessLevelRegionBehaviorType.MODES and
// DisplayScrollingTextRegionBehaviorType.VISIBILITY_MODES.

function invert<T extends string>(codes: Readonly<Record<T, number>>): ReadonlyMap<number, T> {
  return new Map(Object.entries<number>(codes).map(([key, code]) => [code, key as T]));
}

const VISIBILITY_CODE: Readonly<Record<RegionVisibility, number>> = {
  layer: 0,
  gamemaster: 1,
  always: 2,
  observer: 3,
  'layer-unlocked': 4
};
const VISIBILITY_BY_CODE = invert(VISIBILITY_CODE);

const TOKEN_SHAPE_CODE: Readonly<Record<TokenShapeKind, number>> = {
  'ellipse-1': 0,
  'ellipse-2': 1,
  'trapezoid-1': 2,
  'trapezoid-2': 3,
  'rectangle-1': 4,
  'rectangle-2': 5
};
const TOKEN_SHAPE_BY_CODE = invert(TOKEN_SHAPE_CODE);

const DARKNESS_MODE_CODE: Readonly<Record<DarknessMode, number>> = { override: 0, brighten: 1, darken: 2 };
const DARKNESS_MODE_BY_CODE = invert(DARKNESS_MODE_CODE);

const TEXT_VISIBILITY_CODE: Readonly<Record<TextVisibility, number>> = { gamemaster: 0, observer: 1, anyone: 2 };
const TEXT_VISIBILITY_BY_CODE = invert(TEXT_VISIBILITY_CODE);

export function visibilityToCode(value: RegionVisibility): number {
  return VISIBILITY_CODE[value];
}

export function visibilityFromCode(code: unknown): RegionVisibility | null {
  return typeof code === 'number' ? (VISIBILITY_BY_CODE.get(code) ?? null) : null;
}

export function tokenShapeToCode(value: TokenShapeKind): number {
  return TOKEN_SHAPE_CODE[value];
}

export function tokenShapeFromCode(code: unknown): TokenShapeKind | null {
  return typeof code === 'number' ? (TOKEN_SHAPE_BY_CODE.get(code) ?? null) : null;
}

export function darknessModeToCode(value: DarknessMode): number {
  return DARKNESS_MODE_CODE[value];
}

export function darknessModeFromCode(code: unknown): DarknessMode {
  return (typeof code === 'number' ? DARKNESS_MODE_BY_CODE.get(code) : undefined) ?? 'override';
}

export function textVisibilityToCode(value: TextVisibility): number {
  return TEXT_VISIBILITY_CODE[value];
}

export function textVisibilityFromCode(code: unknown): TextVisibility {
  return (typeof code === 'number' ? TEXT_VISIBILITY_BY_CODE.get(code) : undefined) ?? 'anyone';
}
