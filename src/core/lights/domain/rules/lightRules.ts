import { CoreFeatureUnavailableError } from '@/core/shared/domain';
import {
  InvalidLightDarknessRangeError,
  UnknownLightAnimationError,
  UnknownLightLevelError
} from '@/core/lights/domain/errors/lightErrors';
import type {
  LightChanges,
  LightDarknessRange,
  LightDarknessRangeChanges,
  LightKind
} from '@/core/lights/domain/model/Light';
import type { LightFeatures } from '@/core/lights/domain/ports/ports';
import { isAttenuationColoration } from '@/core/lights/domain/value-objects/lightColoration';

/** Refuses an attribute the running Foundry generation does not store. */
export function assertLightFeatures(changes: LightChanges, features: LightFeatures): void {
  if (!features.elevation && changes.elevation !== undefined) {
    throw new CoreFeatureUnavailableError('Light elevation requires Foundry 12 or newer');
  }
  if (!features.darknessSources && (changes.negative !== undefined || changes.priority !== undefined)) {
    throw new CoreFeatureUnavailableError('Darkness sources and light priority require Foundry 12 or newer');
  }
  if (
    !features.attenuationColorations &&
    changes.coloration !== undefined &&
    isAttenuationColoration(changes.coloration)
  ) {
    throw new CoreFeatureUnavailableError(`The ${changes.coloration} coloration requires Foundry 14 or newer`);
  }
  if (!features.levels && (changes.name !== undefined || changes.locked !== undefined || changes.levels !== undefined)) {
    throw new CoreFeatureUnavailableError('Light names, locks and scene levels require Foundry 14 or newer');
  }
}

/** The range a light ends up with; the core rejects min > max, so it is refused here with a clear text. */
export function resolveDarknessRange(
  current: LightDarknessRange,
  changes: LightDarknessRangeChanges | undefined
): LightDarknessRange {
  const range = { min: changes?.min ?? current.min, max: changes?.max ?? current.max };
  if (range.min > range.max) {
    throw new InvalidLightDarknessRangeError(range.min, range.max);
  }
  return range;
}

/**
 * The core silently ignores an animation id it does not know, so an id is
 * checked against what the world registers for that kind of source — unless
 * the registry cannot be read.
 */
export function assertKnownAnimation(
  type: string | null | undefined,
  kind: LightKind,
  known: readonly string[] | null
): void {
  if (typeof type !== 'string' || known === null || known.includes(type)) {
    return;
  }
  throw new UnknownLightAnimationError(type, kind, known);
}

/** The core only checks the id format, so a level that is not in the scene is refused here. */
export function assertSceneLevels(levels: readonly string[] | undefined, sceneLevelIds: readonly string[]): void {
  const unknown = levels?.find((levelId) => !sceneLevelIds.includes(levelId));
  if (unknown !== undefined) {
    throw new UnknownLightLevelError(unknown);
  }
}
