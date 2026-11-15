import type { Playlist, PlaylistSound, PlaylistSoundDraft } from '@/core/playlists/domain';
import type { FoundryPlaylistDocument, FoundryPlaylistSoundDocument } from './foundryPlaylistTypes';
import { playlistModeFromCode } from './playlistModeCodes';

export function toPlaylistSound(document: FoundryPlaylistSoundDocument): PlaylistSound {
  return {
    id: document.id,
    name: document.name,
    path: document.path,
    playing: document.playing,
    volume: document.volume,
    repeat: document.repeat
  };
}

export function toPlaylist(document: FoundryPlaylistDocument): Playlist {
  return {
    id: document.id,
    uuid: document.uuid,
    name: document.name,
    mode: playlistModeFromCode(document.mode),
    channel: document.channel ?? null,
    fade: document.fade ?? null,
    playing: document.playing,
    description: document.description ?? null,
    folderName: document.folder?.name ?? null,
    sounds: document.sounds.contents.map(toPlaylistSound)
  };
}

/** Only the attributes that are set become document fields. */
export function toFoundrySoundData(draft: PlaylistSoundDraft): Record<string, unknown> {
  const data: Record<string, unknown> = { name: draft.name, path: draft.path };

  if (draft.volume !== undefined) {
    data['volume'] = draft.volume;
  }
  if (draft.repeat !== undefined) {
    data['repeat'] = draft.repeat;
  }
  if (draft.description !== undefined) {
    data['description'] = draft.description;
  }

  return data;
}
