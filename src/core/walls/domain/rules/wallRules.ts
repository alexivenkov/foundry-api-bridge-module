import { CoreFeatureUnavailableError } from '@/core/shared/domain';
import {
  UnknownDoorAnimationError,
  UnknownDoorSoundError,
  WallProximityConflictError,
  WallThresholdDistanceRequiredError
} from '@/core/walls/domain/errors';
import type { Wall, WallChanges } from '@/core/walls/domain/model';
import type { WallFeatures } from '@/core/walls/domain/ports';
import {
  NO_THRESHOLD,
  THRESHOLD_SENSES,
  type DoorSoundOption,
  type ThresholdSense,
  type WallRestriction
} from '@/core/walls/domain/value-objects';

/** The wire name of each sense's plain restriction, for error texts. */
const PLAIN_FIELD: Readonly<Record<ThresholdSense, string>> = { light: 'light', sight: 'sense', sound: 'sound' };

export function assertWallFeatures(changes: WallChanges, features: WallFeatures): void {
  if (!features.doorAnimation && changes.animation !== undefined) {
    throw new CoreFeatureUnavailableError('Door animations require Foundry 13 or newer');
  }
}

/** The core stores any string as the door sound, so an id is checked against what the world registers. */
export function assertKnownDoorSound(doorSound: string | null | undefined, known: readonly DoorSoundOption[] | null): void {
  if (typeof doorSound !== 'string' || known === null || known.some((option) => option.id === doorSound)) {
    return;
  }
  throw new UnknownDoorSoundError(doorSound, known.map((option) => option.id));
}

/** The core persists any animation type, so one is checked against what the world registers. */
export function assertKnownDoorAnimation(type: string | undefined, known: readonly string[] | null): void {
  if (type === undefined || known === null || known.includes(type)) {
    return;
  }
  throw new UnknownDoorAnimationError(type, known);
}

/**
 * Checks the proximity settings of a create (`current` null) or an update and
 * returns the changes the store must write: a sense whose proximity is turned
 * off falls back to the `normal` restriction unless the request sets another.
 */
export function resolveThresholdChanges(current: Wall | null, changes: WallChanges): WallChanges {
  const threshold = changes.threshold;
  if (threshold === undefined) {
    return changes;
  }
  const currentThreshold = current?.threshold ?? NO_THRESHOLD;
  const fallbacks: Partial<Record<ThresholdSense, WallRestriction>> = {};

  for (const sense of THRESHOLD_SENSES) {
    const senseChanges = threshold[sense];
    const before = currentThreshold[sense];
    const plain = changes[sense];
    const proximity = senseChanges?.proximity !== undefined ? senseChanges.proximity : before.proximity;
    const distance = senseChanges?.distance !== undefined ? senseChanges.distance : before.distance;

    if (senseChanges?.proximity !== undefined && senseChanges.proximity !== null && plain !== undefined) {
      throw new WallProximityConflictError(sense, PLAIN_FIELD[sense]);
    }
    if (proximity !== null && plain === undefined && distance === null) {
      throw new WallThresholdDistanceRequiredError(sense);
    }
    if (senseChanges?.proximity === null && before.proximity !== null && plain === undefined) {
      fallbacks[sense] = 'normal';
    }
  }

  return { ...changes, ...fallbacks };
}
