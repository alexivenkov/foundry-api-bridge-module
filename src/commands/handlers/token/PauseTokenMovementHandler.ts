import type { PauseTokenMovementParams, PauseTokenMovementResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenCoreMovementService,
  pauseTokenMovementRequestSchema,
  toPauseTokenMovementCommand
} from '@/core/tokens';
import { toWireMovementSnapshot, type TokenMovementHandlerDependencies } from './tokenMovementWireMappers';

export function createPauseTokenMovementHandler(
  deps: TokenMovementHandlerDependencies = {}
): (params: PauseTokenMovementParams) => Promise<PauseTokenMovementResult> {
  const service = createFoundryTokenCoreMovementService(deps);

  return function pauseTokenMovementHandler(params: PauseTokenMovementParams): Promise<PauseTokenMovementResult> {
    try {
      const command = toPauseTokenMovementCommand(parseRequest(pauseTokenMovementRequestSchema, params));
      const result = service.pause(command);
      return Promise.resolve({ ...toWireMovementSnapshot(result), paused: result.done, key: command.key });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const pauseTokenMovementHandler = createPauseTokenMovementHandler();
