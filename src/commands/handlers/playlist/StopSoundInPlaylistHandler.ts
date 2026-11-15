import type { StopSoundInPlaylistParams, StopSoundInPlaylistResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryPlaylistService,
  stopSoundInPlaylistRequestSchema,
  toStopPlaylistSoundCommand
} from '@/core/playlists';
import type { PlaylistHandlerDependencies } from './playlistWireMappers';

export function createStopSoundInPlaylistHandler(
  deps: PlaylistHandlerDependencies = {}
): (params: StopSoundInPlaylistParams) => Promise<StopSoundInPlaylistResult> {
  const service = createFoundryPlaylistService(deps.gameProvider);

  return async function stopSoundInPlaylistHandler(
    params: StopSoundInPlaylistParams
  ): Promise<StopSoundInPlaylistResult> {
    const command = toStopPlaylistSoundCommand(parseRequest(stopSoundInPlaylistRequestSchema, params));
    await service.stopSound(command);
    return { stopped: true, playlistId: command.playlistId, soundId: command.soundId };
  };
}

export const stopSoundInPlaylistHandler = createStopSoundInPlaylistHandler();
