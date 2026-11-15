import type {
  PrototypeToken,
  TokenAppearance,
  TokenAppearanceChanges,
  TokenAppearanceDetail,
  TokenDetectionMode,
  TokenLight,
  TokenLightChanges,
  TokenRingChanges,
  TokenSightChanges,
  TokenTextureChanges,
  TokenTextureFit,
  TokenTurnMarkerChanges
} from '@/core/tokens/domain';
import type {
  AppearanceWriteOptions,
  FoundryDetectionModeEntry,
  FoundryDetectionModesSource,
  FoundryPrototypeTokenSource,
  FoundryTokenAppearanceSource,
  FoundryTokenLightSource,
  FoundryTokenSource,
  FoundryTokenTextureSource
} from './foundryTokenAppearanceTypes';
import {
  COLORATION_CODE,
  DISPLAY_MODE_CODE,
  SHAPE_CODE,
  TURN_MARKER_MODE_CODE,
  colorationFromCode,
  displayModeFromCode,
  dispositionFromCode,
  ringEffectsFromBits,
  ringEffectsToBits,
  shapeFromCode,
  turnMarkerModeFromCode
} from './tokenAppearanceCodes';

const DEFAULT_TINT = '#ffffff';

function toTexture(texture: FoundryTokenTextureSource): TokenAppearance['texture'] {
  return {
    src: texture.src ?? '',
    tint: texture.tint ?? DEFAULT_TINT,
    fit: texture.fit as TokenTextureFit,
    anchorX: texture.anchorX,
    anchorY: texture.anchorY,
    scaleX: texture.scaleX,
    scaleY: texture.scaleY,
    alphaThreshold: texture.alphaThreshold,
    offsetX: texture.offsetX,
    offsetY: texture.offsetY,
    rotation: texture.rotation
  };
}

function toLight(light: FoundryTokenLightSource): TokenLight {
  return {
    dim: light.dim,
    bright: light.bright,
    angle: light.angle,
    color: light.color ?? null,
    alpha: light.alpha,
    coloration: colorationFromCode(light.coloration),
    luminosity: light.luminosity,
    attenuation: light.attenuation,
    saturation: light.saturation,
    contrast: light.contrast,
    shadows: light.shadows,
    animation: {
      type: light.animation.type ?? null,
      speed: light.animation.speed,
      intensity: light.animation.intensity,
      reverse: light.animation.reverse
    },
    darkness: { min: light.darkness.min, max: light.darkness.max },
    negative: light.negative,
    priority: light.priority
  };
}

function toDetectionMode(id: string, entry: FoundryDetectionModeEntry): TokenDetectionMode {
  return { id, enabled: entry.enabled ?? true, range: entry.range ?? null };
}

function toDetectionModes(modes: FoundryDetectionModesSource): TokenDetectionMode[] {
  if (Array.isArray(modes)) {
    return modes.map((entry) => toDetectionMode(entry.id ?? '', entry));
  }
  return Object.entries(modes).map(([id, entry]) => toDetectionMode(id, entry));
}

export function toTokenAppearance(source: FoundryTokenAppearanceSource): TokenAppearance {
  const ring = source.ring;
  const turnMarker = source.turnMarker;
  return {
    width: source.width,
    height: source.height,
    depth: source.depth,
    texture: toTexture(source.texture),
    alpha: source.alpha,
    rotation: source.rotation,
    lockRotation: source.lockRotation,
    disposition: dispositionFromCode(source.disposition),
    nameDisplay: displayModeFromCode(source.displayName),
    barDisplay: displayModeFromCode(source.displayBars),
    bar1: source.bar1.attribute ?? null,
    bar2: source.bar2.attribute ?? null,
    light: toLight(source.light),
    sight: {
      enabled: source.sight.enabled,
      range: source.sight.range ?? null,
      angle: source.sight.angle,
      visionMode: source.sight.visionMode,
      color: source.sight.color ?? null,
      attenuation: source.sight.attenuation,
      brightness: source.sight.brightness,
      saturation: source.sight.saturation,
      contrast: source.sight.contrast
    },
    detectionModes: toDetectionModes(source.detectionModes),
    occludableRadius: source.occludable.radius,
    ring:
      ring !== undefined
        ? {
            enabled: ring.enabled,
            ringColor: ring.colors.ring ?? null,
            backgroundColor: ring.colors.background ?? null,
            effects: ringEffectsFromBits(ring.effects),
            subjectScale: ring.subject.scale,
            subjectTexture: ring.subject.texture ?? null
          }
        : undefined,
    turnMarker:
      turnMarker !== undefined
        ? {
            mode: turnMarkerModeFromCode(turnMarker.mode),
            animation: turnMarker.animation ?? null,
            src: turnMarker.src ?? null,
            disposition: turnMarker.disposition
          }
        : undefined,
    movementAction: source.movementAction
  };
}

