import type { GetTokensInRangeParams, GetTokensInRangeResult } from '@/commands/types';
import { asError, withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenService,
  getTokensInRangeRequestSchema,
  toTokensInRangeQuery
} from '@/core/tokens';
import { toWireTokenInRange, type TokenHandlerDependencies } from './tokenWireMappers';

export function createGetTokensInRangeHandler(
  deps: TokenHandlerDependencies = {}
): (params: GetTokensInRangeParams) => Promise<GetTokensInRangeResult> {
  const service = createFoundryTokenService(deps.gameProvider);

  return function getTokensInRangeHandler(params: GetTokensInRangeParams): Promise<GetTokensInRangeResult> {
    try {
      const query = toTokensInRangeQuery(parseRequest(getTokensInRangeRequestSchema, params));
      const result = service.tokensInRange(query);
      return Promise.resolve({
        sceneId: result.sceneId,
        origin: { x: query.originX, y: query.originY },
        range: query.range,
        units: result.units,
        tokens: result.tokens.map(toWireTokenInRange)
      });
    } catch (error) {
      return Promise.reject(asError(withShortNoActiveScene(error)));
    }
  };
}

export const getTokensInRangeHandler = createGetTokensInRangeHandler();
