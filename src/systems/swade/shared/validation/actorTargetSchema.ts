import { z } from 'zod';
import type { SwadeActorTarget } from '@/systems/swade/shared/domain';

export const EITHER_ACTOR_OR_TOKEN = 'Either actorId or tokenId is required';

export const swadeActorTargetShape = {
  actorId: z.string().optional(),
  tokenId: z.string().optional(),
  sceneId: z.string().optional()
};

export function hasActorOrToken(request: { actorId?: string | undefined; tokenId?: string | undefined }): boolean {
  return request.actorId !== undefined || request.tokenId !== undefined;
}

export const targetRefinement = { message: EITHER_ACTOR_OR_TOKEN } as const;

export function toActorTarget(request: {
  actorId?: string | undefined;
  tokenId?: string | undefined;
  sceneId?: string | undefined;
}): SwadeActorTarget {
  return { actorId: request.actorId, tokenId: request.tokenId, sceneId: request.sceneId };
}
