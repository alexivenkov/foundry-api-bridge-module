import { foundryGeneration } from '@/compat/foundryVersion';
import type { SoundEnvironment, SoundFeatures } from '@/core/ambient-sounds/domain';
import type { AudioGlobalsProvider, FoundryAudioGlobals } from './foundryAudioTypes';
import { soundFeaturesFor } from './soundFeatures';

export const audioGlobalsFromGlobalThis: AudioGlobalsProvider = () => globalThis as unknown as FoundryAudioGlobals;

/**
 * Ambient and positional sounds build their effects from `CONFIG.soundEffects`
 * (`Sound.createEffect` / `Sound#playAtPosition`, Foundry 13–14); modules add
 * their own.
 */
export class FoundrySoundEnvironment implements SoundEnvironment {
  constructor(
    private readonly globals: AudioGlobalsProvider = audioGlobalsFromGlobalThis,
    private readonly generation: () => number = foundryGeneration
  ) {}

  features(): SoundFeatures {
    return soundFeaturesFor(this.generation());
  }

  effectTypes(): readonly string[] | null {
    const registry = this.globals().CONFIG?.soundEffects;
    return registry ? Object.keys(registry) : null;
  }
}
