export const REGION_VISIBILITIES = ['layer', 'gamemaster', 'always', 'observer', 'layer-unlocked'] as const;
export type RegionVisibility = (typeof REGION_VISIBILITIES)[number];

export const REGION_HIGHLIGHT_MODES = ['shapes', 'coverage'] as const;
export type RegionHighlightMode = (typeof REGION_HIGHLIGHT_MODES)[number];

export const REGION_RESTRICTION_TYPES = ['light', 'darkness', 'sight', 'sound', 'move'] as const;
export type RegionRestrictionType = (typeof REGION_RESTRICTION_TYPES)[number];

export const REGION_SHAPE_TYPES = [
  'rectangle',
  'circle',
  'ellipse',
  'polygon',
  'cone',
  'ring',
  'line',
  'emanation',
  'token',
  'grid'
] as const;
export type RegionShapeType = (typeof REGION_SHAPE_TYPES)[number];

export const TOKEN_SHAPE_KINDS = [
  'ellipse-1',
  'ellipse-2',
  'trapezoid-1',
  'trapezoid-2',
  'rectangle-1',
  'rectangle-2'
] as const;
export type TokenShapeKind = (typeof TOKEN_SHAPE_KINDS)[number];

export const CONE_CURVATURES = ['round', 'flat', 'semicircle'] as const;
export type ConeCurvature = (typeof CONE_CURVATURES)[number];

/** Widest cone angle each curvature allows, in degrees. */
export const CONE_MAX_ANGLE: Readonly<Record<ConeCurvature, number>> = { round: 360, flat: 90, semicircle: 180 };

/** Every core region event of Foundry 13 and 14; which ones a world has is asked at run time. */
export const REGION_EVENT_NAMES = [
  'regionBoundary',
  'regionAnimation',
  'behaviorActivated',
  'behaviorDeactivated',
  'behaviorViewed',
  'behaviorUnviewed',
  'tokenEnter',
  'tokenExit',
  'tokenMoveIn',
  'tokenMoveOut',
  'tokenMoveWithin',
  'tokenAnimateIn',
  'tokenAnimateOut',
  'tokenTurnStart',
  'tokenTurnEnd',
  'tokenRoundStart',
  'tokenRoundEnd'
] as const;
export type RegionEventName = (typeof REGION_EVENT_NAMES)[number];
