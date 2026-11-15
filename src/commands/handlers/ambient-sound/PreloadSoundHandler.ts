import type { PreloadSoundParams, PreloadSoundResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySoundBroadcastService,
  preloadSoundRequestSchema,
  toPreloadSoundCommand
} from '@/core/ambient-sounds';
import type { AmbientSoundHandlerDependencies } from './GetAmbientSoundsHandler';
import { toWirePreloadResult } from './ambientSoundWireMappers';

export function createPreloadSoundHandler(
  deps: AmbientSoundHandlerDependencies = {}
): (params: PreloadSoundParams) => Promise<PreloadSoundResult> {
  const service = createFoundrySoundBroadcastService(deps);

  return async function preloadSoundHandler(params: PreloadSoundParams): Promise<PreloadSoundResult> {
    const command = toPreloadSoundCommand(parseRequest(preloadSoundRequestSchema, params));
    return toWirePreloadResult(await service.preload(command));
  };
}

export const preloadSoundHandler = createPreloadSoundHandler();
