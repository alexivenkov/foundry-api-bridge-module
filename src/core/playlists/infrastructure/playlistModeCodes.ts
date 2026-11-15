import type { PlaylistMode } from '@/core/playlists/domain';

// CONST.PLAYLIST_MODES, verified against Foundry 13.351 and 14.368: DISABLED -1,
// SEQUENTIAL 0, SHUFFLE 1, SIMULTANEOUS 2. The core labels DISABLED "Soundboard
// Only", and `soundboard` is the wire word for it; `disabled` is the same mode
// under the core's constant name, accepted but never reported.

const MODE_BY_CODE: Readonly<Record<number, PlaylistMode>> = {
  [-1]: 'soundboard',
  0: 'sequential',
  1: 'shuffle',
  2: 'simultaneous'
};

const MODE_CODE: Readonly<Record<PlaylistMode, number>> = {
  soundboard: -1,
  disabled: -1,
  sequential: 0,
  shuffle: 1,
  simultaneous: 2
};

/** A code the core does not have reads as the mode that plays nothing on its own. */
export function playlistModeFromCode(code: number): PlaylistMode {
  return MODE_BY_CODE[code] ?? 'soundboard';
}

export function playlistModeToCode(mode: PlaylistMode): number {
  return MODE_CODE[mode];
}
