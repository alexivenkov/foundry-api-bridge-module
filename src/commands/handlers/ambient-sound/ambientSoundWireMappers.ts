import type {
  AmbientSoundResult,
  AmbientSoundSummary,
  PlaySoundAtPositionResult,
  PreloadSoundResult
} from '@/commands/types';
import type {
  AmbientSound,
  AmbientSoundMutationResult,
  PositionalSoundResult,
  SoundPreloadResult
} from '@/core/ambient-sounds';

/** Fields the running Foundry generation does not have are left out, not sent as null. */
export function toWireAmbientSound(sound: AmbientSound): AmbientSoundSummary {
  return {
    id: sound.id,
    x: sound.x,
    y: sound.y,
    ...(sound.elevation !== undefined ? { elevation: sound.elevation } : {}),
    radius: sound.radius,
    path: sound.path,
    repeat: sound.repeat,
    volume: sound.volume,
    walls: sound.walls,
    easing: sound.easing,
    hidden: sound.hidden,
    darkness: { ...sound.darkness },
    ...(sound.baseEffect !== undefined ? { baseEffect: { ...sound.baseEffect } } : {}),
    ...(sound.muffledEffect !== undefined ? { muffledEffect: { ...sound.muffledEffect } } : {}),
    ...(sound.name !== undefined ? { name: sound.name } : {}),
    ...(sound.locked !== undefined ? { locked: sound.locked } : {}),
    ...(sound.levels !== undefined ? { levels: [...sound.levels] } : {})
  };
}

export function toWireAmbientSoundResult(result: AmbientSoundMutationResult): AmbientSoundResult {
  return { ...toWireAmbientSound(result.ambientSound), sceneId: result.sceneId };
}

export function toWirePositionalSoundResult(result: PositionalSoundResult): PlaySoundAtPositionResult {
  return {
    broadcast: true,
    src: result.sound.src,
    sceneId: result.sceneId,
    x: result.sound.x,
    y: result.sound.y,
    radius: result.sound.radius,
    gmPlayback: result.gmPlayback
  };
}

export function toWirePreloadResult(result: SoundPreloadResult): PreloadSoundResult {
  return { broadcast: true, src: result.src, gmPreload: result.gmPreload };
}
