import {
  PLAYLIST_CHANNELS,
  type PlaylistChannel,
  type PlaylistChanges,
  type PlaylistDraft,
  type PlaylistSnapshot,
  type PlaylistSoundChanges,
  type PlaylistSoundSnapshot
} from '@/core/playlists/domain';
import type { FoundryPlaylistLibraryDocument, FoundryPlaylistLibrarySoundDocument } from './foundryPlaylistTypes';
import { toPlaylist, toPlaylistSound } from './playlistMapper';
import { playlistModeToCode } from './playlistModeCodes';
import { playlistSortingFromCode, playlistSortingToCode } from './playlistSortingCodes';

function isChannel(channel: string | null | undefined): channel is PlaylistChannel {
  return (PLAYLIST_CHANNELS as readonly (string | null | undefined)[]).includes(channel);
}

function toChannel(channel: string | null | undefined): PlaylistChannel | null {
  return isChannel(channel) ? channel : null;
}

export function toPlaylistSoundSnapshot(document: FoundryPlaylistLibrarySoundDocument): PlaylistSoundSnapshot {
  return {
    ...toPlaylistSound(document),
    description: document.description ?? null,
    channel: toChannel(document.channel),
    fade: document.fade ?? null,
    sort: document.sort
  };
}

export function toPlaylistSnapshot(document: FoundryPlaylistLibraryDocument): PlaylistSnapshot {
  return {
    ...toPlaylist(document),
    folderId: document.folder?.id ?? null,
    sorting: playlistSortingFromCode(document.sorting),
    sounds: document.sounds.contents.map(toPlaylistSoundSnapshot)
  };
}

/** Only the attributes that are set become document fields. */
export function toFoundryPlaylistData(draft: PlaylistDraft): Record<string, unknown> {
  const data: Record<string, unknown> = { name: draft.name };
  if (draft.description !== undefined) {
    data['description'] = draft.description;
  }
  if (draft.mode !== undefined) {
    data['mode'] = playlistModeToCode(draft.mode);
  }
  if (draft.channel !== undefined) {
    data['channel'] = draft.channel;
  }
  if (draft.fade !== undefined) {
    data['fade'] = draft.fade;
  }
  if (draft.sorting !== undefined) {
    data['sorting'] = playlistSortingToCode(draft.sorting);
  }
  if (draft.folderId !== undefined) {
    data['folder'] = draft.folderId;
  }
  return data;
}

export function toFoundryPlaylistChanges(changes: PlaylistChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (changes.name !== undefined) {
    data['name'] = changes.name;
  }
  if (changes.description !== undefined) {
    data['description'] = changes.description;
  }
  if (changes.mode !== undefined) {
    data['mode'] = playlistModeToCode(changes.mode);
  }
  if (changes.channel !== undefined) {
    data['channel'] = changes.channel;
  }
  if (changes.fade !== undefined) {
    data['fade'] = changes.fade;
  }
  if (changes.sorting !== undefined) {
    data['sorting'] = playlistSortingToCode(changes.sorting);
  }
  if (changes.folderId !== undefined) {
    data['folder'] = changes.folderId;
  }
  return data;
}

/** A blank channel is how the core stores "the playlist's channel". */
export function toFoundrySoundChanges(changes: PlaylistSoundChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const fields = ['name', 'path', 'description', 'volume', 'repeat', 'fade', 'sort'] as const;
  for (const field of fields) {
    if (changes[field] !== undefined) {
      data[field] = changes[field];
    }
  }
  if (changes.channel !== undefined) {
    data['channel'] = changes.channel ?? '';
  }
  return data;
}
