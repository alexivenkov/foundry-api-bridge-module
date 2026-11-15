import type {
  AmbientSound,
  AmbientSoundChanges,
  AmbientSoundEffect,
  AmbientSoundEffectChanges,
  SoundFeatures
} from '@/core/ambient-sounds/domain';
import type { FoundryAmbientSoundDocument, FoundryAmbientSoundEffect } from './foundryAmbientSoundTypes';

function readEffect(effect: FoundryAmbientSoundEffect): AmbientSoundEffect {
  const type = effect.type;
  return { type: type !== undefined && type.length > 0 ? type : null, intensity: effect.intensity };
}

function readName(name: string | undefined): string | null {
  return name !== undefined && name.length > 0 ? name : null;
}

export function toAmbientSound(document: FoundryAmbientSoundDocument, features: SoundFeatures): AmbientSound {
  const effects = features.effects ? document.effects : undefined;
  return {
    id: document.id,
    x: document.x,
    y: document.y,
    elevation: features.elevation ? (document.elevation ?? 0) : undefined,
    radius: document.radius,
    path: document.path ?? null,
    repeat: document.repeat,
    volume: document.volume,
    walls: document.walls,
    easing: document.easing,
    hidden: document.hidden,
    darkness: { min: document.darkness.min, max: document.darkness.max },
    baseEffect: effects !== undefined ? readEffect(effects.base) : undefined,
    muffledEffect: effects !== undefined ? readEffect(effects.muffled) : undefined,
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

const PLAIN_FIELDS = [
  'x',
  'y',
  'elevation',
  'radius',
  'path',
  'repeat',
  'volume',
  'walls',
  'easing',
  'hidden',
  'locked'
] as const;

/** A removed effect is written as `''`, as the core form submits its blank option. */
function toFoundryEffectData(changes: AmbientSoundEffectChanges): Record<string, unknown> {
  const effect: Record<string, unknown> = {};
  if (changes.type !== undefined) {
    effect['type'] = changes.type ?? '';
  }
  setIfDefined(effect, 'intensity', changes.intensity);
  return effect;
}

/**
 * Only the attributes that are set become document fields, and `darkness` /
 * `effects` are nested partial objects, so an update stays partial: the core
 * merges them into what is stored. A cleared name is written as `''`.
 */
export function toFoundryAmbientSoundData(changes: AmbientSoundChanges): Record<string, unknown> {
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

  const darkness: Record<string, unknown> = {};
  setIfDefined(darkness, 'min', changes.darkness?.min);
  setIfDefined(darkness, 'max', changes.darkness?.max);
  if (Object.keys(darkness).length > 0) {
    data['darkness'] = darkness;
  }

  const effects: Record<string, unknown> = {};
  if (changes.baseEffect !== undefined) {
    effects['base'] = toFoundryEffectData(changes.baseEffect);
  }
  if (changes.muffledEffect !== undefined) {
    effects['muffled'] = toFoundryEffectData(changes.muffledEffect);
  }
  if (Object.keys(effects).length > 0) {
    data['effects'] = effects;
  }
  return data;
}
