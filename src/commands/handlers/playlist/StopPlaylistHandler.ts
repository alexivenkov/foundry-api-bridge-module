import type { StopPlaylistParams, StopPlaylistResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryPlaylistService, stopPlaylistRequestSchema, toStopPlaylistCommand } from '@/core/playlists';
import type { PlaylistHandlerDependencies } from './playlistWireMappers';

export function createStopPlaylistHandler(
  deps: PlaylistHandlerDependencies = {}
): (params: StopPlaylistParams) => Promise<StopPlaylistResult> {
  const service = createFoundryPlaylistService(deps.gameProvider);

  return async function stopPlaylistHandler(params: StopPlaylistParams): Promise<StopPlaylistResult> {
    const command = toStopPlaylistCommand(parseRequest(stopPlaylistRequestSchema, params));
    await service.stopPlaylist(command);
    return { stopped: true, playlistId: command.playlistId };
  };
}

export const stopPlaylistHandler = createStopPlaylistHandler();
