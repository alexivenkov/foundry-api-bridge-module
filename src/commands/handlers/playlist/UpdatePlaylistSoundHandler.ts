import type { PlaylistSoundResult, UpdatePlaylistSoundParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryPlaylistManagementService,
  toUpdatePlaylistSoundCommand,
  updatePlaylistSoundRequestSchema
} from '@/core/playlists';
import { toWirePlaylistSoundSnapshot, type PlaylistManagementHandlerDependencies } from './playlistWireMappers';

export function createUpdatePlaylistSoundHandler(
  deps: PlaylistManagementHandlerDependencies = {}
): (params: UpdatePlaylistSoundParams) => Promise<PlaylistSoundResult> {
  const service = createFoundryPlaylistManagementService(deps.gameProvider);

  return async function updatePlaylistSoundHandler(params: UpdatePlaylistSoundParams): Promise<PlaylistSoundResult> {
    const command = toUpdatePlaylistSoundCommand(parseRequest(updatePlaylistSoundRequestSchema, params));
    const sound = await service.updateSound(command);
    return { playlistId: command.playlistId, sound: toWirePlaylistSoundSnapshot(sound) };
  };
}

export const updatePlaylistSoundHandler = createUpdatePlaylistSoundHandler();
