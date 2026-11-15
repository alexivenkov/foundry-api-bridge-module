import type { AudioPreloader, SoundPreloadGmState } from '@/core/ambient-sounds/domain';
import type { AudioGlobalsProvider, FoundryAudioHelperLike } from './foundryAudioTypes';
import { audioGlobalsFromGlobalThis } from './FoundrySoundEnvironment';

/** `game.audio.preload(src)` (`AudioHelper#preload`, Foundry 13.351 / 14.368). */
export class FoundryAudioPreloader implements AudioPreloader {
  constructor(private readonly globals: AudioGlobalsProvider = audioGlobalsFromGlobalThis) {}

  isAvailable(): boolean {
    return this.findHelper() !== null;
  }

  async preload(src: string): Promise<SoundPreloadGmState> {
    const audio = this.findHelper();
    if (audio?.preload === undefined) {
      return 'failed';
    }
    // Read before the call: the local load waits for the audio unlock.
    const locked = audio.locked === true;
    const loading = audio.preload(src);
    if (locked) {
      loading.catch(() => undefined);
      return 'deferred';
    }
    try {
      const sound = await loading;
      return sound.failed === true ? 'failed' : 'done';
    } catch {
      return 'failed';
    }
  }

  private findHelper(): FoundryAudioHelperLike | null {
    const audio = this.globals().game?.audio;
    return audio !== undefined && typeof audio.preload === 'function' ? audio : null;
  }
}
