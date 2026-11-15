import type { PlaylistSorting } from '@/core/playlists/domain';

// CONST.PLAYLIST_SORT_MODES, identical in Foundry 13.351 and 14.368.
const SORTING_CODE: Readonly<Record<PlaylistSorting, string>> = { alphabetical: 'a', manual: 'm' };

/** The core's default for a code it does not have. */
export function playlistSortingFromCode(code: string): PlaylistSorting {
  return code === 'm' ? 'manual' : 'alphabetical';
}

export function playlistSortingToCode(sorting: PlaylistSorting): string {
  return SORTING_CODE[sorting];
}
