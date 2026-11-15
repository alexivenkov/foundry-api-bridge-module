import type {
  PlaylistDetail,
  PlaylistSnapshot as WirePlaylistSnapshot,
  PlaylistSoundSnapshot as WirePlaylistSoundSnapshot,
  PlaylistSoundSummary,
  PlaylistSummary
} from '@/commands/types';
import type {
  Playlist,
  PlaylistGameProvider,
  PlaylistLibraryGameProvider,
  PlaylistSnapshot,
  PlaylistSound,
  PlaylistSoundSnapshot
} from '@/core/playlists';

export interface PlaylistHandlerDependencies {
  gameProvider?: PlaylistGameProvider;
}

export interface PlaylistManagementHandlerDependencies {
  gameProvider?: PlaylistLibraryGameProvider;
}

export function toWirePlaylistSound(sound: PlaylistSound): PlaylistSoundSummary {
  return {
    id: sound.id,
    name: sound.name,
    path: sound.path,
    playing: sound.playing,
    volume: sound.volume,
    repeat: sound.repeat
  };
}

export function toWirePlaylistSummary(playlist: Playlist): PlaylistSummary {
  return {
    id: playlist.id,
    uuid: playlist.uuid,
    name: playlist.name,
    mode: playlist.mode,
    channel: playlist.channel,
    fade: playlist.fade,
    playing: playlist.playing,
    description: playlist.description,
    folder: playlist.folderName,
    soundCount: playlist.sounds.length
  };
}

export function toWirePlaylistDetail(playlist: Playlist): PlaylistDetail {
  return {
    ...toWirePlaylistSummary(playlist),
    sounds: playlist.sounds.map(toWirePlaylistSound)
  };
}

export function toWirePlaylistSoundSnapshot(sound: PlaylistSoundSnapshot): WirePlaylistSoundSnapshot {
  return {
    ...toWirePlaylistSound(sound),
    description: sound.description,
    channel: sound.channel,
    fade: sound.fade,
    sort: sound.sort
  };
}

/** `get-playlist`'s detail plus the fields only the management commands report. */
export function toWirePlaylistSnapshot(playlist: PlaylistSnapshot): WirePlaylistSnapshot {
  return {
    ...toWirePlaylistDetail(playlist),
    folderId: playlist.folderId,
    sorting: playlist.sorting,
    sounds: playlist.sounds.map(toWirePlaylistSoundSnapshot)
  };
}
