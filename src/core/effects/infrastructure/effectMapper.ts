import type {
  CoreEffectData,
  Effect,
  EffectChanges,
  EffectDraft,
  EffectDuration,
  EffectIdentity,
  StatusToggle,
  StatusToggleOptions
} from '@/core/effects/domain';
import { toShowIconCode } from './effectCodes';
import type {
  FoundryActiveEffect,
  FoundryEffectDuration,
  FoundryStatusToggleOptions,
  FoundryStatusToggleResult
} from './foundryEffectTypes';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Foundry 14: one `value` in `units`. A permanent effect has an infinite value. */
function fromUnitDuration(duration: FoundryEffectDuration): EffectDuration | null {
  const value = duration.value;
  if (!isFiniteNumber(value)) {
    return null;
  }
  if (duration.units === 'rounds') {
    return { rounds: value };
  }
  if (duration.units === 'turns') {
    return { turns: value };
  }
  if (duration.units === 'seconds') {
    return { seconds: value };
  }
  // Minutes, days and other calendar units: the core derives `seconds` when it can.
  return isFiniteNumber(duration.seconds) ? { seconds: duration.seconds } : {};
}

/**
 * Foundry 13 and older: `seconds` / `rounds` / `turns`. A field that was never
 * set is `undefined`, and one the effect sheet saved empty is `null`; neither
 * is a duration, so an effect with no number in any of them is permanent.
 */
function fromLegacyDuration(duration: FoundryEffectDuration): EffectDuration | null {
  const { rounds, turns, seconds } = duration;
  const result: { seconds?: number; rounds?: number; turns?: number } = {};
  if (typeof rounds === 'number') {
    result.rounds = rounds;
  }
  if (typeof turns === 'number') {
    result.turns = turns;
  }
  if (typeof seconds === 'number') {
    result.seconds = seconds;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function toEffectDuration(duration: FoundryEffectDuration): EffectDuration | null {
  return typeof duration.units === 'string' ? fromUnitDuration(duration) : fromLegacyDuration(duration);
}

function changeValueToString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return value === undefined ? '' : JSON.stringify(value);
}

export function toEffect(document: FoundryActiveEffect): Effect {
  return {
    id: document._id,
    name: document.name,
    img: document.img ?? null,
    disabled: document.disabled,
    statuses: Array.from(document.statuses),
    origin: document.origin,
    changes: document.changes.map((change) => ({
      key: change.key,
      value: changeValueToString(change.value),
      mode: change.mode
    })),
    duration: toEffectDuration(document.duration)
  };
}

export function toEffectIdentity(document: Pick<FoundryActiveEffect, '_id' | 'name'>): EffectIdentity {
  return { id: document._id, name: document.name };
}

export function toStatusToggle(result: FoundryStatusToggleResult): StatusToggle {
  if (result === true) {
    return { active: true, effectId: null };
  }
  if (result === false || result === undefined) {
    return { active: false, effectId: null };
  }
  return { active: true, effectId: result._id };
}

/** The core is given no options object at all when the caller set none. */
export function toFoundryStatusToggleOptions(options: StatusToggleOptions): FoundryStatusToggleOptions | undefined {
  const data: FoundryStatusToggleOptions = {};
  if (options.active !== undefined) {
    data.active = options.active;
  }
  if (options.overlay !== undefined) {
    data.overlay = options.overlay;
  }
  return Object.keys(data).length > 0 ? data : undefined;
}

function setIfDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

const LEGACY_DURATION_FIELDS = ['seconds', 'rounds', 'turns'];

/**
 * Foundry 14 migrates a `seconds` / `rounds` / `turns` duration by keeping the
 * first of them that holds a number, in that order of `seconds`, `turns`,
 * `rounds` — so `{ rounds: 10, turns: 0 }` became a zero-turn effect that ends
 * at once. A zero in one of them is dropped when another holds a positive
 * number; a duration in one unit, in zeros only, or in the value-and-units
 * shape goes to the core as given. Foundry 13 stores all three fields, so it
 * is given the duration unchanged.
 */
export function withoutMaskingZeroUnits(duration: CoreEffectData): CoreEffectData {
  if ('value' in duration || 'units' in duration) {
    return duration;
  }
  const positive = LEGACY_DURATION_FIELDS.some((field) => {
    const value = duration[field];
    return typeof value === 'number' && value > 0;
  });
  const zero = LEGACY_DURATION_FIELDS.some((field) => duration[field] === 0);
  if (!positive || !zero) {
    return duration;
  }
  return Object.fromEntries(
    Object.entries(duration).filter(([key, value]) => !(LEGACY_DURATION_FIELDS.includes(key) && value === 0))
  );
}

function setAddedAttributes(data: Record<string, unknown>, changes: EffectChanges): void {
  setIfDefined(data, 'description', changes.description);
  setIfDefined(data, 'tint', changes.tint);
  setIfDefined(data, 'sort', changes.sort);
  setIfDefined(data, 'system', changes.system);
  if (changes.showIcon !== undefined) {
    data['showIcon'] = toShowIconCode(changes.showIcon);
  }
}

/** Only the attributes that are set become document fields. */
export function toFoundryEffectCreateData(draft: EffectDraft): Record<string, unknown> {
  const data: Record<string, unknown> = { name: draft.name };
  setIfDefined(data, 'img', draft.img);
  setIfDefined(data, 'disabled', draft.disabled);
  setIfDefined(data, 'origin', draft.origin);
  setIfDefined(data, 'statuses', draft.statuses);
  setIfDefined(data, 'changes', draft.changes);
  setIfDefined(data, 'duration', draft.duration);
  setIfDefined(data, 'type', draft.type);
  setAddedAttributes(data, draft);
  return data;
}

export function toFoundryEffectUpdateData(changes: EffectChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  setIfDefined(data, 'name', changes.name);
  setIfDefined(data, 'img', changes.img);
  setIfDefined(data, 'disabled', changes.disabled);
  setIfDefined(data, 'changes', changes.changes);
  setIfDefined(data, 'duration', changes.duration);
  setIfDefined(data, 'origin', changes.origin);
  setIfDefined(data, 'statuses', changes.statuses);
  setAddedAttributes(data, changes);
  return data;
}