export function toTokenAppearanceDetail(source: FoundryTokenSource): TokenAppearanceDetail {
  return {
    ...toTokenAppearance(source),
    shape: shapeFromCode(source.shape),
    locked: source.locked,
    sort: source.sort
  };
}

export function toPrototypeToken(actorId: string, source: FoundryPrototypeTokenSource): PrototypeToken {
  return {
    ...toTokenAppearance(source),
    actorId,
    name: source.name,
    actorLink: source.actorLink,
    randomImg: source.randomImg,
    appendNumber: source.appendNumber,
    prependAdjective: source.prependAdjective
  };
}

function assignDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

function nonEmpty(data: Record<string, unknown>): Record<string, unknown> | undefined {
  return Object.keys(data).length > 0 ? data : undefined;
}

const TEXTURE_FIELDS = [
  'src',
  'tint',
  'fit',
  'anchorX',
  'anchorY',
  'scaleX',
  'scaleY',
  'alphaThreshold',
  'offsetX',
  'offsetY',
  'rotation'
] as const;

export function toFoundryTextureData(changes: TokenTextureChanges | undefined): Record<string, unknown> | undefined {
  if (changes === undefined) {
    return undefined;
  }
  const texture: Record<string, unknown> = {};
  for (const field of TEXTURE_FIELDS) {
    assignDefined(texture, field, changes[field]);
  }
  return nonEmpty(texture);
}

const LIGHT_FIELDS = [
  'dim',
  'bright',
  'angle',
  'color',
  'alpha',
  'luminosity',
  'attenuation',
  'saturation',
  'contrast',
  'shadows',
  'negative',
  'priority'
] as const;

function toFoundryLightData(changes: TokenLightChanges | undefined): Record<string, unknown> | undefined {
  if (changes === undefined) {
    return undefined;
  }
  const light: Record<string, unknown> = {};
  for (const field of LIGHT_FIELDS) {
    assignDefined(light, field, changes[field]);
  }
  if (changes.coloration !== undefined) {
    light['coloration'] = COLORATION_CODE[changes.coloration];
  }
  const animation: Record<string, unknown> = {};
  assignDefined(animation, 'type', changes.animation?.type);
  assignDefined(animation, 'speed', changes.animation?.speed);
  assignDefined(animation, 'intensity', changes.animation?.intensity);
  assignDefined(animation, 'reverse', changes.animation?.reverse);
  assignDefined(light, 'animation', nonEmpty(animation));
  const darkness: Record<string, unknown> = {};
  assignDefined(darkness, 'min', changes.darkness?.min);
  assignDefined(darkness, 'max', changes.darkness?.max);
  assignDefined(light, 'darkness', nonEmpty(darkness));
  return nonEmpty(light);
}

const SIGHT_FIELDS = [
  'enabled',
  'range',
  'angle',
  'visionMode',
  'color',
  'attenuation',
  'brightness',
  'saturation',
  'contrast'
] as const;

function toFoundrySightData(changes: TokenSightChanges | undefined): Record<string, unknown> | undefined {
  if (changes === undefined) {
    return undefined;
  }
  const sight: Record<string, unknown> = {};
  for (const field of SIGHT_FIELDS) {
    assignDefined(sight, field, changes[field]);
  }
  return nonEmpty(sight);
}

