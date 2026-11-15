import type { GetPlaylistsParams, GetPlaylistsResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryPlaylistService } from '@/core/playlists';
import { toWirePlaylistSummary, type PlaylistHandlerDependencies } from './playlistWireMappers';

export function createGetPlaylistsHandler(
  deps: PlaylistHandlerDependencies = {}
): (params: GetPlaylistsParams) => Promise<GetPlaylistsResult> {
  const service = createFoundryPlaylistService(deps.gameProvider);

  // The command takes no parameters, so there is nothing to validate.
  return function getPlaylistsHandler(_params: GetPlaylistsParams): Promise<GetPlaylistsResult> {
    try {
      return Promise.resolve(service.listPlaylists().map(toWirePlaylistSummary));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getPlaylistsHandler = createGetPlaylistsHandler();
