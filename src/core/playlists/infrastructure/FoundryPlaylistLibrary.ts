import type { GameProvider } from '@/core/shared';
import type {
  PlaylistChanges,
  PlaylistDraft,
  PlaylistFolder,
  PlaylistFolders,
  PlaylistLibrary,
  PlaylistSnapshot,
  PlaylistSoundChanges,
  PlaylistSoundSnapshot,
  PlaylistStepDirection
} from '@/core/playlists/domain';
import type { FoundryPlaylistLibraryCollection, FoundryPlaylistLibraryGame } from './foundryPlaylistTypes';
import {
  toFoundryPlaylistChanges,
  toFoundryPlaylistData,
  toFoundrySoundChanges,
  toPlaylistSnapshot,
  toPlaylistSoundSnapshot
} from './playlistLibraryMapper';

export type PlaylistLibraryGameProvider = GameProvider<FoundryPlaylistLibraryGame>;

/** Anti-corruption layer for creating, changing and deleting playlists and their sounds. */
export class FoundryPlaylistLibrary implements PlaylistLibrary, PlaylistFolders {
  constructor(private readonly gameProvider: PlaylistLibraryGameProvider) {}

  findPlaylist(playlistId: string): PlaylistSnapshot | null {
    const document = this.playlists().get(playlistId);
    return document !== undefined ? toPlaylistSnapshot(document) : null;
  }

  findFolder(folderId: string): PlaylistFolder | null {
    const folder = this.gameProvider.getGame().folders.get(folderId);
    return folder !== undefined ? { id: folder.id, type: folder.type } : null;
  }

  async createPlaylist(draft: PlaylistDraft): Promise<PlaylistSnapshot | null> {
    const created = await this.playlists().documentClass.create(toFoundryPlaylistData(draft));
    return created ? toPlaylistSnapshot(created) : null;
  }

  async updatePlaylist(
    playlistId: string,
    changes: PlaylistChanges,
    stopPlayback: boolean
  ): Promise<PlaylistSnapshot | null> {
    const document = this.playlists().get(playlistId);
    if (document === undefined) {
      return null;
    }
    const data = toFoundryPlaylistChanges(changes);
    if (stopPlayback) {
      // What Playlist#stopAll writes, plus the paused offsets, so no sound resumes mid-track later.
      data['playing'] = false;
      data['sounds'] = document.sounds.contents.map((sound) => ({ _id: sound.id, playing: false, pausedTime: null }));
    }
    await document.update(data);
    return toPlaylistSnapshot(document);
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await this.playlists().get(playlistId)?.delete();
  }

  async updateSound(
    playlistId: string,
    soundId: string,
    changes: PlaylistSoundChanges
  ): Promise<PlaylistSoundSnapshot | null> {
    const sound = this.playlists().get(playlistId)?.sounds.get(soundId);
    if (sound === undefined) {
      return null;
    }
    await sound.update(toFoundrySoundChanges(changes));
    return toPlaylistSoundSnapshot(sound);
  }

  async deleteSound(playlistId: string, soundId: string): Promise<void> {
    await this.playlists().get(playlistId)?.sounds.get(soundId)?.delete();
  }

  async stepPlayback(playlistId: string, direction: PlaylistStepDirection): Promise<PlaylistSnapshot | null> {
    const document = this.playlists().get(playlistId);
    if (document === undefined) {
      return null;
    }
    await document.playNext(undefined, { direction: direction === 'previous' ? -1 : 1 });
    return toPlaylistSnapshot(document);
  }

  canImportSounds(): boolean {
    return typeof this.playlists().documentClass.prototype.bulkImportSounds === 'function';
  }

  async importSounds(playlistId: string, paths: readonly string[]): Promise<readonly PlaylistSoundSnapshot[] | null> {
    const document = this.playlists().get(playlistId);
    if (document?.bulkImportSounds === undefined) {
      return null;
    }
    const created = await document.bulkImportSounds([...paths]);
    return created.map(toPlaylistSoundSnapshot);
  }

  private playlists(): FoundryPlaylistLibraryCollection {
    return this.gameProvider.getGame().playlists;
  }
}
