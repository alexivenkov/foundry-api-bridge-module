import { z } from 'zod';
import type { Coc7ActorTarget } from '@/systems/coc7/shared/domain';

export const EITHER_ACTOR_OR_TOKEN = 'Either actorId or tokenId is required';

export const coc7ActorTargetShape = {
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
}): Coc7ActorTarget {
  return { actorId: request.actorId, tokenId: request.tokenId, sceneId: request.sceneId };
}
