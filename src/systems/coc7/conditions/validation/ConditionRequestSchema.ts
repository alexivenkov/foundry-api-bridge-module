import { z } from 'zod';
import { COC7_CONDITION_IDS } from '@/systems/coc7/shared/domain';
import { coc7ActorTargetShape, hasActorOrToken, targetRefinement } from '@/systems/coc7/shared/validation';

export const setConditionRequestSchema = z
  .object({
    ...coc7ActorTargetShape,
    condition: z.enum(COC7_CONDITION_IDS),
    active: z.boolean(),
    realTime: z.boolean().optional(),
    duration: z.number().int().min(0).optional()
  })
  .refine(hasActorOrToken, targetRefinement);

export type SetConditionRequest = z.infer<typeof setConditionRequestSchema>;
