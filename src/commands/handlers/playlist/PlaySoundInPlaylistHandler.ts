import type { PlaySoundInPlaylistParams, PlaySoundInPlaylistResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryPlaylistService,
  playSoundInPlaylistRequestSchema,
  toPlayPlaylistSoundCommand
} from '@/core/playlists';
import type { PlaylistHandlerDependencies } from './playlistWireMappers';

export function createPlaySoundInPlaylistHandler(
  deps: PlaylistHandlerDependencies = {}
): (params: PlaySoundInPlaylistParams) => Promise<PlaySoundInPlaylistResult> {
  const service = createFoundryPlaylistService(deps.gameProvider);

  return async function playSoundInPlaylistHandler(
    params: PlaySoundInPlaylistParams
  ): Promise<PlaySoundInPlaylistResult> {
    const command = toPlayPlaylistSoundCommand(parseRequest(playSoundInPlaylistRequestSchema, params));
    const sound = await service.playSound(command);
    return {
      playing: true,
      playlistId: command.playlistId,
      soundId: command.soundId,
      soundName: sound.name
    };
  };
}

export const playSoundInPlaylistHandler = createPlaySoundInPlaylistHandler();
