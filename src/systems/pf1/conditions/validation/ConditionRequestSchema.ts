import { z } from 'zod';
import { hasActorOrToken, pf1ActorTargetShape, targetRefinement } from '@/systems/pf1/shared/validation';

/** `condition` is checked against `pf1.registry.conditions` at run time: modules may register more. */
export const setConditionRequestSchema = z
  .object({
    ...pf1ActorTargetShape,
    condition: z.string().min(1),
    active: z.boolean()
  })
  .refine(hasActorOrToken, targetRefinement);

export type SetConditionRequest = z.infer<typeof setConditionRequestSchema>;
