import type { PlayPlaylistParams, PlayPlaylistResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryPlaylistService, playPlaylistRequestSchema, toPlayPlaylistCommand } from '@/core/playlists';
import type { PlaylistHandlerDependencies } from './playlistWireMappers';

export function createPlayPlaylistHandler(
  deps: PlaylistHandlerDependencies = {}
): (params: PlayPlaylistParams) => Promise<PlayPlaylistResult> {
  const service = createFoundryPlaylistService(deps.gameProvider);

  return async function playPlaylistHandler(params: PlayPlaylistParams): Promise<PlayPlaylistResult> {
    const command = toPlayPlaylistCommand(parseRequest(playPlaylistRequestSchema, params));
    const { playingSounds } = await service.playPlaylist(command);
    return { playing: true, playlistId: command.playlistId, soundCount: playingSounds };
  };
}

export const playPlaylistHandler = createPlayPlaylistHandler();
