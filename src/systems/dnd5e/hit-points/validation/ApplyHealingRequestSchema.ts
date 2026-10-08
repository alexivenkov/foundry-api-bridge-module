import { z } from 'zod';
import { hitPointsTargetShape, hasActorOrToken, targetRefinement } from './hitPointsTarget';

export const applyHealingRequestSchema = z
  .object({
    ...hitPointsTargetShape,
    amount: z.number().nonnegative()
  })
  .refine(hasActorOrToken, targetRefinement);

export type ApplyHealingRequest = z.infer<typeof applyHealingRequestSchema>;
