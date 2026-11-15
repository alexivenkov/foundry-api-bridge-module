import { FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { AmbientSoundService, SoundBroadcastService } from './application';
import {
  FoundryAmbientSoundStore,
  FoundryAudioPreloader,
  FoundryPositionalSoundEmitter,
  FoundrySoundEnvironment,
  type AmbientSoundGameProvider,
  type AudioGlobalsProvider,
  type FoundryAmbientSoundGame
} from './infrastructure';

export const defaultAmbientSoundGameProvider: AmbientSoundGameProvider =
  globalGameProvider<FoundryAmbientSoundGame>();

export interface SoundWiring {
  readonly gameProvider?: AmbientSoundGameProvider | undefined;
  readonly audioGlobals?: AudioGlobalsProvider | undefined;
  readonly generation?: (() => number) | undefined;
}

// Composition root of the context. Handlers pass custom wiring only in tests.

export function createFoundryAmbientSoundService(wiring: SoundWiring = {}): AmbientSoundService {
  const gameProvider = wiring.gameProvider ?? defaultAmbientSoundGameProvider;
  return new AmbientSoundService({
    scenes: new FoundrySceneLocator(gameProvider),
    sounds: new FoundryAmbientSoundStore(gameProvider, wiring.generation),
    environment: new FoundrySoundEnvironment(wiring.audioGlobals, wiring.generation)
  });
}

export function createFoundrySoundBroadcastService(wiring: SoundWiring = {}): SoundBroadcastService {
  const gameProvider = wiring.gameProvider ?? defaultAmbientSoundGameProvider;
  return new SoundBroadcastService({
    scenes: new FoundrySceneLocator(gameProvider),
    emitter: new FoundryPositionalSoundEmitter(wiring.audioGlobals),
    preloader: new FoundryAudioPreloader(wiring.audioGlobals),
    environment: new FoundrySoundEnvironment(wiring.audioGlobals, wiring.generation)
  });
}
