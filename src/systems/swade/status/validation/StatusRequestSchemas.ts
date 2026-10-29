import { z } from 'zod';
import { swadeActorTargetShape, hasActorOrToken, targetRefinement } from '@/systems/swade/shared/validation';
import { SWADE_STATUS_IDS } from '@/systems/swade/status/domain';

export const setStatusRequestSchema = z
  .object({
    ...swadeActorTargetShape,
    status: z.enum(SWADE_STATUS_IDS),
    active: z.boolean(),
    overlay: z.boolean().optional()
  })
  .refine(hasActorOrToken, targetRefinement);

export type SetStatusRequest = z.infer<typeof setStatusRequestSchema>;
