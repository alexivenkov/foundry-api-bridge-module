import type { RegionEventName } from './regionAttributes';

/** The core behavior types of Foundry 13 and 14 (the last three are Foundry 14+). */
export const CORE_BEHAVIOR_TYPES = [
  'adjustDarknessLevel',
  'displayScrollingText',
  'executeMacro',
  'executeScript',
  'modifyMovementCost',
  'pauseGame',
  'suppressWeather',
  'teleportToken',
  'toggleBehavior',
  'applyActiveEffect',
  'changeLevel',
  'defineSurface'
] as const;
export type CoreBehaviorType = (typeof CORE_BEHAVIOR_TYPES)[number];

export const SCRIPT_BEHAVIOR_TYPE = 'executeScript';

export const DARKNESS_MODES = ['override', 'brighten', 'darken'] as const;
export type DarknessMode = (typeof DARKNESS_MODES)[number];

export const TEXT_VISIBILITIES = ['gamemaster', 'observer', 'anyone'] as const;
export type TextVisibility = (typeof TEXT_VISIBILITIES)[number];

export const TELEPORT_PLACEMENTS = ['random', 'center', 'relative'] as const;
export type TeleportPlacement = (typeof TELEPORT_PLACEMENTS)[number];

export const SURFACE_PLACEMENTS = ['bottom', 'top', 'both'] as const;
export type SurfacePlacement = (typeof SURFACE_PLACEMENTS)[number];

/** The events `displayScrollingText` may subscribe to. */
export const SCROLLING_TEXT_EVENTS = [
  'tokenAnimateIn',
  'tokenAnimateOut',
  'tokenTurnStart',
  'tokenTurnEnd',
  'tokenRoundStart',
  'tokenRoundEnd'
] as const satisfies readonly RegionEventName[];

/** The events `toggleBehavior` may subscribe to. */
export const TOGGLE_BEHAVIOR_EVENTS = [
  'tokenEnter',
  'tokenExit',
  'tokenMoveIn',
  'tokenMoveOut',
  'tokenTurnStart',
  'tokenTurnEnd',
  'tokenRoundStart',
  'tokenRoundEnd'
] as const satisfies readonly RegionEventName[];

export const TELEPORT_DURATION_MIN_MS = 500;
export const TELEPORT_DURATION_MAX_MS = 10000;
export const MOVEMENT_COST_MAX = 5;
export const MOVEMENT_COST_STEP = 0.25;
