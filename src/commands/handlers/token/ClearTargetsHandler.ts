import type { ClearTargetsParams, ClearTargetsResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryTokenTargetingService } from '@/core/tokens';
import type { TokenTargetingHandlerDependencies } from './SetTokenTargetHandler';

export function createClearTargetsHandler(
  deps: TokenTargetingHandlerDependencies = {}
): (params: ClearTargetsParams) => Promise<ClearTargetsResult> {
  const service = createFoundryTokenTargetingService(deps.globals);

  // The command takes no parameters, so there is nothing to validate.
  return function clearTargetsHandler(_params: ClearTargetsParams): Promise<ClearTargetsResult> {
    try {
      return Promise.resolve({ cleared: true, count: service.clearTargets() });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const clearTargetsHandler = createClearTargetsHandler();
