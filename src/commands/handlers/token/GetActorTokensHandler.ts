import type { GetActorTokensParams, GetActorTokensResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryTokenAppearanceService, getPrototypeTokenRequestSchema, toPrototypeTokenQuery } from '@/core/tokens';
import type { TokenAppearanceHandlerDependencies } from './tokenWireMappers';

export function createGetActorTokensHandler(
  deps: TokenAppearanceHandlerDependencies = {}
): (params: GetActorTokensParams) => Promise<GetActorTokensResult> {
  const service = createFoundryTokenAppearanceService(deps);

  return function getActorTokensHandler(params: GetActorTokensParams): Promise<GetActorTokensResult> {
    try {
      const result = service.listActorTokens(toPrototypeTokenQuery(parseRequest(getPrototypeTokenRequestSchema, params)));
      return Promise.resolve({ actorId: result.actorId, tokens: result.tokens.map((token) => ({ ...token })) });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getActorTokensHandler = createGetActorTokensHandler();
