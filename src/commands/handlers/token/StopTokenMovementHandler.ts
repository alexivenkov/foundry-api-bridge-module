import type { StopTokenMovementResult, TokenMovementParams } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryTokenCoreMovementService, toTokenMovementQuery, tokenMovementRequestSchema } from '@/core/tokens';
import { toWireMovementSnapshot, type TokenMovementHandlerDependencies } from './tokenMovementWireMappers';

export function createStopTokenMovementHandler(
  deps: TokenMovementHandlerDependencies = {}
): (params: TokenMovementParams) => Promise<StopTokenMovementResult> {
  const service = createFoundryTokenCoreMovementService(deps);

  return function stopTokenMovementHandler(params: TokenMovementParams): Promise<StopTokenMovementResult> {
    try {
      const result = service.stop(toTokenMovementQuery(parseRequest(tokenMovementRequestSchema, params)));
      return Promise.resolve({ ...toWireMovementSnapshot(result), stopped: result.done });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const stopTokenMovementHandler = createStopTokenMovementHandler();
