import type { MoveTokenPathParams, MoveTokenPathResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryTokenCoreMovementService, moveTokenPathRequestSchema, toMoveTokenPathCommand } from '@/core/tokens';
import { toWireMovementSnapshot, type TokenMovementHandlerDependencies } from './tokenMovementWireMappers';

export function createMoveTokenPathHandler(
  deps: TokenMovementHandlerDependencies = {}
): (params: MoveTokenPathParams) => Promise<MoveTokenPathResult> {
  const service = createFoundryTokenCoreMovementService(deps);

  return async function moveTokenPathHandler(params: MoveTokenPathParams): Promise<MoveTokenPathResult> {
    const result = await service.moveAlongPath(toMoveTokenPathCommand(parseRequest(moveTokenPathRequestSchema, params)));
    return { ...toWireMovementSnapshot(result), moved: result.moved, arrived: result.arrived };
  };
}

export const moveTokenPathHandler = createMoveTokenPathHandler();
