import type { PlaylistSnapshot, UpdatePlaylistParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryPlaylistManagementService,
  toUpdatePlaylistCommand,
  updatePlaylistRequestSchema
} from '@/core/playlists';
import { toWirePlaylistSnapshot, type PlaylistManagementHandlerDependencies } from './playlistWireMappers';

export function createUpdatePlaylistHandler(
  deps: PlaylistManagementHandlerDependencies = {}
): (params: UpdatePlaylistParams) => Promise<PlaylistSnapshot> {
  const service = createFoundryPlaylistManagementService(deps.gameProvider);

  return async function updatePlaylistHandler(params: UpdatePlaylistParams): Promise<PlaylistSnapshot> {
    const command = toUpdatePlaylistCommand(parseRequest(updatePlaylistRequestSchema, params));
    return toWirePlaylistSnapshot(await service.updatePlaylist(command));
  };
}

export const updatePlaylistHandler = createUpdatePlaylistHandler();
