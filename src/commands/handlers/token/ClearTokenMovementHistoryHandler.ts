import type { ClearTokenMovementHistoryParams, ClearTokenMovementHistoryResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  clearTokenMovementHistoryRequestSchema,
  createFoundryTokenCoreMovementService,
  toClearMovementHistoryCommand
} from '@/core/tokens';
import type { TokenMovementHandlerDependencies } from './tokenMovementWireMappers';

export function createClearTokenMovementHistoryHandler(
  deps: TokenMovementHandlerDependencies = {}
): (params: ClearTokenMovementHistoryParams) => Promise<ClearTokenMovementHistoryResult> {
  const service = createFoundryTokenCoreMovementService(deps);

  return async function clearTokenMovementHistoryHandler(
    params: ClearTokenMovementHistoryParams
  ): Promise<ClearTokenMovementHistoryResult> {
    const result = await service.clearHistory(
      toClearMovementHistoryCommand(parseRequest(clearTokenMovementHistoryRequestSchema, params))
    );
    return { scope: result.scope, sceneId: result.sceneId, combatId: result.combatId, tokenIds: [...result.tokenIds] };
  };
}

export const clearTokenMovementHistoryHandler = createClearTokenMovementHistoryHandler();
