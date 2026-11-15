import type { RevertTokenMovementParams, RevertTokenMovementResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenCoreMovementService,
  revertTokenMovementRequestSchema,
  toRevertTokenMovementCommand
} from '@/core/tokens';
import { toWireMovementSnapshot, type TokenMovementHandlerDependencies } from './tokenMovementWireMappers';

export function createRevertTokenMovementHandler(
  deps: TokenMovementHandlerDependencies = {}
): (params: RevertTokenMovementParams) => Promise<RevertTokenMovementResult> {
  const service = createFoundryTokenCoreMovementService(deps);

  return async function revertTokenMovementHandler(params: RevertTokenMovementParams): Promise<RevertTokenMovementResult> {
    const result = await service.revert(toRevertTokenMovementCommand(parseRequest(revertTokenMovementRequestSchema, params)));
    return { ...toWireMovementSnapshot(result), reverted: result.done };
  };
}

export const revertTokenMovementHandler = createRevertTokenMovementHandler();
