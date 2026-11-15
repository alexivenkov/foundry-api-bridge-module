import type { PlaylistChannel } from '@/core/playlists/domain';

export interface FoundryPlaylistSoundDocument {
  id: string;
  name: string;
  path: string;
  playing: boolean;
  volume: number;
  repeat: boolean;
  fade: number | null | undefined;
  description: string | null | undefined;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
}

export interface FoundryPlaylistSoundsCollection {
  contents: ReadonlyArray<FoundryPlaylistSoundDocument>;
  get(id: string): FoundryPlaylistSoundDocument | undefined;
}

export interface FoundryPlaylistDocument {
  id: string;
  uuid: string;
  name: string;
  mode: number;
  fade: number | null | undefined;
  channel: PlaylistChannel | null | undefined;
  playing: boolean;
  description: string | null | undefined;
  folder: { id: string; name: string } | null | undefined;
  sounds: FoundryPlaylistSoundsCollection;
  /** Resolves to nothing when the update it makes changes nothing. */
  playAll(): Promise<FoundryPlaylistDocument | undefined>;
  stopAll(): Promise<unknown>;
  playSound(sound: FoundryPlaylistSoundDocument): Promise<unknown>;
  stopSound(sound: FoundryPlaylistSoundDocument): Promise<unknown>;
  createEmbeddedDocuments(
    type: 'PlaylistSound',
    data: Record<string, unknown>[]
  ): Promise<FoundryPlaylistSoundDocument[]>;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
}

export interface FoundryPlaylistsCollection {
  contents: ReadonlyArray<FoundryPlaylistDocument>;
  get(id: string): FoundryPlaylistDocument | undefined;
}

export interface FoundryPlaylistGame {
  playlists: FoundryPlaylistsCollection;
}

/** A sound with the fields the management commands read (13.351 and 14.368). */
export interface FoundryPlaylistLibrarySoundDocument extends FoundryPlaylistSoundDocument {
  /** Blank: the playlist's channel. */
  channel: string | null | undefined;
  sort: number;
}

export interface FoundryPlaylistLibrarySoundsCollection extends FoundryPlaylistSoundsCollection {
  contents: ReadonlyArray<FoundryPlaylistLibrarySoundDocument>;
  get(id: string): FoundryPlaylistLibrarySoundDocument | undefined;
}

export interface FoundryPlaylistLibraryDocument extends FoundryPlaylistDocument {
  /** CONST.PLAYLIST_SORT_MODES: `a` alphabetical, `m` manual. */
  sorting: string;
  sounds: FoundryPlaylistLibrarySoundsCollection;
  /** Does nothing (resolves to null) unless the playlist is sequential or shuffled; a stopped playlist stops every sound. */
  playNext(soundId?: string, options?: { direction?: number }): Promise<unknown>;
  /** Present in 13.351 and 14.368; skips paths without an audio extension and paths the playlist already has. */
  bulkImportSounds?: (paths: string[]) => Promise<FoundryPlaylistLibrarySoundDocument[]>;
}

export interface FoundryPlaylistLibraryClass {
  create(data: Record<string, unknown>): Promise<FoundryPlaylistLibraryDocument | undefined>;
  prototype: { bulkImportSounds?: unknown };
}

export interface FoundryPlaylistLibraryCollection {
  get(id: string): FoundryPlaylistLibraryDocument | undefined;
  documentClass: FoundryPlaylistLibraryClass;
}

export interface FoundryPlaylistLibraryGame {
  playlists: FoundryPlaylistLibraryCollection;
  folders: { get(id: string): { id: string; type: string } | undefined };
}
