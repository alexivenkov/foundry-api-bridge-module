import { PlaylistNotFoundError } from '@/core/playlists/domain/errors/playlistErrors';
import {
  NotAPlaylistFolderError,
  NotAnAudioFileError,
  PlaylistFolderNotFoundError,
  PlaylistNotPlayingError,
  PlaylistNotSteppableError
} from '@/core/playlists/domain/errors/playlistManagementErrors';
import type { PlaylistMode } from '@/core/playlists/domain/model/Playlist';
import {
  PLAYLIST_AUDIO_EXTENSIONS,
  type PlaylistFolder,
  type PlaylistSnapshot
} from '@/core/playlists/domain/model/PlaylistManagement';

export const MAX_IMPORTED_SOUNDS = 100;

/** `disabled` is the core's own name for the soundboard mode. */
function canonicalMode(mode: PlaylistMode): PlaylistMode {
  return mode === 'disabled' ? 'soundboard' : mode;
}

export function isPlaying(playlist: PlaylistSnapshot): boolean {
  return playlist.playing || playlist.sounds.some((sound) => sound.playing);
}

/**
 * A different mode stops what plays, as the core's own mode button
 * (`Playlist#cycleMode`) does: a sequence would otherwise keep one sound
 * running under a mode that never chose it.
 */
export function modeChangeStopsPlayback(playlist: PlaylistSnapshot, mode: PlaylistMode | undefined): boolean {
  return mode !== undefined && canonicalMode(mode) !== canonicalMode(playlist.mode) && isPlaying(playlist);
}

/** Only a running sequential or shuffled playlist has a next and a previous sound; the core silently does nothing otherwise. */
export function assertSteppable(playlist: PlaylistSnapshot): void {
  if (playlist.mode !== 'sequential' && playlist.mode !== 'shuffle') {
    throw new PlaylistNotSteppableError(playlist.id, canonicalMode(playlist.mode));
  }
  if (!playlist.playing) {
    throw new PlaylistNotPlayingError(playlist.id);
  }
}

export function assertPlaylistFolder(folder: PlaylistFolder | null, folderId: string): void {
  if (folder === null) {
    throw new PlaylistFolderNotFoundError(folderId);
  }
  if (folder.type !== 'Playlist') {
    throw new NotAPlaylistFolderError(folderId, folder.type);
  }
}

/** The core refuses any other path for a sound; the check here says which extensions it takes. */
export function assertAudioPath(path: string): void {
  const file = path.split(/[?#]/)[0] ?? '';
  const extension = file.includes('.') ? file.slice(file.lastIndexOf('.') + 1).toLowerCase() : '';
  if (!(PLAYLIST_AUDIO_EXTENSIONS as readonly string[]).includes(extension)) {
    throw new NotAnAudioFileError(path, PLAYLIST_AUDIO_EXTENSIONS);
  }
}

/** The core skips a path the playlist already has, but would add a path given twice twice. */
export function uniquePaths(paths: readonly string[]): string[] {
  return [...new Set(paths)];
}

export function requireSnapshot(playlist: PlaylistSnapshot | null, playlistId: string): PlaylistSnapshot {
  if (playlist === null) {
    throw new PlaylistNotFoundError(playlistId);
  }
  return playlist;
}
