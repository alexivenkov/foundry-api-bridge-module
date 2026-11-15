import {
  UnknownEffectRegistryIdError,
  isEffectDurationUnit,
  type EffectChangeEntry,
  type EffectChangeSpec,
  type EffectDetails,
  type EffectDetailsChanges,
  type EffectDetailsDraft,
  type EffectDurationSpec,
  type EffectDurationState
} from '@/core/effects/domain';
import { LEGACY_CHANGE_MODES, changeTypeForMode, fromShowIconCode, toShowIconCode } from './effectCodes';
import type { FoundryEffectSource, FoundryEffectSourceChange, FoundryEffectSourceDuration } from './foundryEffectTypes';

/** How the running core stores changes and durations: the Foundry 14 model, or the one before it. */
export interface EffectStorage {
  /** `system.changes` with string types, one duration `value` in `units` (Foundry 14+). */
  readonly unitModel: boolean;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function positiveNumber(value: unknown): number | null {
  const number = finiteNumber(value);
  return number !== null && number > 0 ? number : null;
}

function readLegacyChange(change: FoundryEffectSourceChange): EffectChangeEntry {
  return {
    key: change.key ?? '',
    type: changeTypeForMode(change.mode ?? 0),
    value: change.value ?? '',
    priority: finiteNumber(change.priority)
  };
}

function readChange(change: FoundryEffectSourceChange): EffectChangeEntry {
  return {
    key: change.key ?? '',
    type: change.type ?? 'add',
    value: change.value ?? null,
    priority: finiteNumber(change.priority),
    ...(typeof change.phase === 'string' ? { phase: change.phase } : {})
  };
}

/** Foundry 13 keeps changes at the top level, Foundry 14 in `system.changes`. */
function isLegacySource(source: FoundryEffectSource): boolean {
  return Array.isArray(source.changes);
}

function readChanges(source: FoundryEffectSource): EffectChangeEntry[] {
  if (isLegacySource(source)) {
    return (source.changes ?? []).map(readLegacyChange);
  }
  const changes = source.system?.['changes'];
  return Array.isArray(changes) ? (changes as FoundryEffectSourceChange[]).map(readChange) : [];
}

/** On Foundry 14 the core's change list is reported as `changes`, not inside the type data. */
function readSystem(source: FoundryEffectSource): Record<string, unknown> {
  const system = source.system ?? {};
  if (isLegacySource(source) || !('changes' in system)) {
    return { ...system };
  }
  const { changes: _changes, ...rest } = system;
  return rest;
}

/** Foundry 14: permanent when it has neither a length nor an expiry event. */
function readUnitDuration(duration: FoundryEffectSourceDuration): EffectDurationState | null {
  const value = finiteNumber(duration.value);
  const expiry = typeof duration.expiry === 'string' ? duration.expiry : null;
  if ((value === null && expiry === null) || !isEffectDurationUnit(duration.units)) {
    return null;
  }
  return { value, units: duration.units, expiry, expired: duration.expired === true };
}

/** Foundry 13 and older: `seconds` win; rounds and turns count together (`ActiveEffect#_prepareDuration`). */
function readLegacyDuration(duration: FoundryEffectSourceDuration): EffectDurationState | null {
  const seconds = finiteNumber(duration.seconds);
  if (seconds !== null) {
    return { value: seconds, units: 'seconds' };
  }
  const rounds = positiveNumber(duration.rounds);
  const turns = positiveNumber(duration.turns);
  if (rounds !== null) {
    return { value: rounds, units: 'rounds', ...(turns !== null ? { extraTurns: turns } : {}) };
  }
  return turns !== null ? { value: turns, units: 'turns' } : null;
}

function readDuration(duration: FoundryEffectSourceDuration | undefined): EffectDurationState | null {
  if (duration === undefined) {
    return null;
  }
  return typeof duration.units === 'string' ? readUnitDuration(duration) : readLegacyDuration(duration);
}

/** Read from the stored data: the live document gives a `Set` of statuses and a prepared Foundry 14 duration. */
export function toEffectDetails(document: { _source: FoundryEffectSource }): EffectDetails {
  const source = document._source;
  const showIcon = typeof source.showIcon === 'number' ? fromShowIconCode(source.showIcon) : undefined;
  return {
    id: source._id,
    name: source.name,
    img: source.img ?? null,
    type: source.type ?? 'base',
    disabled: source.disabled === true,
    transfer: source.transfer === true,
    description: source.description ?? '',
    tint: source.tint ?? '#ffffff',
    origin: source.origin ?? null,
    statuses: [...new Set(source.statuses ?? [])],
    sort: source.sort ?? 0,
    changes: readChanges(source),
    duration: readDuration(source.duration),
    ...(showIcon !== undefined ? { showIcon } : {}),
    system: readSystem(source)
  };
}

function toLegacyChange(change: EffectChangeSpec): Record<string, unknown> {
  const mode = LEGACY_CHANGE_MODES[change.type];
  if (mode === undefined) {
    throw new UnknownEffectRegistryIdError('change type', change.type, Object.keys(LEGACY_CHANGE_MODES));
  }
  return {
    key: change.key,
    value: typeof change.value === 'string' ? change.value : String(change.value),
    mode,
    ...(change.priority !== undefined ? { priority: change.priority } : {})
  };
}

function toUnitModelChange(change: EffectChangeSpec): Record<string, unknown> {
  return {
    key: change.key,
    type: change.type,
    value: change.value,
    ...(change.priority !== undefined ? { priority: change.priority } : {}),
    ...(change.phase !== undefined ? { phase: change.phase } : {})
  };
}

const NO_LEGACY_DURATION = { seconds: null, rounds: null, turns: null };

/**
 * Foundry 14 keeps the duration in one unit; a timed one gets the core's own
 * default expiry event (`turnStart`) unless the caller names one, and a
 * permanent one loses its expiry event too — an expiry event alone keeps an
 * effect temporary. Foundry 13 keeps three fields side by side, so the two the
 * duration does not use are cleared.
 */
function toFoundryDuration(duration: EffectDurationSpec | null, storage: EffectStorage): Record<string, unknown> {
  if (storage.unitModel) {
    if (duration === null) {
      return { value: null, units: 'seconds', expiry: null, expired: false };
    }
    return {
      value: duration.value,
      units: duration.units,
      expiry: duration.expiry === undefined ? 'turnStart' : duration.expiry,
      expired: false
    };
  }
  return duration === null ? { ...NO_LEGACY_DURATION } : { ...NO_LEGACY_DURATION, [duration.units]: duration.value };
}

function setIfDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

/** On Foundry 14 changes are type data: they go into `system`, next to whatever type data the caller gives. */
function setChangesAndSystem(data: Record<string, unknown>, changes: EffectDetailsChanges, storage: EffectStorage): void {
  if (!storage.unitModel) {
    setIfDefined(data, 'system', changes.system);
    setIfDefined(data, 'changes', changes.changes?.map(toLegacyChange));
    return;
  }
  if (changes.changes === undefined) {
    setIfDefined(data, 'system', changes.system);
    return;
  }
  data['system'] = { ...(changes.system ?? {}), changes: changes.changes.map(toUnitModelChange) };
}

function toFoundryAttributes(changes: EffectDetailsChanges, storage: EffectStorage): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  setIfDefined(data, 'name', changes.name);
  setIfDefined(data, 'img', changes.img);
  setIfDefined(data, 'disabled', changes.disabled);
  setIfDefined(data, 'transfer', changes.transfer);
  setIfDefined(data, 'description', changes.description);
  setIfDefined(data, 'tint', changes.tint);
  setIfDefined(data, 'origin', changes.origin);
  setIfDefined(data, 'statuses', changes.statuses);
  setIfDefined(data, 'sort', changes.sort);
  setChangesAndSystem(data, changes, storage);
  if (changes.duration !== undefined) {
    data['duration'] = toFoundryDuration(changes.duration, storage);
  }
  if (changes.showIcon !== undefined) {
    data['showIcon'] = toShowIconCode(changes.showIcon);
  }
  return data;
}

export function toFoundryEffectDetailsCreateData(draft: EffectDetailsDraft, storage: EffectStorage): Record<string, unknown> {
  const data = toFoundryAttributes(draft, storage);
  setIfDefined(data, 'type', draft.type);
  return data;
}

export function toFoundryEffectDetailsUpdateData(
  changes: EffectDetailsChanges,
  storage: EffectStorage
): Record<string, unknown> {
  return toFoundryAttributes(changes, storage);
}
