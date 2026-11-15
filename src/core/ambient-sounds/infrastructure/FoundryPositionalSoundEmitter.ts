import type {
  PositionalSound,
  PositionalSoundEmitter,
  SoundBroadcastGmState,
  SoundEffectSpec
} from '@/core/ambient-sounds/domain';
import type { AudioGlobalsProvider, FoundrySoundOrigin, FoundrySoundsLayer } from './foundryAudioTypes';
import { audioGlobalsFromGlobalThis } from './FoundrySoundEnvironment';

function toEffectOption(effect: SoundEffectSpec): Record<string, unknown> {
  return effect.intensity !== undefined ? { type: effect.type, intensity: effect.intensity } : { type: effect.type };
}

/** The arguments travel over the socket to every client, so they are plain JSON. */
function toPlaybackOptions(sound: PositionalSound): Record<string, unknown> {
  return {
    volume: sound.volume,
    easing: sound.easing,
    walls: sound.walls,
    gmAlways: sound.gmAlways,
    ...(sound.baseEffect !== undefined ? { baseEffect: toEffectOption(sound.baseEffect) } : {}),
    ...(sound.muffledEffect !== undefined ? { muffledEffect: toEffectOption(sound.muffledEffect) } : {})
  };
}

/**
 * `canvas.sounds.emitAtPosition`: every other client runs
 * `canvas.sounds.playAtPosition` with the same arguments on the scene it views,
 * this one plays it locally.
 */
export class FoundryPositionalSoundEmitter implements PositionalSoundEmitter {
  constructor(private readonly globals: AudioGlobalsProvider = audioGlobalsFromGlobalThis) {}

  isAvailable(): boolean {
    return this.findLayer() !== null;
  }

  canvasSceneId(): string | null {
    const canvas = this.globals().canvas;
    return canvas?.ready === true ? (canvas.scene?.id ?? null) : null;
  }

  async emit(sound: PositionalSound): Promise<SoundBroadcastGmState> {
    const layer = this.findLayer();
    if (layer === null) {
      return 'failed';
    }
    const origin: FoundrySoundOrigin =
      sound.elevation !== undefined ? { x: sound.x, y: sound.y, elevation: sound.elevation } : { x: sound.x, y: sound.y };
    // Read before the call: the local playback waits for the audio unlock,
    // which may never come in an unattended GM browser.
    const locked = this.globals().game?.audio?.locked === true;
    const playback = layer.emitAtPosition(sound.src, origin, sound.radius, toPlaybackOptions(sound));
    if (locked) {
      playback.catch(() => undefined);
      return 'deferred';
    }
    try {
      const played = await playback;
      if (played === null) {
        return 'inaudible';
      }
      return played.failed === true ? 'failed' : 'done';
    } catch {
      return 'failed';
    }
  }

  private findLayer(): FoundrySoundsLayer | null {
    const layer = this.globals().canvas?.sounds;
    return layer !== undefined && typeof layer.emitAtPosition === 'function' ? layer : null;
  }
}
