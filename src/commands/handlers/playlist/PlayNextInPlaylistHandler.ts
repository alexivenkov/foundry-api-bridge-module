import type { PlayNextInPlaylistParams, PlayNextInPlaylistResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryPlaylistManagementService,
  playNextInPlaylistRequestSchema,
  toStepPlaylistCommand
} from '@/core/playlists';
import { toWirePlaylistSoundSnapshot, type PlaylistManagementHandlerDependencies } from './playlistWireMappers';

export function createPlayNextInPlaylistHandler(
  deps: PlaylistManagementHandlerDependencies = {}
): (params: PlayNextInPlaylistParams) => Promise<PlayNextInPlaylistResult> {
  const service = createFoundryPlaylistManagementService(deps.gameProvider);

  return async function playNextInPlaylistHandler(params: PlayNextInPlaylistParams): Promise<PlayNextInPlaylistResult> {
    const command = toStepPlaylistCommand(parseRequest(playNextInPlaylistRequestSchema, params));
    const { playlistId, sound } = await service.step(command);
    return { playlistId, sound: sound === null ? null : toWirePlaylistSoundSnapshot(sound) };
  };
}

export const playNextInPlaylistHandler = createPlayNextInPlaylistHandler();
