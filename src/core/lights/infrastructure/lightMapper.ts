import type { Light, LightChanges, LightFeatures } from '@/core/lights/domain';
import { colorationFromCode, colorationToCode } from './colorationCodes';
import type { FoundryLightConfig, FoundryLightDocument } from './foundryLightTypes';

function readColor(color: FoundryLightConfig['color']): string | null {
  if (color === null || color === undefined) {
    return null;
  }
  if (typeof color === 'string') {
    return color.length > 0 ? color : null;
  }
  if (typeof color === 'number') {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
  return color.css;
}

/** The core form stores a cleared name as `''`; `update({ name: null })` leaves it unset. Both read as unnamed. */
function readName(name: string | undefined): string | null {
  return name !== undefined && name.length > 0 ? name : null;
}

export function toLight(document: FoundryLightDocument, features: LightFeatures): Light {
  const config = document.config;
  return {
    id: document.id,
    x: document.x,
    y: document.y,
    elevation: features.elevation ? (document.elevation ?? 0) : undefined,
    rotation: document.rotation,
    walls: document.walls,
    vision: document.vision,
    hidden: document.hidden,
    dim: config.dim,
    bright: config.bright,
    angle: config.angle,
    color: readColor(config.color),
    alpha: config.alpha,
    coloration: colorationFromCode(config.coloration),
    luminosity: config.luminosity,
    attenuation: config.attenuation,
    saturation: config.saturation,
    contrast: config.contrast,
    shadows: config.shadows,
    animation: {
      type: config.animation.type ?? null,
      speed: config.animation.speed,
      intensity: config.animation.intensity,
      reverse: config.animation.reverse
    },
    darkness: { min: config.darkness.min, max: config.darkness.max },
    negative: features.darknessSources ? (config.negative ?? false) : undefined,
    priority: features.darknessSources ? (config.priority ?? 0) : undefined,
    name: features.levels ? readName(document.name) : undefined,
    locked: features.levels ? (document.locked ?? false) : undefined,
    levels: features.levels ? [...(document.levels ?? [])] : undefined
  };
}

function setIfDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

const PLAIN_FIELDS = ['x', 'y', 'elevation', 'rotation', 'walls', 'vision', 'hidden', 'locked'] as const;
const PLAIN_CONFIG_FIELDS = [
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

function toFoundryConfigData(changes: LightChanges): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  for (const field of PLAIN_CONFIG_FIELDS) {
    setIfDefined(config, field, changes[field]);
  }
  if (changes.coloration !== undefined) {
    config['coloration'] = colorationToCode(changes.coloration);
  }

  const animation: Record<string, unknown> = {};
  setIfDefined(animation, 'type', changes.animation?.type);
  setIfDefined(animation, 'speed', changes.animation?.speed);
  setIfDefined(animation, 'intensity', changes.animation?.intensity);
  setIfDefined(animation, 'reverse', changes.animation?.reverse);
  if (Object.keys(animation).length > 0) {
    config['animation'] = animation;
  }

  const darkness: Record<string, unknown> = {};
  setIfDefined(darkness, 'min', changes.darkness?.min);
  setIfDefined(darkness, 'max', changes.darkness?.max);
  if (Object.keys(darkness).length > 0) {
    config['darkness'] = darkness;
  }
  return config;
}

/**
 * Only the attributes that are set become document fields, and the light
 * configuration is a nested partial object, so an update stays partial: the
 * core merges `config`, `config.animation` and `config.darkness` into what is
 * stored. A cleared name is written as the empty string, as the core's own
 * form does.
 */
export function toFoundryLightData(changes: LightChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of PLAIN_FIELDS) {
    setIfDefined(data, field, changes[field]);
  }
  if (changes.name !== undefined) {
    data['name'] = changes.name ?? '';
  }
  if (changes.levels !== undefined) {
    data['levels'] = [...new Set(changes.levels)];
  }
  const config = toFoundryConfigData(changes);
  if (Object.keys(config).length > 0) {
    data['config'] = config;
  }
  return data;
}
