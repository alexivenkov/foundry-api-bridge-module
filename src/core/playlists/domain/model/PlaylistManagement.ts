import type { Playlist, PlaylistChannel, PlaylistMode, PlaylistSound } from './Playlist';

export const PLAYLIST_SORTINGS = ['alphabetical', 'manual'] as const;
export type PlaylistSorting = (typeof PLAYLIST_SORTINGS)[number];

export const PLAYLIST_STEP_DIRECTIONS = ['next', 'previous'] as const;
export type PlaylistStepDirection = (typeof PLAYLIST_STEP_DIRECTIONS)[number];

/** CONST.AUDIO_FILE_EXTENSIONS, identical in Foundry 13.351 and 14.368. */
export const PLAYLIST_AUDIO_EXTENSIONS = ['aac', 'flac', 'm4a', 'mid', 'mp3', 'ogg', 'opus', 'wav', 'webm'] as const;

export interface PlaylistSoundSnapshot extends PlaylistSound {
  readonly description: string | null;
  /** null: the sound plays on its playlist's channel. */
  readonly channel: PlaylistChannel | null;
  /** Milliseconds; null: the playlist's fade. */
  readonly fade: number | null;
  readonly sort: number;
}

export interface PlaylistSnapshot extends Playlist {
  readonly folderId: string | null;
  readonly sorting: PlaylistSorting;
  readonly sounds: readonly PlaylistSoundSnapshot[];
}

/** A new playlist; an omitted attribute is left to the core default. */
export interface PlaylistDraft {
  readonly name: string;
  readonly description?: string | undefined;
  readonly mode?: PlaylistMode | undefined;
  readonly channel?: PlaylistChannel | undefined;
  readonly fade?: number | undefined;
  readonly sorting?: PlaylistSorting | undefined;
  readonly folderId?: string | undefined;
}

/** An omitted attribute is kept; null clears it. */
export interface PlaylistChanges {
  readonly name?: string | undefined;
  readonly description?: string | null | undefined;
  readonly mode?: PlaylistMode | undefined;
  readonly channel?: PlaylistChannel | undefined;
  readonly fade?: number | null | undefined;
  readonly sorting?: PlaylistSorting | undefined;
  readonly folderId?: string | null | undefined;
}

export interface PlaylistSoundChanges {
  readonly name?: string | undefined;
  readonly path?: string | undefined;
  readonly description?: string | null | undefined;
  readonly volume?: number | undefined;
  readonly repeat?: boolean | undefined;
  readonly fade?: number | null | undefined;
  readonly channel?: PlaylistChannel | null | undefined;
  readonly sort?: number | undefined;
}

export interface PlaylistFolder {
  readonly id: string;
  /** The document type the folder holds. */
  readonly type: string;
}
