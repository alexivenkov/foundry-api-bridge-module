import type {
  PlaylistChanges,
  PlaylistDraft,
  PlaylistFolder,
  PlaylistSnapshot,
  PlaylistSoundChanges,
  PlaylistSoundSnapshot,
  PlaylistStepDirection
} from '@/core/playlists/domain/model/PlaylistManagement';

// The write side of playlists beyond the original commands. Reads are
// synchronous; a write resolves to null when the playlist or sound is gone or
// the core created nothing.
export interface PlaylistLibrary {
  findPlaylist(playlistId: string): PlaylistSnapshot | null;
  createPlaylist(draft: PlaylistDraft): Promise<PlaylistSnapshot | null>;
  /** With `stopPlayback`, the playlist and every sound are stopped in the same update. */
  updatePlaylist(playlistId: string, changes: PlaylistChanges, stopPlayback: boolean): Promise<PlaylistSnapshot | null>;
  deletePlaylist(playlistId: string): Promise<void>;
  updateSound(playlistId: string, soundId: string, changes: PlaylistSoundChanges): Promise<PlaylistSoundSnapshot | null>;
  deleteSound(playlistId: string, soundId: string): Promise<void>;
  /** Plays the sound after (or before) the current one in the playlist's playback order. */
  stepPlayback(playlistId: string, direction: PlaylistStepDirection): Promise<PlaylistSnapshot | null>;
  canImportSounds(): boolean;
  /** Creates a sound per audio path the playlist does not have yet; resolves to the sounds created. */
  importSounds(playlistId: string, paths: readonly string[]): Promise<readonly PlaylistSoundSnapshot[] | null>;
}

export interface PlaylistFolders {
  findFolder(folderId: string): PlaylistFolder | null;
}
