import { CoreFeatureUnavailableError } from '@/core/shared/domain';
import {
  GlobalLightDarknessRangeError,
  WeatherEffectNotFoundError
} from '@/core/scenes/domain/errors/sceneSettingsErrors';
import type { SceneChanges } from '@/core/scenes/domain/model/Scene';
import type { DarknessRange, DarknessRangeChanges, SceneFeatures } from '@/core/scenes/domain/model/SceneSettings';
import type { WeatherEffect } from '@/core/scenes/domain/model/SceneTable';
import type { LinkedCollection } from '@/core/scenes/domain/ports/ports';

/** The global light keys older cores stored as `globalLight` and `globalLightThreshold`. */
function asksForGlobalLightDetails(changes: SceneChanges): boolean {
  const light = changes.globalLight;
  if (light === undefined) {
    return false;
  }
  return [
    light.bright,
    light.color,
    light.alpha,
    light.luminosity,
    light.saturation,
    light.contrast,
    light.shadows,
    light.darkness?.min
  ].some((value) => value !== undefined);
}

/** Refuses a setting the running Foundry generation does not store. */
export function assertSceneFeatures(changes: SceneChanges, features: SceneFeatures): void {
  if (
    !features.environmentDetails &&
    (changes.darknessLock !== undefined ||
      changes.blendAmbience !== undefined ||
      changes.baseAmbience !== undefined ||
      changes.darkAmbience !== undefined ||
      asksForGlobalLightDetails(changes))
  ) {
    throw new CoreFeatureUnavailableError(
      'The darkness lock, ambience and global light details require Foundry 12 or newer'
    );
  }
  if (!features.gridStyle && (changes.grid?.style !== undefined || changes.grid?.thickness !== undefined)) {
    throw new CoreFeatureUnavailableError('Grid style and thickness require Foundry 12 or newer');
  }
  if (!features.levels && changes.initialLevelId !== undefined) {
    throw new CoreFeatureUnavailableError('Scene levels require Foundry 14 or newer');
  }
}

/**
 * The core stores any weather string and draws nothing for one it does not
 * know, so the id is checked against the registry — unless it cannot be read.
 */
export function assertKnownWeather(weather: string | null | undefined, known: readonly WeatherEffect[] | null): void {
  if (typeof weather !== 'string' || known === null || known.some((effect) => effect.id === weather)) {
    return;
  }
  throw new WeatherEffectNotFoundError(weather);
}

/** The range the global light ends up with; Foundry 13 would store min > max without complaint. */
export function resolveGlobalLightDarkness(
  current: DarknessRange,
  changes: DarknessRangeChanges | undefined
): DarknessRange {
  const range = { min: changes?.min ?? current.min, max: changes?.max ?? current.max };
  if (range.min > range.max) {
    throw new GlobalLightDarknessRangeError(range.min, range.max);
  }
  return range;
}

export interface LinkRequest {
  readonly parentId: string | null | undefined;
  readonly childId: string | null | undefined;
}

export interface CurrentLink {
  readonly parentId: string | null;
  readonly childId: string | null;
}

export interface LinkErrors {
  parentNotFound(parentId: string): Error;
  childNotFound(childId: string): Error;
  childWithoutParent(): Error;
}

/**
 * A link to a world document and to one of its children: a playlist and one
 * of its sounds, a journal entry and one of its pages. A new parent must
 * exist, a child must belong to the parent the scene ends up with, and a
 * child left over from a replaced parent is dropped, as the core's scene
 * sheet does.
 */
export function resolveLink(
  request: LinkRequest,
  current: CurrentLink,
  find: (parentId: string) => LinkedCollection | null,
  errors: LinkErrors
): LinkRequest {
  if (request.parentId === undefined && request.childId === undefined) {
    return request;
  }
  const parentChanged = request.parentId !== undefined;
  const parentId = parentChanged ? (request.parentId ?? null) : current.parentId;
  const parent = parentId === null ? null : find(parentId);
  if (parentChanged && parentId !== null && parent === null) {
    throw errors.parentNotFound(parentId);
  }

  if (typeof request.childId === 'string') {
    if (parentId === null) {
      throw errors.childWithoutParent();
    }
    if (parent === null || !parent.childIds.includes(request.childId)) {
      throw errors.childNotFound(request.childId);
    }
    return request;
  }

  const orphaned =
    parentChanged &&
    request.childId === undefined &&
    current.childId !== null &&
    !(parent?.childIds.includes(current.childId) ?? false);
  return orphaned ? { parentId: request.parentId, childId: null } : request;
}
