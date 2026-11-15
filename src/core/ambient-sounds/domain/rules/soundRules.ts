import { CoreFeatureUnavailableError } from '@/core/shared/domain';
import {
  InvalidSoundDarknessRangeError,
  UnknownSoundEffectError,
  UnknownSoundLevelError
} from '@/core/ambient-sounds/domain/errors/ambientSoundErrors';
import type {
  AmbientSoundChanges,
  SoundDarknessRange,
  SoundDarknessRangeChanges
} from '@/core/ambient-sounds/domain/model/AmbientSound';
import type { PositionalSound } from '@/core/ambient-sounds/domain/model/PositionalSound';
import type { SoundFeatures } from '@/core/ambient-sounds/domain/ports/ports';

const EFFECTS_UNAVAILABLE = 'Sound effects require Foundry 12 or newer';

/** Refuses an attribute the running Foundry generation does not store. */
export function assertAmbientSoundFeatures(changes: AmbientSoundChanges, features: SoundFeatures): void {
  if (!features.elevation && changes.elevation !== undefined) {
    throw new CoreFeatureUnavailableError('Ambient sound elevation requires Foundry 12 or newer');
  }
  assertEffectsSupported(changes.baseEffect !== undefined || changes.muffledEffect !== undefined, features);
  if (!features.levels && (changes.name !== undefined || changes.locked !== undefined || changes.levels !== undefined)) {
    throw new CoreFeatureUnavailableError('Ambient sound names, locks and scene levels require Foundry 14 or newer');
  }
}

export function assertEffectsSupported(hasEffects: boolean, features: SoundFeatures): void {
  if (hasEffects && !features.effects) {
    throw new CoreFeatureUnavailableError(EFFECTS_UNAVAILABLE);
  }
}

/** Refuses the options of a positional sound the running Foundry generation would ignore. */
export function assertPositionalSoundFeatures(sound: PositionalSound, features: SoundFeatures): void {
  assertEffectsSupported(sound.baseEffect !== undefined || sound.muffledEffect !== undefined, features);
  if (sound.elevation !== undefined && !features.positionalElevation) {
    throw new CoreFeatureUnavailableError('Positional sound elevation requires Foundry 13 or newer');
  }
}

/** The core stores an inverted range without complaint, and the sound then never plays; it is refused here. */
export function resolveSoundDarknessRange(
  current: SoundDarknessRange,
  changes: SoundDarknessRangeChanges | undefined
): SoundDarknessRange {
  const range = { min: changes?.min ?? current.min, max: changes?.max ?? current.max };
  if (range.min > range.max) {
    throw new InvalidSoundDarknessRangeError(range.min, range.max);
  }
  return range;
}

/**
 * The core silently plays without an effect whose id it does not know, so an
 * id is checked against what the world registers — unless the registry
 * cannot be read.
 */
export function assertKnownEffect(type: string | null | undefined, known: readonly string[] | null): void {
  if (typeof type !== 'string' || known === null || known.includes(type)) {
    return;
  }
  throw new UnknownSoundEffectError(type, known);
}

/** The core only checks the id format, so a level that is not in the scene is refused here. */
export function assertSoundSceneLevels(levels: readonly string[] | undefined, sceneLevelIds: readonly string[]): void {
  const unknown = levels?.find((levelId) => !sceneLevelIds.includes(levelId));
  if (unknown !== undefined) {
    throw new UnknownSoundLevelError(unknown);
  }
}
