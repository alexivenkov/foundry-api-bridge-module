import type {
  AddPlaylistSoundCommand,
  GetPlaylistQuery,
  PlayPlaylistCommand,
  PlayPlaylistSoundCommand,
  PlaySoundOnceCommand,
  StopPlaylistCommand,
  StopPlaylistSoundCommand
} from '@/core/playlists/application';
import type {
  AddSoundToPlaylistRequest,
  GetPlaylistRequest,
  PlayPlaylistRequest,
  PlaySoundInPlaylistRequest,
  PlaySoundOnceRequest,
  StopPlaylistRequest,
  StopSoundInPlaylistRequest
} from './playlistSchemas';

const DEFAULT_ONE_SHOT_VOLUME = 0.8;

export function toGetPlaylistQuery(request: GetPlaylistRequest): GetPlaylistQuery {
  return { playlistId: request.playlistId };
}

export function toPlayPlaylistCommand(request: PlayPlaylistRequest): PlayPlaylistCommand {
  return { playlistId: request.playlistId };
}

export function toStopPlaylistCommand(request: StopPlaylistRequest): StopPlaylistCommand {
  return { playlistId: request.playlistId };
}

export function toPlayPlaylistSoundCommand(request: PlaySoundInPlaylistRequest): PlayPlaylistSoundCommand {
  return { playlistId: request.playlistId, soundId: request.soundId };
}

export function toStopPlaylistSoundCommand(request: StopSoundInPlaylistRequest): StopPlaylistSoundCommand {
  return { playlistId: request.playlistId, soundId: request.soundId };
}

export function toAddPlaylistSoundCommand(request: AddSoundToPlaylistRequest): AddPlaylistSoundCommand {
  return {
    playlistId: request.playlistId,
    draft: {
      name: request.name,
      path: request.path,
      volume: request.volume,
      repeat: request.repeat,
      description: request.description
    }
  };
}

export function toPlaySoundOnceCommand(request: PlaySoundOnceRequest): PlaySoundOnceCommand {
  return {
    sound: {
      src: request.src,
      volume: request.volume ?? DEFAULT_ONE_SHOT_VOLUME,
      loop: request.loop ?? false
    },
    broadcast: request.broadcast ?? true
  };
}
