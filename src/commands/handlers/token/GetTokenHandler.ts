import type { GetTokenParams, GetTokenResult } from '@/commands/types';
import { asError, withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenAppearanceService,
  createFoundryTokenService,
  getTokenRequestSchema,
  toGetTokenQuery
} from '@/core/tokens';
import { toWireTokenDetail, withWireAppearance, type TokenAppearanceHandlerDependencies } from './tokenWireMappers';

export function createGetTokenHandler(
  deps: TokenAppearanceHandlerDependencies = {}
): (params: GetTokenParams) => Promise<GetTokenResult> {
  const service = createFoundryTokenService(deps.gameProvider);
  const appearance = createFoundryTokenAppearanceService(deps);

  return function getTokenHandler(params: GetTokenParams): Promise<GetTokenResult> {
    try {
      const request = parseRequest(getTokenRequestSchema, params);
      const { token, sceneId } = service.getToken(toGetTokenQuery(request));
      const detail = toWireTokenDetail(token, sceneId);
      return Promise.resolve(
        request.includeAppearance === true
          ? withWireAppearance(detail, appearance.getAppearance({ sceneId, tokenId: token.id }))
          : detail
      );
    } catch (error) {
      return Promise.reject(asError(withShortNoActiveScene(error)));
    }
  };
}

export const getTokenHandler = createGetTokenHandler();
