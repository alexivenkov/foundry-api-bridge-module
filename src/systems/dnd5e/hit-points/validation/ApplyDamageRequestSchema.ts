import { z } from 'zod';
import { hitPointsTargetShape, hasActorOrToken, targetRefinement } from './hitPointsTarget';

export const applyDamageRequestSchema = z
  .object({
    ...hitPointsTargetShape,
    amount: z.number().nonnegative(),
    type: z.string().optional()
  })
  .refine(hasActorOrToken, targetRefinement);

export type ApplyDamageRequest = z.infer<typeof applyDamageRequestSchema>;
