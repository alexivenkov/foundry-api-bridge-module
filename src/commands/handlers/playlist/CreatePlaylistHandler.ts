import type { CreatePlaylistParams, PlaylistSnapshot } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryPlaylistManagementService,
  createPlaylistRequestSchema,
  toCreatePlaylistCommand
} from '@/core/playlists';
import { toWirePlaylistSnapshot, type PlaylistManagementHandlerDependencies } from './playlistWireMappers';

export function createCreatePlaylistHandler(
  deps: PlaylistManagementHandlerDependencies = {}
): (params: CreatePlaylistParams) => Promise<PlaylistSnapshot> {
  const service = createFoundryPlaylistManagementService(deps.gameProvider);

  return async function createPlaylistHandler(params: CreatePlaylistParams): Promise<PlaylistSnapshot> {
    const command = toCreatePlaylistCommand(parseRequest(createPlaylistRequestSchema, params));
    return toWirePlaylistSnapshot(await service.createPlaylist(command));
  };
}

export const createPlaylistHandler = createCreatePlaylistHandler();
