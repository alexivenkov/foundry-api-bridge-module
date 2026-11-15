import type { GetTokenMovementHistoryResult, TokenMovementParams } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryTokenCoreMovementService, toTokenMovementQuery, tokenMovementRequestSchema } from '@/core/tokens';
import { toWireHistoryEntry, type TokenMovementHandlerDependencies } from './tokenMovementWireMappers';

export function createGetTokenMovementHistoryHandler(
  deps: TokenMovementHandlerDependencies = {}
): (params: TokenMovementParams) => Promise<GetTokenMovementHistoryResult> {
  const service = createFoundryTokenCoreMovementService(deps);

  return function getTokenMovementHistoryHandler(params: TokenMovementParams): Promise<GetTokenMovementHistoryResult> {
    try {
      const result = service.getHistory(toTokenMovementQuery(parseRequest(tokenMovementRequestSchema, params)));
      return Promise.resolve({
        sceneId: result.sceneId,
        tokenId: result.tokenId,
        waypoints: result.entries.map(toWireHistoryEntry),
        cost: result.cost,
        movementIds: [...result.movementIds]
      });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getTokenMovementHistoryHandler = createGetTokenMovementHistoryHandler();
