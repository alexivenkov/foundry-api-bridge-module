import { CoreFeatureUnavailableError } from '@/core/shared/domain';
import { InvalidEffectOriginError, UnknownEffectRegistryIdError } from '@/core/effects/domain/errors/effectErrors';
import {
  LEGACY_DURATION_UNITS,
  type EffectChangeSpec,
  type EffectDurationSpec,
  type EffectIconVisibility
} from '@/core/effects/domain/model/EffectDetails';
import type { EffectEnvironment, EffectFeatures } from '@/core/effects/domain/ports/EffectEnvironment';

/** The attributes of an effect write that depend on the running core. */
export interface EffectWriteInput {
  readonly type?: string | undefined;
  readonly system?: unknown;
  readonly changes?: readonly EffectChangeSpec[] | undefined;
  readonly duration?: EffectDurationSpec | null | undefined;
  readonly showIcon?: EffectIconVisibility | undefined;
  readonly origin?: string | null | undefined;
}

function assertRegistered(what: string, id: string, known: readonly string[] | null): void {
  if (known !== null && !known.includes(id)) {
    throw new UnknownEffectRegistryIdError(what, id, known);
  }
}

function assertChange(change: EffectChangeSpec, features: EffectFeatures, environment: EffectEnvironment): void {
  assertRegistered('change type', change.type, environment.changeTypes());
  if (change.phase === undefined) {
    return;
  }
  if (!features.changePhases) {
    throw new CoreFeatureUnavailableError('Effect change phases require Foundry 14 or newer');
  }
  assertRegistered('change phase', change.phase, environment.changePhases());
}

function assertDuration(duration: EffectDurationSpec, features: EffectFeatures, environment: EffectEnvironment): void {
  if (!features.durationUnits && !LEGACY_DURATION_UNITS.includes(duration.units)) {
    throw new CoreFeatureUnavailableError(`Effect durations in ${duration.units} require Foundry 14 or newer`);
  }
  if (duration.expiry === undefined || duration.expiry === null) {
    return;
  }
  if (!features.durationUnits) {
    throw new CoreFeatureUnavailableError('Effect expiry events require Foundry 14 or newer');
  }
  assertRegistered('expiry event', duration.expiry, environment.expiryEvents());
}

/**
 * Refuses what the running core does not store, and ids its registries do not
 * know — the core rejects an unknown subtype, but silently keeps an unknown
 * change type, phase or expiry event, and silently drops an origin it cannot
 * parse (Foundry 14).
 */
export function assertEffectWrite(input: EffectWriteInput, environment: EffectEnvironment): void {
  const features = environment.features();
  if (!features.subtypes && (input.type !== undefined || input.system !== undefined)) {
    throw new CoreFeatureUnavailableError('Effect subtypes and type data require Foundry 12 or newer');
  }
  if (input.type !== undefined) {
    assertRegistered('type', input.type, environment.effectTypes());
  }
  for (const change of input.changes ?? []) {
    assertChange(change, features, environment);
  }
  if (input.duration) {
    assertDuration(input.duration, features, environment);
  }
  if (input.showIcon !== undefined && !features.iconVisibility) {
    throw new CoreFeatureUnavailableError('Effect icon visibility requires Foundry 14 or newer');
  }
  if (typeof input.origin === 'string') {
    const problem = environment.originProblem(input.origin);
    if (problem !== null) {
      throw new InvalidEffectOriginError(input.origin, problem);
    }
  }
}

/** The core keeps a status set as the array it was given, duplicates included. */
export function uniqueStatuses(statuses: readonly string[]): string[] {
  return [...new Set(statuses)];
}
