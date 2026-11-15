import { emptyAsAbsent } from '@/core/shared';
import type {
  CreatePlaylistCommand,
  DeletePlaylistCommand,
  DeletePlaylistSoundCommand,
  ImportPlaylistSoundsCommand,
  StepPlaylistCommand,
  UpdatePlaylistCommand,
  UpdatePlaylistSoundCommand
} from '@/core/playlists/application';
import type {
  CreatePlaylistRequest,
  DeletePlaylistRequest,
  DeletePlaylistSoundRequest,
  ImportPlaylistSoundsRequest,
  PlayNextInPlaylistRequest,
  UpdatePlaylistRequest,
  UpdatePlaylistSoundRequest
} from './playlistManagementSchemas';

export function toCreatePlaylistCommand(request: CreatePlaylistRequest): CreatePlaylistCommand {
  return {
    draft: {
      name: request.name,
      description: request.description,
      mode: request.mode,
      channel: request.channel,
      fade: request.fade,
      sorting: request.sorting,
      folderId: emptyAsAbsent(request.folderId)
    }
  };
}

export function toUpdatePlaylistCommand(request: UpdatePlaylistRequest): UpdatePlaylistCommand {
  return {
    playlistId: request.playlistId,
    changes: {
      name: request.name,
      description: request.description,
      mode: request.mode,
      channel: request.channel,
      fade: request.fade,
      sorting: request.sorting,
      folderId: request.folderId
    }
  };
}

export function toDeletePlaylistCommand(request: DeletePlaylistRequest): DeletePlaylistCommand {
  return { playlistId: request.playlistId };
}

export function toUpdatePlaylistSoundCommand(request: UpdatePlaylistSoundRequest): UpdatePlaylistSoundCommand {
  return {
    playlistId: request.playlistId,
    soundId: request.soundId,
    changes: {
      name: request.name,
      path: request.path,
      description: request.description,
      volume: request.volume,
      repeat: request.repeat,
      fade: request.fade,
      channel: request.channel,
      sort: request.sort
    }
  };
}

export function toDeletePlaylistSoundCommand(request: DeletePlaylistSoundRequest): DeletePlaylistSoundCommand {
  return { playlistId: request.playlistId, soundId: request.soundId };
}

export function toStepPlaylistCommand(request: PlayNextInPlaylistRequest): StepPlaylistCommand {
  return { playlistId: request.playlistId, direction: request.direction ?? 'next' };
}

export function toImportPlaylistSoundsCommand(request: ImportPlaylistSoundsRequest): ImportPlaylistSoundsCommand {
  return { playlistId: request.playlistId, paths: request.paths };
}
