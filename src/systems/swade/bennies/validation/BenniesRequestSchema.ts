import { z } from 'zod';
import { swadeActorTargetShape, hasActorOrToken } from '@/systems/swade/shared/validation';
import { SWADE_BENNY_ACTIONS } from '@/systems/swade/bennies/domain';

export const EXACTLY_ONE_OWNER = 'Either actorId, tokenId or gm: true is required';
export const GM_IS_EXCLUSIVE = 'gm cannot be combined with actorId or tokenId';

export const benniesRequestSchema = z
  .object({
    ...swadeActorTargetShape,
    gm: z.literal(true).optional(),
    action: z.enum(SWADE_BENNY_ACTIONS)
  })
  .refine((request) => request.gm === true || hasActorOrToken(request), { message: EXACTLY_ONE_OWNER })
  .refine((request) => request.gm !== true || !hasActorOrToken(request), { message: GM_IS_EXCLUSIVE });

export type BenniesRequest = z.infer<typeof benniesRequestSchema>;
