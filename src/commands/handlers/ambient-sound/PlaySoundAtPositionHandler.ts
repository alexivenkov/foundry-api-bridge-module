import type { PlaySoundAtPositionParams, PlaySoundAtPositionResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySoundBroadcastService,
  playSoundAtPositionRequestSchema,
  toPlaySoundAtPositionCommand
} from '@/core/ambient-sounds';
import type { AmbientSoundHandlerDependencies } from './GetAmbientSoundsHandler';
import { toWirePositionalSoundResult } from './ambientSoundWireMappers';

export function createPlaySoundAtPositionHandler(
  deps: AmbientSoundHandlerDependencies = {}
): (params: PlaySoundAtPositionParams) => Promise<PlaySoundAtPositionResult> {
  const service = createFoundrySoundBroadcastService(deps);

  return async function playSoundAtPositionHandler(
    params: PlaySoundAtPositionParams
  ): Promise<PlaySoundAtPositionResult> {
    const command = toPlaySoundAtPositionCommand(parseRequest(playSoundAtPositionRequestSchema, params));
    return toWirePositionalSoundResult(await service.playAtPosition(command));
  };
}

export const playSoundAtPositionHandler = createPlaySoundAtPositionHandler();
