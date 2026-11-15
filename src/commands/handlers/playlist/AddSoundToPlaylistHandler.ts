import type { AddSoundToPlaylistParams, AddSoundToPlaylistResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  addSoundToPlaylistRequestSchema,
  createFoundryPlaylistService,
  toAddPlaylistSoundCommand
} from '@/core/playlists';
import { toWirePlaylistSound, type PlaylistHandlerDependencies } from './playlistWireMappers';

export function createAddSoundToPlaylistHandler(
  deps: PlaylistHandlerDependencies = {}
): (params: AddSoundToPlaylistParams) => Promise<AddSoundToPlaylistResult> {
  const service = createFoundryPlaylistService(deps.gameProvider);

  return async function addSoundToPlaylistHandler(
    params: AddSoundToPlaylistParams
  ): Promise<AddSoundToPlaylistResult> {
    const command = toAddPlaylistSoundCommand(parseRequest(addSoundToPlaylistRequestSchema, params));
    return toWirePlaylistSound(await service.addSound(command));
  };
}

export const addSoundToPlaylistHandler = createAddSoundToPlaylistHandler();
