import type { GameProvider } from '@/core/shared';
import {
  PlaylistNotFoundError,
  PlaylistSoundNotFoundError,
  type Playlist,
  type PlaylistSound,
  type PlaylistSoundDraft,
  type PlaylistStore
} from '@/core/playlists/domain';
import type {
  FoundryPlaylistDocument,
  FoundryPlaylistGame,
  FoundryPlaylistSoundDocument,
  FoundryPlaylistsCollection
} from './foundryPlaylistTypes';
import { toFoundrySoundData, toPlaylist, toPlaylistSound } from './playlistMapper';

export type PlaylistGameProvider = GameProvider<FoundryPlaylistGame>;

/** Anti-corruption layer over the world's Playlist documents and their embedded sounds. */
export class FoundryPlaylistStore implements PlaylistStore {
  constructor(private readonly gameProvider: PlaylistGameProvider) {}

  listPlaylists(): readonly Playlist[] {
    return this.playlists().contents.map(toPlaylist);
  }

  findPlaylist(playlistId: string): Playlist | null {
    const document = this.playlists().get(playlistId);
    return document !== undefined ? toPlaylist(document) : null;
  }

  async playAll(playlistId: string): Promise<readonly PlaylistSound[]> {
    const document = this.requirePlaylist(playlistId);
    // The core resolves to nothing when starting the playlist changes nothing,
    // as when it already plays. The playlist is then as it was.
    const updated = (await document.playAll()) ?? document;
    return updated.sounds.contents.map(toPlaylistSound);
  }

  async stopAll(playlistId: string): Promise<void> {
    await this.requirePlaylist(playlistId).stopAll();
  }

  async playSound(playlistId: string, soundId: string): Promise<void> {
    const playlist = this.requirePlaylist(playlistId);
    await playlist.playSound(this.requireSound(playlist, soundId));
  }

  async stopSound(playlistId: string, soundId: string): Promise<void> {
    const playlist = this.requirePlaylist(playlistId);
    await playlist.stopSound(this.requireSound(playlist, soundId));
  }

  async addSound(playlistId: string, draft: PlaylistSoundDraft): Promise<PlaylistSound | null> {
    const created = await this.requirePlaylist(playlistId).createEmbeddedDocuments('PlaylistSound', [
      toFoundrySoundData(draft)
    ]);
    const document = created[0];
    return document ? toPlaylistSound(document) : null;
  }

  private playlists(): FoundryPlaylistsCollection {
    return this.gameProvider.getGame().playlists;
  }

  private requirePlaylist(playlistId: string): FoundryPlaylistDocument {
    const document = this.playlists().get(playlistId);
    if (document === undefined) {
      throw new PlaylistNotFoundError(playlistId);
    }
    return document;
  }

  private requireSound(playlist: FoundryPlaylistDocument, soundId: string): FoundryPlaylistSoundDocument {
    const sound = playlist.sounds.get(soundId);
    if (sound === undefined) {
      throw new PlaylistSoundNotFoundError(playlist.id, soundId);
    }
    return sound;
  }
}
