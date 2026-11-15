import type {
  CreateAmbientSoundCommand,
  DeleteAmbientSoundCommand,
  ListAmbientSoundsQuery,
  PlaySoundAtPositionCommand,
  PreloadSoundCommand,
  UpdateAmbientSoundCommand
} from '@/core/ambient-sounds/application';
import {
  POSITIONAL_SOUND_DEFAULTS,
  type AmbientSoundChanges,
  type AmbientSoundEffectChanges,
  type SoundEffectSpec
} from '@/core/ambient-sounds/domain';
import { emptyAsAbsent } from '@/core/shared';
import type {
  CreateAmbientSoundRequest,
  DeleteAmbientSoundRequest,
  GetAmbientSoundsRequest,
  PlaySoundAtPositionRequest,
  PreloadSoundRequest,
  UpdateAmbientSoundRequest
} from './soundSchemas';

type AmbientSoundAttributesRequest = Omit<UpdateAmbientSoundRequest, 'sceneId' | 'ambientSoundId'>;
type AmbientEffectRequest = NonNullable<AmbientSoundAttributesRequest['baseEffect']>;
type PositionalEffectRequest = NonNullable<PlaySoundAtPositionRequest['baseEffect']>;

/** An empty effect id or name means "none", as the core's own forms submit it. */
function emptyAsNull(value: string | null | undefined): string | null | undefined {
  return value === '' ? null : value;
}

function toEffectChanges(effect: AmbientEffectRequest | undefined): AmbientSoundEffectChanges | undefined {
  return effect !== undefined ? { type: emptyAsNull(effect.type), intensity: effect.intensity } : undefined;
}

function toAmbientSoundChanges(request: AmbientSoundAttributesRequest): AmbientSoundChanges {
  return {
    x: request.x,
    y: request.y,
    elevation: request.elevation,
    radius: request.radius,
    path: request.path,
    repeat: request.repeat,
    volume: request.volume,
    walls: request.walls,
    easing: request.easing,
    hidden: request.hidden,
    darkness: request.darkness,
    baseEffect: toEffectChanges(request.baseEffect),
    muffledEffect: toEffectChanges(request.muffledEffect),
    name: emptyAsNull(request.name),
    locked: request.locked,
    levels: request.levels
  };
}

export function toListAmbientSoundsQuery(request: GetAmbientSoundsRequest): ListAmbientSoundsQuery {
  return { sceneId: emptyAsAbsent(request.sceneId) };
}

export function toCreateAmbientSoundCommand(request: CreateAmbientSoundRequest): CreateAmbientSoundCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    draft: {
      ...toAmbientSoundChanges(request),
      x: request.x,
      y: request.y,
      radius: request.radius,
      path: request.path
    }
  };
}

export function toUpdateAmbientSoundCommand(request: UpdateAmbientSoundRequest): UpdateAmbientSoundCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    ambientSoundId: request.ambientSoundId,
    changes: toAmbientSoundChanges(request)
  };
}

export function toDeleteAmbientSoundCommand(request: DeleteAmbientSoundRequest): DeleteAmbientSoundCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), ambientSoundId: request.ambientSoundId };
}

function toEffectSpec(effect: PositionalEffectRequest | undefined): SoundEffectSpec | undefined {
  return effect !== undefined ? { type: effect.type, intensity: effect.intensity } : undefined;
}

export function toPlaySoundAtPositionCommand(request: PlaySoundAtPositionRequest): PlaySoundAtPositionCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    sound: {
      src: request.src,
      x: request.x,
      y: request.y,
      elevation: request.elevation,
      radius: request.radius,
      volume: request.volume ?? POSITIONAL_SOUND_DEFAULTS.volume,
      easing: request.easing ?? POSITIONAL_SOUND_DEFAULTS.easing,
      walls: request.walls ?? POSITIONAL_SOUND_DEFAULTS.walls,
      gmAlways: request.gmAlways ?? POSITIONAL_SOUND_DEFAULTS.gmAlways,
      baseEffect: toEffectSpec(request.baseEffect),
      muffledEffect: toEffectSpec(request.muffledEffect)
    }
  };
}

export function toPreloadSoundCommand(request: PreloadSoundRequest): PreloadSoundCommand {
  return { src: request.src };
}
