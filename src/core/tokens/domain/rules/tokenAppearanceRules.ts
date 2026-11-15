import { CoreFeatureUnavailableError } from '@/core/shared/domain';
import {
  DuplicateDetectionModeError,
  InvalidTokenLightDarknessRangeError,
  TokenScaleConflictError,
  UnknownTokenRegistryIdError,
  VisionModeDefaultsWithoutModeError
} from '@/core/tokens/domain/errors/tokenAppearanceErrors';
import type { TokenPlacementChanges } from '@/core/tokens/domain/model/Token';
import {
  isAttenuationColoration,
  type TokenAppearanceChanges,
  type TokenDetectionMode,
  type TokenLightDarknessRange,
  type TokenSightChanges,
  type TokenSightRequest,
  type TokenTextureChanges
} from '@/core/tokens/domain/model/TokenAppearance';
import type { TokenAppearanceEnvironment, TokenFeatures } from '@/core/tokens/domain/ports/appearancePorts';

type CheckedChanges = TokenAppearanceChanges & TokenPlacementChanges;

/** The light state a change is checked against: a new token's defaults, or the token's current light. */
export interface TokenLightState {
  readonly negative: boolean;
  readonly darkness: TokenLightDarknessRange;
}

export const NEW_TOKEN_LIGHT: TokenLightState = { negative: false, darkness: { min: 0, max: 1 } };

function refuse(message: string): never {
  throw new CoreFeatureUnavailableError(message);
}

/** Refuses a field the running Foundry generation does not store. */
export function assertTokenFeatures(changes: CheckedChanges, features: TokenFeatures): void {
  if (!features.depth && changes.depth !== undefined) {
    refuse('Token depth requires Foundry 14 or newer');
  }
  const texture = changes.texture;
  if (
    !features.textureOffset &&
    (texture?.offsetX !== undefined || texture?.offsetY !== undefined || texture?.rotation !== undefined)
  ) {
    refuse('Token texture offset and rotation are not available in Foundry 14 or newer');
  }
  if (!features.ring && changes.ring !== undefined) {
    refuse('Dynamic token rings require Foundry 12 or newer');
  }
  if (
    !features.movement &&
    (changes.shape !== undefined || changes.turnMarker !== undefined || changes.movementAction !== undefined)
  ) {
    refuse('Token shapes, turn markers and movement actions require Foundry 13 or newer');
  }
  const light = changes.light;
  if (!features.darknessSources && (light?.negative !== undefined || light?.priority !== undefined)) {
    refuse('Darkness sources and light priority require Foundry 12 or newer');
  }
  if (!features.depth && light?.coloration !== undefined && isAttenuationColoration(light.coloration)) {
    refuse(`The ${light.coloration} coloration requires Foundry 14 or newer`);
  }
}

/** `scale` sets both texture scales, so it cannot come with either of them. */
export function assertScaleWithoutTextureScale(scale: number | undefined, texture: TokenTextureChanges | undefined): void {
  if (scale !== undefined && (texture?.scaleX !== undefined || texture?.scaleY !== undefined)) {
    throw new TokenScaleConflictError();
  }
}

/** The core rejects min > max; it is refused here with a clear text. */
export function resolveTokenLightDarkness(
  current: TokenLightDarknessRange,
  changes: { readonly min?: number | undefined; readonly max?: number | undefined } | undefined
): TokenLightDarknessRange {
  const range = { min: changes?.min ?? current.min, max: changes?.max ?? current.max };
  if (range.min > range.max) {
    throw new InvalidTokenLightDarknessRangeError(range.min, range.max);
  }
  return range;
}

/** The core stores an id it does not know (or silently ignores it), so ids are checked against the registry. */
export function assertKnownTokenRegistryId(
  registry: string,
  id: string | null | undefined,
  known: readonly string[] | null
): void {
  if (typeof id !== 'string' || known === null || known.includes(id)) {
    return;
  }
  throw new UnknownTokenRegistryIdError(registry, id, known);
}

export function assertDetectionModes(modes: readonly TokenDetectionMode[] | undefined, known: readonly string[] | null): void {
  if (modes === undefined) {
    return;
  }
  const seen = new Set<string>();
  for (const mode of modes) {
    if (seen.has(mode.id)) {
      throw new DuplicateDetectionModeError(mode.id);
    }
    seen.add(mode.id);
    assertKnownTokenRegistryId('detection mode', mode.id, known);
  }
}

/**
 * The sight changes to write. With `applyModeDefaults` the vision mode's own
 * defaults come first, as `TokenDocument#updateVisionMode` applies them, and
 * the fields of the request win over them.
 */
export function resolveSightRequest(
  request: TokenSightRequest | undefined,
  defaultsFor: (visionMode: string) => TokenSightChanges
): TokenSightChanges | undefined {
  if (request === undefined) {
    return undefined;
  }
  const { applyModeDefaults, ...changes } = request;
  if (applyModeDefaults !== true) {
    return changes;
  }
  if (changes.visionMode === undefined) {
    throw new VisionModeDefaultsWithoutModeError();
  }
  const explicit = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));
  return { ...defaultsFor(changes.visionMode), ...explicit };
}

/** Every check a token or prototype change goes through before it is written. */
export function assertTokenAppearance(
  changes: CheckedChanges,
  light: TokenLightState,
  environment: TokenAppearanceEnvironment
): void {
  assertTokenFeatures(changes, environment.features());
  resolveTokenLightDarkness(light.darkness, changes.light?.darkness);
  const kind = (changes.light?.negative ?? light.negative) ? 'darkness' : 'light';
  assertKnownTokenRegistryId(`${kind} animation`, changes.light?.animation?.type, environment.lightAnimations(kind));
  assertKnownTokenRegistryId('vision mode', changes.sight?.visionMode, environment.visionModes());
  assertDetectionModes(changes.detectionModes, environment.detectionModes());
  assertKnownTokenRegistryId('movement action', changes.movementAction, environment.movementActions());
  assertKnownTokenRegistryId('turn marker animation', changes.turnMarker?.animation, environment.turnMarkerAnimations());
}
