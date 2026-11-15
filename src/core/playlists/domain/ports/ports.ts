import type {
  OneShotSound,
  Playlist,
  PlaylistSound,
  PlaylistSoundDraft
} from '@/core/playlists/domain/model/Playlist';

// Reads are synchronous: the world's playlists live in memory. A write to a
// playlist or a sound that is gone fails with the matching not-found error.
export interface PlaylistStore {
  listPlaylists(): readonly Playlist[];
  findPlaylist(playlistId: string): Playlist | null;
  /** Starts the playlist in its own mode; resolves to its sounds as the core reports them afterwards. */
  playAll(playlistId: string): Promise<readonly PlaylistSound[]>;
  stopAll(playlistId: string): Promise<void>;
  playSound(playlistId: string, soundId: string): Promise<void>;
  stopSound(playlistId: string, soundId: string): Promise<void>;
  /** Resolves to null when the core created nothing. */
  addSound(playlistId: string, draft: PlaylistSoundDraft): Promise<PlaylistSound | null>;
}

/** Plays a sound outside any playlist, on this client and — when broadcast — on every other one. */
export interface SoundPlayer {
  isAvailable(): boolean;
  play(sound: OneShotSound, broadcast: boolean): Promise<void>;
}