/**
 * The whole list replaces what is stored: Foundry 13 replaces an array on
 * update, Foundry 14 merges a record unless it is forced to replace it.
 */
function toFoundryDetectionModes(
  modes: readonly TokenDetectionMode[],
  options: AppearanceWriteOptions
): unknown {
  if (!options.detectionModesAsRecord) {
    return modes.map((mode) => ({ id: mode.id, enabled: mode.enabled, range: mode.range }));
  }
  const record: Record<string, unknown> = {};
  for (const mode of modes) {
    record[mode.id] = { enabled: mode.enabled, range: mode.range };
  }
  return options.replace(record);
}

function toFoundryRingData(changes: TokenRingChanges | undefined): Record<string, unknown> | undefined {
  if (changes === undefined) {
    return undefined;
  }
  const ring: Record<string, unknown> = {};
  assignDefined(ring, 'enabled', changes.enabled);
  const colors: Record<string, unknown> = {};
  assignDefined(colors, 'ring', changes.ringColor);
  assignDefined(colors, 'background', changes.backgroundColor);
  assignDefined(ring, 'colors', nonEmpty(colors));
  if (changes.effects !== undefined) {
    ring['effects'] = ringEffectsToBits(changes.effects);
  }
  const subject: Record<string, unknown> = {};
  assignDefined(subject, 'scale', changes.subjectScale);
  assignDefined(subject, 'texture', changes.subjectTexture);
  assignDefined(ring, 'subject', nonEmpty(subject));
  return nonEmpty(ring);
}

function toFoundryTurnMarkerData(changes: TokenTurnMarkerChanges | undefined): Record<string, unknown> | undefined {
  if (changes === undefined) {
    return undefined;
  }
  const marker: Record<string, unknown> = {};
  if (changes.mode !== undefined) {
    marker['mode'] = TURN_MARKER_MODE_CODE[changes.mode];
  }
  assignDefined(marker, 'animation', changes.animation);
  assignDefined(marker, 'src', changes.src);
  assignDefined(marker, 'disposition', changes.disposition);
  return nonEmpty(marker);
}

/**
 * The document fields of an appearance change. Every nested object is partial,
 * so the core merges it into what is stored; only `detectionModes` replaces.
 * The texture is left to the caller, which merges it with the legacy `scale`.
 */
export function toFoundryAppearanceData(
  changes: TokenAppearanceChanges,
  options: AppearanceWriteOptions
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  assignDefined(data, 'width', changes.width);
  assignDefined(data, 'height', changes.height);
  assignDefined(data, 'depth', changes.depth);
  assignDefined(data, 'alpha', changes.alpha);
  if (changes.barDisplay !== undefined) {
    data['displayBars'] = DISPLAY_MODE_CODE[changes.barDisplay];
  }
  if (changes.bar1 !== undefined) {
    data['bar1'] = { attribute: changes.bar1 };
  }
  if (changes.bar2 !== undefined) {
    data['bar2'] = { attribute: changes.bar2 };
  }
  assignDefined(data, 'light', toFoundryLightData(changes.light));
  assignDefined(data, 'sight', toFoundrySightData(changes.sight));
  if (changes.detectionModes !== undefined) {
    data['detectionModes'] = toFoundryDetectionModes(changes.detectionModes, options);
  }
  if (changes.occludableRadius !== undefined) {
    data['occludable'] = { radius: changes.occludableRadius };
  }
  assignDefined(data, 'ring', toFoundryRingData(changes.ring));
  assignDefined(data, 'turnMarker', toFoundryTurnMarkerData(changes.turnMarker));
  assignDefined(data, 'movementAction', changes.movementAction);
  return data;
}

export function shapeToCode(shape: keyof typeof SHAPE_CODE): number {
  return SHAPE_CODE[shape];
}

/** Plain writes, for a new document whose detection modes need no forced replacement. */
export const PLAIN_WRITE_OPTIONS: AppearanceWriteOptions = {
  detectionModesAsRecord: false,
  replace: (value) => value
};
