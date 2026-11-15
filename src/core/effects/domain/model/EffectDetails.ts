/** Type data of an effect's subtype. The core carries it between the caller and Foundry and never looks inside. */
export type EffectSystemData = Readonly<Record<string, unknown>>;

export const EFFECT_DURATION_UNITS = [
  'seconds',
  'minutes',
  'hours',
  'days',
  'months',
  'years',
  'rounds',
  'turns'
] as const;

export type EffectDurationUnit = (typeof EFFECT_DURATION_UNITS)[number];

/** The units a core that keeps `seconds` / `rounds` / `turns` side by side can store. */
export const LEGACY_DURATION_UNITS: readonly EffectDurationUnit[] = ['seconds', 'rounds', 'turns'];

export function isEffectDurationUnit(value: unknown): value is EffectDurationUnit {
  return typeof value === 'string' && (EFFECT_DURATION_UNITS as readonly string[]).includes(value);
}

export const EFFECT_ICON_VISIBILITIES = ['never', 'conditional', 'always'] as const;

export type EffectIconVisibility = (typeof EFFECT_ICON_VISIBILITIES)[number];

export interface EffectChangeEntry {
  readonly key: string;
  readonly type: string;
  /** As stored: a string up to Foundry 13, any JSON value from 14. */
  readonly value: unknown;
  /** null when the type's default priority applies. */
  readonly priority: number | null;
  /** Foundry 14+; absent on older cores. */
  readonly phase?: string;
}

export interface EffectDurationState {
  /** null for an effect that only waits for its expiry event (Foundry 14). */
  readonly value: number | null;
  readonly units: EffectDurationUnit;
  /** Foundry 14+; absent on older cores. */
  readonly expiry?: string | null;
  /** Foundry 14+; absent on older cores. */
  readonly expired?: boolean;
  /** Foundry 13 and older: turns on top of `value` rounds; absent when there are none. */
  readonly extraTurns?: number;
}

/** One ActiveEffect as the core stores it. */
export interface EffectDetails {
  readonly id: string;
  readonly name: string;
  readonly img: string | null;
  readonly type: string;
  readonly disabled: boolean;
  readonly transfer: boolean;
  readonly description: string;
  readonly tint: string;
  readonly origin: string | null;
  readonly statuses: readonly string[];
  readonly sort: number;
  readonly changes: readonly EffectChangeEntry[];
  /** null for a permanent effect. */
  readonly duration: EffectDurationState | null;
  /** Foundry 14+; absent on older cores. */
  readonly showIcon?: EffectIconVisibility;
  readonly system: EffectSystemData;
}

export interface EffectChangeSpec {
  readonly key: string;
  readonly type: string;
  readonly value: string | number | boolean;
  readonly priority?: number | null | undefined;
  readonly phase?: string | undefined;
}

export interface EffectDurationSpec {
  readonly value: number;
  readonly units: EffectDurationUnit;
  /** undefined leaves the core default; null means no expiry event. */
  readonly expiry?: string | null | undefined;
}

/**
 * The attributes a caller may set. Omitted ones are left to the core default
 * (create) or untouched (update); `null` clears the icon or the origin, and a
 * null duration makes the effect permanent. `changes` and `statuses` replace
 * the whole list; `system` is merged into the stored type data on update.
 */
export interface EffectDetailsChanges {
  readonly name?: string | undefined;
  readonly img?: string | null | undefined;
  readonly disabled?: boolean | undefined;
  readonly transfer?: boolean | undefined;
  readonly description?: string | undefined;
  readonly tint?: string | undefined;
  readonly origin?: string | null | undefined;
  readonly statuses?: readonly string[] | undefined;
  readonly sort?: number | undefined;
  readonly changes?: readonly EffectChangeSpec[] | undefined;
  readonly duration?: EffectDurationSpec | null | undefined;
  readonly showIcon?: EffectIconVisibility | undefined;
  readonly system?: EffectSystemData | undefined;
}

export interface EffectDetailsDraft extends EffectDetailsChanges {
  readonly name: string;
  readonly type?: string | undefined;
}
