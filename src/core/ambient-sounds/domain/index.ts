export { AUDIO_FILE_EXTENSIONS, isAudioPath } from './value-objects/audioPath';
export { DEFAULT_SOUND_DARKNESS_RANGE } from './model/AmbientSound';
export type {
  AmbientSound,
  AmbientSoundChanges,
  AmbientSoundDraft,
  AmbientSoundEffect,
  AmbientSoundEffectChanges,
  SoundDarknessRange,
  SoundDarknessRangeChanges
} from './model/AmbientSound';
export { POSITIONAL_SOUND_DEFAULTS } from './model/PositionalSound';
export type {
  PositionalSound,
  SoundBroadcastGmState,
  SoundEffectSpec,
  SoundPreloadGmState
} from './model/PositionalSound';
export {
  AmbientSoundCreationFailedError,
  AmbientSoundNotFoundError,
  CanvasSceneRequiredError,
  InvalidSoundDarknessRangeError,
  SceneNotOnCanvasError,
  UnknownSoundEffectError,
  UnknownSoundLevelError
} from './errors/ambientSoundErrors';
export type {
  AmbientSoundStore,
  AudioPreloader,
  PositionalSoundEmitter,
  SoundEnvironment,
  SoundFeatures
} from './ports/ports';
export {
  assertAmbientSoundFeatures,
  assertEffectsSupported,
  assertKnownEffect,
  assertPositionalSoundFeatures,
  assertSoundSceneLevels,
  resolveSoundDarknessRange
} from './rules/soundRules';
