import type { SelectTokensParams, SelectTokensResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenCanvasService,
  selectTokensRequestSchema,
  toSelectTokensCommand,
  type TokenCanvasWiring
} from '@/core/tokens';

export function createSelectTokensHandler(
  deps: TokenCanvasWiring = {}
): (params: SelectTokensParams) => Promise<SelectTokensResult> {
  const service = createFoundryTokenCanvasService(deps);

  return function selectTokensHandler(params: SelectTokensParams): Promise<SelectTokensResult> {
    try {
      const result = service.selectTokens(toSelectTokensCommand(parseRequest(selectTokensRequestSchema, params)));
      return Promise.resolve({ sceneId: result.sceneId, selected: [...result.tokenIds] });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const selectTokensHandler = createSelectTokensHandler();
