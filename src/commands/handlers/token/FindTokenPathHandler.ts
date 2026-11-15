import type { FindTokenPathParams, FindTokenPathResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryTokenCoreMovementService, findTokenPathRequestSchema, toFindTokenPathQuery } from '@/core/tokens';
import type { TokenMovementHandlerDependencies } from './tokenMovementWireMappers';

export function createFindTokenPathHandler(
  deps: TokenMovementHandlerDependencies = {}
): (params: FindTokenPathParams) => Promise<FindTokenPathResult> {
  const service = createFoundryTokenCoreMovementService(deps);

  return async function findTokenPathHandler(params: FindTokenPathParams): Promise<FindTokenPathResult> {
    const result = await service.findPath(toFindTokenPathQuery(parseRequest(findTokenPathRequestSchema, params)));
    return {
      sceneId: result.sceneId,
      tokenId: result.tokenId,
      waypoints: result.waypoints.map((waypoint) => ({ ...waypoint })),
      complete: result.complete
    };
  };
}

export const findTokenPathHandler = createFindTokenPathHandler();
