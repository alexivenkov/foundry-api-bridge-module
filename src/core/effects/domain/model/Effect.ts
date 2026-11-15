import type { EffectIconVisibility, EffectSystemData } from '@/core/effects/domain/model/EffectDetails';

/** One attribute change an effect applies, as command results report it. */
export interface EffectChange {
  readonly key: string;
  readonly value: string;
  readonly mode: number;
}

/**
 * How long an effect lasts, in the units the commands speak. An empty duration
 * belongs to a temporary effect whose length they cannot express: a calendar
 * duration the core gave no value in seconds for.
 */
export interface EffectDuration {
  readonly seconds?: number;
  readonly rounds?: number;
  readonly turns?: number;
}

export interface Effect {
  readonly id: string;
  readonly name: string;
  /** null when the effect has no icon. */
  readonly img: string | null;
  readonly disabled: boolean;
  readonly statuses: readonly string[];
  readonly origin: string | null;
  readonly changes: readonly EffectChange[];
  /** null for a permanent effect. */
  readonly duration: EffectDuration | null;
}

export function isTemporary(effect: Effect): boolean {
  return effect.duration !== null;
}

/** An actor's effects together with the statuses currently active on it. */
export interface ActorEffects {
  readonly effects: readonly Effect[];
  readonly activeStatuses: readonly string[];
}

export interface EffectIdentity {
  readonly id: string;
  readonly name: string;
}

/** A value in the shape the core's ActiveEffect schema takes; it goes to the core as given. */
export type CoreEffectData = Readonly<Record<string, unknown>>;

/**
 * The attributes a caller may set. Omitted ones are left to the core default
 * (create) or untouched (update); `null` clears the icon or the origin.
 *
 * `changes` and `duration` are not interpreted here. Their shape belongs to
 * the core's ActiveEffect schema, which differs between Foundry 13 and 14:
 * `{ key, value, mode }` and `{ seconds, rounds, turns }` are the Foundry 13
 * shapes, and Foundry 14 migrates them itself, keeping one duration unit.
 */
export interface EffectChanges {
  readonly name?: string | undefined;
  readonly img?: string | null | undefined;
  readonly disabled?: boolean | undefined;
  readonly changes?: readonly CoreEffectData[] | undefined;
  readonly duration?: CoreEffectData | undefined;
  readonly origin?: string | null | undefined;
  readonly statuses?: readonly string[] | undefined;
  readonly description?: string | undefined;
  readonly tint?: string | undefined;
  readonly sort?: number | undefined;
  readonly showIcon?: EffectIconVisibility | undefined;
  readonly system?: EffectSystemData | undefined;
}

export interface EffectDraft extends EffectChanges {
  readonly name: string;
  readonly type?: string | undefined;
}


export interface StatusToggleOptions {
  /** Force the status on or off instead of flipping it. */
  readonly active?: boolean | undefined;
  /** Show the status icon over the whole token. */
  readonly overlay?: boolean | undefined;
}

export interface StatusToggle {
  /** Whether the actor has the status now. */
  readonly active: boolean;
  /** The effect the core created for the status; null when it created none. */
  readonly effectId: string | null;
}
