import type {
  OneShotSound,
  PlaylistChanges,
  PlaylistDraft,
  PlaylistSoundChanges,
  PlaylistSoundDraft,
  PlaylistStepDirection
} from '@/core/playlists/domain';

export interface GetPlaylistQuery {
  readonly playlistId: string;
}

export interface PlayPlaylistCommand {
  readonly playlistId: string;
}

export interface StopPlaylistCommand {
  readonly playlistId: string;
}

export interface PlayPlaylistSoundCommand {
  readonly playlistId: string;
  readonly soundId: string;
}

export interface StopPlaylistSoundCommand {
  readonly playlistId: string;
  readonly soundId: string;
}

export interface AddPlaylistSoundCommand {
  readonly playlistId: string;
  readonly draft: PlaylistSoundDraft;
}

export interface PlaySoundOnceCommand {
  readonly sound: OneShotSound;
  /** Whether the other connected clients hear it too. */
  readonly broadcast: boolean;
}

export interface CreatePlaylistCommand {
  readonly draft: PlaylistDraft;
}

export interface UpdatePlaylistCommand {
  readonly playlistId: string;
  readonly changes: PlaylistChanges;
}

export interface DeletePlaylistCommand {
  readonly playlistId: string;
}

export interface UpdatePlaylistSoundCommand {
  readonly playlistId: string;
  readonly soundId: string;
  readonly changes: PlaylistSoundChanges;
}

export interface DeletePlaylistSoundCommand {
  readonly playlistId: string;
  readonly soundId: string;
}

export interface StepPlaylistCommand {
  readonly playlistId: string;
  readonly direction: PlaylistStepDirection;
}

export interface ImportPlaylistSoundsCommand {
  readonly playlistId: string;
  readonly paths: readonly string[];
}
