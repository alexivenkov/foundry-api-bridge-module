import type {
  AmbientSound,
  AmbientSoundChanges,
  AmbientSoundDraft,
  PositionalSound,
  SoundBroadcastGmState,
  SoundPreloadGmState
} from '@/core/ambient-sounds/domain';

export interface ListAmbientSoundsQuery {
  readonly sceneId: string | undefined;
}

export interface CreateAmbientSoundCommand {
  readonly sceneId: string | undefined;
  readonly draft: AmbientSoundDraft;
}

export interface UpdateAmbientSoundCommand {
  readonly sceneId: string | undefined;
  readonly ambientSoundId: string;
  readonly changes: AmbientSoundChanges;
}

export interface DeleteAmbientSoundCommand {
  readonly sceneId: string | undefined;
  readonly ambientSoundId: string;
}

export interface AmbientSoundListResult {
  readonly sceneId: string;
  readonly ambientSounds: readonly AmbientSound[];
}

export interface AmbientSoundMutationResult {
  readonly sceneId: string;
  readonly ambientSound: AmbientSound;
}

export interface AmbientSoundDeletionResult {
  readonly sceneId: string;
  readonly ambientSoundId: string;
}

export interface PlaySoundAtPositionCommand {
  /** When given, the scene that must be open on the GM's canvas. */
  readonly sceneId: string | undefined;
  readonly sound: PositionalSound;
}

export interface PositionalSoundResult {
  readonly sceneId: string;
  readonly sound: PositionalSound;
  readonly gmPlayback: SoundBroadcastGmState;
}

export interface PreloadSoundCommand {
  readonly src: string;
}

export interface SoundPreloadResult {
  readonly src: string;
  readonly gmPreload: SoundPreloadGmState;
}
