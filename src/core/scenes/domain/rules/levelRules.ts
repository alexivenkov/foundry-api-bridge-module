import { CoreFeatureUnavailableError } from '@/core/shared/domain';
import {
  LevelElevationRangeError,
  LevelNotFoundError,
  LevelSeesItselfError
} from '@/core/scenes/domain/errors/sceneLevelErrors';
import type {
  LevelElevation,
  LevelElevationChanges,
  SceneLevel,
  SceneLevels
} from '@/core/scenes/domain/model/SceneLevel';

export function assertLevelsAvailable(available: boolean): void {
  if (!available) {
    throw new CoreFeatureUnavailableError('Scene levels require Foundry 14 or newer');
  }
}

export function requireLevel(levels: SceneLevels, levelId: string): SceneLevel {
  const level = levels.levels.find((candidate) => candidate.id === levelId);
  if (level === undefined) {
    throw new LevelNotFoundError(levelId);
  }
  return level;
}

/**
 * The range a level ends up with. The core rejects top < bottom, after the
 * client has already reported success for an update, so it is refused here.
 */
export function resolveElevation(current: LevelElevation, changes: LevelElevationChanges | undefined): LevelElevation {
  const range = {
    bottom: changes?.bottom !== undefined ? changes.bottom : current.bottom,
    top: changes?.top !== undefined ? changes.top : current.top
  };
  if (range.bottom !== null && range.top !== null && range.top < range.bottom) {
    throw new LevelElevationRangeError(range.bottom, range.top);
  }
  return range;
}

/** The range a new level gets from the core: bottom 0 and the scene's default top unless given. */
export function newLevelElevation(levels: SceneLevels): LevelElevation {
  return { bottom: 0, top: levels.defaultTop };
}

/** Every visible level must be another level of the same scene. */
export function assertVisibleLevels(
  levels: SceneLevels,
  visibleLevelIds: readonly string[] | undefined,
  ownId: string | null
): void {
  for (const levelId of visibleLevelIds ?? []) {
    if (levelId === ownId) {
      throw new LevelSeesItselfError(levelId);
    }
    requireLevel(levels, levelId);
  }
}
