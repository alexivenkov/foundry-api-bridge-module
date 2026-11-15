import type { GetSelectedTokensParams, GetSelectedTokensResult } from '@/commands/types';
import { createFoundryTokenCanvasService, type TokenCanvasWiring } from '@/core/tokens';

export function createGetSelectedTokensHandler(
  deps: TokenCanvasWiring = {}
): (params: GetSelectedTokensParams) => Promise<GetSelectedTokensResult> {
  const service = createFoundryTokenCanvasService(deps);

  // The command takes no parameters, so there is nothing to validate.
  return function getSelectedTokensHandler(_params: GetSelectedTokensParams): Promise<GetSelectedTokensResult> {
    const result = service.getSelection();
    return Promise.resolve({ sceneId: result.sceneId, tokens: result.tokens.map((token) => ({ ...token })) });
  };
}

export const getSelectedTokensHandler = createGetSelectedTokensHandler();
