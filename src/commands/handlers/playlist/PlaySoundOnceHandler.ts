import type { PlaySoundOnceParams, PlaySoundOnceResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySoundPlaybackService,
  playSoundOnceRequestSchema,
  toPlaySoundOnceCommand,
  type AudioGlobalsProvider
} from '@/core/playlists';

export interface PlaySoundOnceHandlerDependencies {
  globals?: AudioGlobalsProvider;
}

export function createPlaySoundOnceHandler(
  deps: PlaySoundOnceHandlerDependencies = {}
): (params: PlaySoundOnceParams) => Promise<PlaySoundOnceResult> {
  const service = createFoundrySoundPlaybackService(deps.globals);

  return async function playSoundOnceHandler(params: PlaySoundOnceParams): Promise<PlaySoundOnceResult> {
    const command = toPlaySoundOnceCommand(parseRequest(playSoundOnceRequestSchema, params));
    await service.playOnce(command);
    return { playing: true, src: command.sound.src, broadcast: command.broadcast };
  };
}

export const playSoundOnceHandler = createPlaySoundOnceHandler();
