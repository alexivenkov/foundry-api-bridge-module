import type { SetTargetsParams, SetTargetsResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenCanvasService,
  setTargetsRequestSchema,
  toSetTargetsCommand,
  type TokenCanvasWiring
} from '@/core/tokens';

export function createSetTargetsHandler(deps: TokenCanvasWiring = {}): (params: SetTargetsParams) => Promise<SetTargetsResult> {
  const service = createFoundryTokenCanvasService(deps);

  return function setTargetsHandler(params: SetTargetsParams): Promise<SetTargetsResult> {
    try {
      const result = service.setTargets(toSetTargetsCommand(parseRequest(setTargetsRequestSchema, params)));
      return Promise.resolve({ sceneId: result.sceneId, targets: [...result.tokenIds] });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const setTargetsHandler = createSetTargetsHandler();
