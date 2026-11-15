import type { GetTokenByActorParams, GetTokenByActorResult } from '@/commands/types';
import { asError, withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenAppearanceService,
  createFoundryTokenService,
  getTokenByActorRequestSchema,
  toGetTokenByActorQuery
} from '@/core/tokens';
import { toWireTokenDetail, withWireAppearance, type TokenAppearanceHandlerDependencies } from './tokenWireMappers';

export function createGetTokenByActorHandler(
  deps: TokenAppearanceHandlerDependencies = {}
): (params: GetTokenByActorParams) => Promise<GetTokenByActorResult> {
  const service = createFoundryTokenService(deps.gameProvider);
  const appearance = createFoundryTokenAppearanceService(deps);

  return function getTokenByActorHandler(params: GetTokenByActorParams): Promise<GetTokenByActorResult> {
    try {
      const request = parseRequest(getTokenByActorRequestSchema, params);
      const { token, sceneId } = service.getTokenByActor(toGetTokenByActorQuery(request));
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

export const getTokenByActorHandler = createGetTokenByActorHandler();
