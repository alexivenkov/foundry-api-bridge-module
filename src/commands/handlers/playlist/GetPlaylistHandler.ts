import type { GetPlaylistParams, GetPlaylistResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryPlaylistService, getPlaylistRequestSchema, toGetPlaylistQuery } from '@/core/playlists';
import { toWirePlaylistDetail, type PlaylistHandlerDependencies } from './playlistWireMappers';

export function createGetPlaylistHandler(
  deps: PlaylistHandlerDependencies = {}
): (params: GetPlaylistParams) => Promise<GetPlaylistResult> {
  const service = createFoundryPlaylistService(deps.gameProvider);

  return function getPlaylistHandler(params: GetPlaylistParams): Promise<GetPlaylistResult> {
    try {
      const query = toGetPlaylistQuery(parseRequest(getPlaylistRequestSchema, params));
      return Promise.resolve(toWirePlaylistDetail(service.getPlaylist(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getPlaylistHandler = createGetPlaylistHandler();
