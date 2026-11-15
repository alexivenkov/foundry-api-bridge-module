import type { DeletePlaylistParams, DeletePlaylistResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryPlaylistManagementService,
  deletePlaylistRequestSchema,
  toDeletePlaylistCommand
} from '@/core/playlists';
import type { PlaylistManagementHandlerDependencies } from './playlistWireMappers';

export function createDeletePlaylistHandler(
  deps: PlaylistManagementHandlerDependencies = {}
): (params: DeletePlaylistParams) => Promise<DeletePlaylistResult> {
  const service = createFoundryPlaylistManagementService(deps.gameProvider);

  return async function deletePlaylistHandler(params: DeletePlaylistParams): Promise<DeletePlaylistResult> {
    const command = toDeletePlaylistCommand(parseRequest(deletePlaylistRequestSchema, params));
    await service.deletePlaylist(command);
    return { deleted: true, playlistId: command.playlistId };
  };
}

export const deletePlaylistHandler = createDeletePlaylistHandler();
