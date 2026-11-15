import {
  PlaylistNotFoundError,
  PlaylistSoundCreationFailedError,
  PlaylistSoundNotFoundError,
  countPlaying,
  type Playlist,
  type PlaylistSound,
  type PlaylistStore
} from '@/core/playlists/domain';
import type {
  AddPlaylistSoundCommand,
  GetPlaylistQuery,
  PlayPlaylistCommand,
  PlayPlaylistSoundCommand,
  StopPlaylistCommand,
  StopPlaylistSoundCommand
} from './commands';

export interface PlaylistServiceDependencies {
  readonly playlists: PlaylistStore;
}

export interface PlaylistPlaybackResult {
  /** How many of the playlist's sounds play once it has started: one in a sequence, all when simultaneous. */
  readonly playingSounds: number;
}

export class PlaylistService {
  constructor(private readonly deps: PlaylistServiceDependencies) {}

  listPlaylists(): readonly Playlist[] {
    return this.deps.playlists.listPlaylists();
  }

  getPlaylist(query: GetPlaylistQuery): Playlist {
    return this.requirePlaylist(query.playlistId);
  }

  async playPlaylist(command: PlayPlaylistCommand): Promise<PlaylistPlaybackResult> {
    this.requirePlaylist(command.playlistId);
    const sounds = await this.deps.playlists.playAll(command.playlistId);
    return { playingSounds: countPlaying(sounds) };
  }

  async stopPlaylist(command: StopPlaylistCommand): Promise<void> {
    this.requirePlaylist(command.playlistId);
    await this.deps.playlists.stopAll(command.playlistId);
  }

  /** Resolves to the sound that was started. */
  async playSound(command: PlayPlaylistSoundCommand): Promise<PlaylistSound> {
    const sound = this.requireSound(command.playlistId, command.soundId);
    await this.deps.playlists.playSound(command.playlistId, command.soundId);
    return sound;
  }

  async stopSound(command: StopPlaylistSoundCommand): Promise<void> {
    this.requireSound(command.playlistId, command.soundId);
    await this.deps.playlists.stopSound(command.playlistId, command.soundId);
  }

  async addSound(command: AddPlaylistSoundCommand): Promise<PlaylistSound> {
    this.requirePlaylist(command.playlistId);
    const sound = await this.deps.playlists.addSound(command.playlistId, command.draft);
    if (sound === null) {
      throw new PlaylistSoundCreationFailedError();
    }
    return sound;
  }

  private requirePlaylist(playlistId: string): Playlist {
    const playlist = this.deps.playlists.findPlaylist(playlistId);
    if (playlist === null) {
      throw new PlaylistNotFoundError(playlistId);
    }
    return playlist;
  }

  private requireSound(playlistId: string, soundId: string): PlaylistSound {
    const sound = this.requirePlaylist(playlistId).sounds.find((candidate) => candidate.id === soundId);
    if (sound === undefined) {
      throw new PlaylistSoundNotFoundError(playlistId, soundId);
    }
    return sound;
  }
}
