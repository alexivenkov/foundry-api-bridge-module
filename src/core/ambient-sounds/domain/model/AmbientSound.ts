export interface AmbientSoundEffect {
  readonly type: string | null;
  readonly intensity: number;
}

export interface SoundDarknessRange {
  readonly min: number;
  readonly max: number;
}

export const DEFAULT_SOUND_DARKNESS_RANGE: SoundDarknessRange = { min: 0, max: 1 };

/**
 * A sound placed on a scene. Fields a Foundry generation does not have are
 * `undefined`: `elevation` and the effects before 12; `name`, `locked` and
 * `levels` before 14.
 */
export interface AmbientSound {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly elevation: number | undefined;
  readonly radius: number;
  readonly path: string | null;
  readonly repeat: boolean;
  readonly volume: number;
  readonly walls: boolean;
  readonly easing: boolean;
  readonly hidden: boolean;
  readonly darkness: SoundDarknessRange;
  readonly baseEffect: AmbientSoundEffect | undefined;
  readonly muffledEffect: AmbientSoundEffect | undefined;
  readonly name: string | null | undefined;
  readonly locked: boolean | undefined;
  readonly levels: readonly string[] | undefined;
}

export interface AmbientSoundEffectChanges {
  readonly type?: string | null | undefined;
  readonly intensity?: number | undefined;
}

export interface SoundDarknessRangeChanges {
  readonly min?: number | undefined;
  readonly max?: number | undefined;
}

/**
 * The attributes a caller may set. Omitted ones are left to the core default
 * (create) or untouched (update); `null` detaches the file, removes an effect
 * or the name. `levels` replaces the whole set.
 */
export interface AmbientSoundChanges {
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly elevation?: number | undefined;
  readonly radius?: number | undefined;
  readonly path?: string | null | undefined;
  readonly repeat?: boolean | undefined;
  readonly volume?: number | undefined;
  readonly walls?: boolean | undefined;
  readonly easing?: boolean | undefined;
  readonly hidden?: boolean | undefined;
  readonly darkness?: SoundDarknessRangeChanges | undefined;
  readonly baseEffect?: AmbientSoundEffectChanges | undefined;
  readonly muffledEffect?: AmbientSoundEffectChanges | undefined;
  readonly name?: string | null | undefined;
  readonly locked?: boolean | undefined;
  readonly levels?: readonly string[] | undefined;
}

export interface AmbientSoundDraft extends AmbientSoundChanges {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly path: string;
}
