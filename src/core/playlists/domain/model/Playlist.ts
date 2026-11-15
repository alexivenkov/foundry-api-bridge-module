/**
 * `soundboard` is a playlist that only plays single sounds on request. `disabled`
 * is the core's own name for that mode: still a valid value, but never reported.
 */
export const PLAYLIST_MODES = ['disabled', 'sequential', 'shuffle', 'simultaneous', 'soundboard'] as const;
export type PlaylistMode = (typeof PLAYLIST_MODES)[number];

export const PLAYLIST_CHANNELS = ['music', 'environment', 'interface'] as const;
export type PlaylistChannel = (typeof PLAYLIST_CHANNELS)[number];

export interface PlaylistSound {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly playing: boolean;
  readonly volume: number;
  readonly repeat: boolean;
}

export interface Playlist {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly mode: PlaylistMode;
  readonly channel: PlaylistChannel | null;
  /** Fade duration in milliseconds. */
  readonly fade: number | null;
  readonly playing: boolean;
  readonly description: string | null;
  readonly folderName: string | null;
  readonly sounds: readonly PlaylistSound[];
}

/** A sound to add to a playlist; an omitted attribute is left to the core default. */
export interface PlaylistSoundDraft {
  readonly name: string;
  readonly path: string;
  readonly volume?: number | undefined;
  readonly repeat?: boolean | undefined;
  readonly description?: string | undefined;
}

/** A sound played on its own, outside any playlist. */
export interface OneShotSound {
  readonly src: string;
  readonly volume: number;
  readonly loop: boolean;
}

export function countPlaying(sounds: readonly PlaylistSound[]): number {
  return sounds.filter((sound) => sound.playing).length;
}
