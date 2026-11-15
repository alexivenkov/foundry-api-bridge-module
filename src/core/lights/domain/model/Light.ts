import type { LightColoration } from '@/core/lights/domain/value-objects/lightColoration';

export type LightKind = 'light' | 'darkness';

export interface LightAnimation {
  readonly type: string | null;
  readonly speed: number;
  readonly intensity: number;
  readonly reverse: boolean;
}

export interface LightDarknessRange {
  readonly min: number;
  readonly max: number;
}

export const DEFAULT_DARKNESS_RANGE: LightDarknessRange = { min: 0, max: 1 };

/**
 * An ambient light or darkness source. Fields a Foundry generation does not
 * have are `undefined`: `elevation`, `negative` and `priority` before 12;
 * `name`, `locked` and `levels` before 14.
 */
export interface Light {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly elevation: number | undefined;
  readonly rotation: number;
  readonly walls: boolean;
  readonly vision: boolean;
  readonly hidden: boolean;
  readonly dim: number;
  readonly bright: number;
  readonly angle: number;
  readonly color: string | null;
  readonly alpha: number;
  readonly coloration: LightColoration | null;
  readonly luminosity: number;
  readonly attenuation: number;
  readonly saturation: number;
  readonly contrast: number;
  readonly shadows: number;
  readonly animation: LightAnimation;
  readonly darkness: LightDarknessRange;
  readonly negative: boolean | undefined;
  readonly priority: number | undefined;
  readonly name: string | null | undefined;
  readonly locked: boolean | undefined;
  readonly levels: readonly string[] | undefined;
}

export interface LightAnimationChanges {
  readonly type?: string | null | undefined;
  readonly speed?: number | undefined;
  readonly intensity?: number | undefined;
  readonly reverse?: boolean | undefined;
}

export interface LightDarknessRangeChanges {
  readonly min?: number | undefined;
  readonly max?: number | undefined;
}

/**
 * The attributes a caller may set. Omitted ones are left to the core default
 * (create) or untouched (update); `null` clears the color, the animation type
 * or the name. `levels` replaces the whole set.
 */
export interface LightChanges {
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly elevation?: number | undefined;
  readonly rotation?: number | undefined;
  readonly walls?: boolean | undefined;
  readonly vision?: boolean | undefined;
  readonly hidden?: boolean | undefined;
  readonly dim?: number | undefined;
  readonly bright?: number | undefined;
  readonly angle?: number | undefined;
  readonly color?: string | null | undefined;
  readonly alpha?: number | undefined;
  readonly coloration?: LightColoration | undefined;
  readonly luminosity?: number | undefined;
  readonly attenuation?: number | undefined;
  readonly saturation?: number | undefined;
  readonly contrast?: number | undefined;
  readonly shadows?: number | undefined;
  readonly animation?: LightAnimationChanges | undefined;
  readonly darkness?: LightDarknessRangeChanges | undefined;
  readonly negative?: boolean | undefined;
  readonly priority?: number | undefined;
  readonly name?: string | null | undefined;
  readonly locked?: boolean | undefined;
  readonly levels?: readonly string[] | undefined;
}

export interface LightDraft extends LightChanges {
  readonly x: number;
  readonly y: number;
}
