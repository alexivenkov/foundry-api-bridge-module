import { CoreFeatureUnavailableError, requireScene, type SceneLocator } from '@/core/shared';
import {
  CanvasSceneRequiredError,
  SceneNotOnCanvasError,
  assertKnownEffect,
  assertPositionalSoundFeatures,
  type AudioPreloader,
  type PositionalSoundEmitter,
  type SoundEnvironment
} from '@/core/ambient-sounds/domain';
import type {
  PlaySoundAtPositionCommand,
  PositionalSoundResult,
  PreloadSoundCommand,
  SoundPreloadResult
} from './commands';

export interface SoundBroadcastServiceDependencies {
  readonly scenes: SceneLocator;
  readonly emitter: PositionalSoundEmitter;
  readonly preloader: AudioPreloader;
  readonly environment: SoundEnvironment;
}

/** Sounds sent to every connected client, without a document behind them. */
export class SoundBroadcastService {
  constructor(private readonly deps: SoundBroadcastServiceDependencies) {}

  async playAtPosition(command: PlaySoundAtPositionCommand): Promise<PositionalSoundResult> {
    const { sound } = command;
    if (!this.deps.emitter.isAvailable()) {
      throw new CoreFeatureUnavailableError(
        "Positional sounds need the game canvas, which is disabled in the GM's browser"
      );
    }
    assertPositionalSoundFeatures(sound, this.deps.environment.features());
    if (sound.baseEffect !== undefined || sound.muffledEffect !== undefined) {
      const known = this.deps.environment.effectTypes();
      assertKnownEffect(sound.baseEffect?.type, known);
      assertKnownEffect(sound.muffledEffect?.type, known);
    }

    const requested = command.sceneId !== undefined ? requireScene(this.deps.scenes, command.sceneId) : null;
    const canvasSceneId = this.deps.emitter.canvasSceneId();
    if (canvasSceneId === null) {
      throw new CanvasSceneRequiredError();
    }
    if (requested !== null && requested.id !== canvasSceneId) {
      throw new SceneNotOnCanvasError(requested.id);
    }

    const gmPlayback = await this.deps.emitter.emit(sound);
    return { sceneId: canvasSceneId, sound, gmPlayback };
  }

  async preload(command: PreloadSoundCommand): Promise<SoundPreloadResult> {
    if (!this.deps.preloader.isAvailable()) {
      throw new CoreFeatureUnavailableError('Audio preloading is not available in this Foundry version');
    }
    const gmPreload = await this.deps.preloader.preload(command.src);
    return { src: command.src, gmPreload };
  }
}
