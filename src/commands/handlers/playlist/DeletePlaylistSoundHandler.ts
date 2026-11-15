import type { DeletePlaylistSoundParams, DeletePlaylistSoundResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryPlaylistManagementService,
  deletePlaylistSoundRequestSchema,
  toDeletePlaylistSoundCommand
} from '@/core/playlists';
import type { PlaylistManagementHandlerDependencies } from './playlistWireMappers';

export function createDeletePlaylistSoundHandler(
  deps: PlaylistManagementHandlerDependencies = {}
): (params: DeletePlaylistSoundParams) => Promise<DeletePlaylistSoundResult> {
  const service = createFoundryPlaylistManagementService(deps.gameProvider);

  return async function deletePlaylistSoundHandler(
    params: DeletePlaylistSoundParams
  ): Promise<DeletePlaylistSoundResult> {
    const command = toDeletePlaylistSoundCommand(parseRequest(deletePlaylistSoundRequestSchema, params));
    await service.deleteSound(command);
    return { deleted: true, playlistId: command.playlistId, soundId: command.soundId };
  };
}

export const deletePlaylistSoundHandler = createDeletePlaylistSoundHandler();
