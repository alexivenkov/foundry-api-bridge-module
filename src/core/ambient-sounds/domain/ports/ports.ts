import type {
  AmbientSound,
  AmbientSoundChanges,
  AmbientSoundDraft
} from '@/core/ambient-sounds/domain/model/AmbientSound';
import type {
  PositionalSound,
  SoundBroadcastGmState,
  SoundPreloadGmState
} from '@/core/ambient-sounds/domain/model/PositionalSound';

// Reads are synchronous: a scene's sounds live in memory. `createAmbientSound`
// resolves to null when the core created nothing; `updateAmbientSound` when the
// sound is gone.
export interface AmbientSoundStore {
  listAmbientSounds(sceneId: string): readonly AmbientSound[];
  findAmbientSound(sceneId: string, ambientSoundId: string): AmbientSound | null;
  createAmbientSound(sceneId: string, draft: AmbientSoundDraft): Promise<AmbientSound | null>;
  updateAmbientSound(
    sceneId: string,
    ambientSoundId: string,
    changes: AmbientSoundChanges
  ): Promise<AmbientSound | null>;
  deleteAmbientSound(sceneId: string, ambientSoundId: string): Promise<void>;
  /** The ids of the scene's levels; empty where the core has no levels. */
  listSceneLevelIds(sceneId: string): readonly string[];
}

/** What the running Foundry generation knows about sounds. */
export interface SoundFeatures {
  /** An ambient sound's `elevation` (Foundry 12+). */
  readonly elevation: boolean;
  /** Base and muffled effects, on ambient and positional sounds (Foundry 12+). */
  readonly effects: boolean;
  /** Listeners and positional sounds placed at an elevation (Foundry 13+). */
  readonly positionalElevation: boolean;
  /** An ambient sound's `name`, `locked` and `levels` (Foundry 14+). */
  readonly levels: boolean;
}

export interface SoundEnvironment {
  features(): SoundFeatures;
  /** The effect ids the world registers; null when they cannot be read. */
  effectTypes(): readonly string[] | null;
}

/** Broadcasts a one-shot sound to every connected client, this one included. */
export interface PositionalSoundEmitter {
  /** False when this client has no canvas sound layer (the canvas is disabled). */
  isAvailable(): boolean;
  /** The scene open on this client's canvas; null while none is drawn. */
  canvasSceneId(): string | null;
  emit(sound: PositionalSound): Promise<SoundBroadcastGmState>;
}

/** Asks every connected client, this one included, to load an audio file into its cache. */
export interface AudioPreloader {
  isAvailable(): boolean;
  preload(src: string): Promise<SoundPreloadGmState>;
}
