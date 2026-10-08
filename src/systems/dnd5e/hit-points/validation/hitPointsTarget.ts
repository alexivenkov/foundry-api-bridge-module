import { z } from 'zod';

export const EITHER_ACTOR_OR_TOKEN = 'Either actorId or tokenId is required';

export const hitPointsTargetShape = {
  actorId: z.string().optional(),
  tokenId: z.string().optional(),
  sceneId: z.string().optional()
};

export function hasActorOrToken(request: { actorId?: string | undefined; tokenId?: string | undefined }): boolean {
  return request.actorId !== undefined || request.tokenId !== undefined;
}

export const targetRefinement = { message: EITHER_ACTOR_OR_TOKEN } as const;
