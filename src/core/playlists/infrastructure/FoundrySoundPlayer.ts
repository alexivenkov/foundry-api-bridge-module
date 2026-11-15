import { SoundPlayerUnavailableError, type OneShotSound, type SoundPlayer } from '@/core/playlists/domain';

export interface FoundryAudioHelper {
  play(
    data: { src: string; volume?: number; autoplay?: boolean; loop?: boolean },
    broadcast?: boolean
  ): Promise<unknown>;
}

export interface FoundryAudioGlobals {
  foundry?: { audio?: { AudioHelper?: FoundryAudioHelper } };
  AudioHelper?: FoundryAudioHelper;
}

export type AudioGlobalsProvider = () => FoundryAudioGlobals;

const fromGlobalThis: AudioGlobalsProvider = () => globalThis as unknown as FoundryAudioGlobals;

function isAudioHelper(candidate: FoundryAudioHelper | undefined): candidate is FoundryAudioHelper {
  return candidate !== undefined && typeof candidate.play === 'function';
}

/** The core's AudioHelper: namespaced under `foundry.audio` since Foundry 12, a bare global before. */
export class FoundrySoundPlayer implements SoundPlayer {
  constructor(private readonly globals: AudioGlobalsProvider = fromGlobalThis) {}

  isAvailable(): boolean {
    return this.findHelper() !== null;
  }

  async play(sound: OneShotSound, broadcast: boolean): Promise<void> {
    const helper = this.findHelper();
    if (helper === null) {
      throw new SoundPlayerUnavailableError();
    }
    await helper.play({ src: sound.src, volume: sound.volume, autoplay: true, loop: sound.loop }, broadcast);
  }

  private findHelper(): FoundryAudioHelper | null {
    const globals = this.globals();
    const namespaced = globals.foundry?.audio?.AudioHelper;
    if (isAudioHelper(namespaced)) {
      return namespaced;
    }
    return isAudioHelper(globals.AudioHelper) ? globals.AudioHelper : null;
  }
}
