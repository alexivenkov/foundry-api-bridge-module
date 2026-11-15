import type { GetSceneTokensParams, SceneTokensResult } from '@/commands/types';
import { asError, withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryTokenService, getSceneTokensRequestSchema, toListTokensQuery } from '@/core/tokens';
import { toWireTokenResult, type TokenHandlerDependencies } from './tokenWireMappers';

export function createGetSceneTokensHandler(
  deps: TokenHandlerDependencies = {}
): (params: GetSceneTokensParams) => Promise<SceneTokensResult> {
  const service = createFoundryTokenService(deps.gameProvider);

  return function getSceneTokensHandler(params: GetSceneTokensParams): Promise<SceneTokensResult> {
    try {
      const { scene, tokens } = service.listTokens(
        toListTokensQuery(parseRequest(getSceneTokensRequestSchema, params))
      );
      return Promise.resolve({
        sceneId: scene.id,
        sceneName: scene.name,
        tokens: tokens.map(toWireTokenResult)
      });
    } catch (error) {
      return Promise.reject(asError(withShortNoActiveScene(error)));
    }
  };
}

export const getSceneTokensHandler = createGetSceneTokensHandler();
