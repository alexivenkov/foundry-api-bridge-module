import { z } from 'zod';
import { advantageFlagShape, advantageFlagsRefinement, notBothAdvantageAndDisadvantage } from './advantageFlags';

export const rollPerceptionRequestSchema = z
  .object({
    actorId: z.string(),
    ...advantageFlagShape,
    showInChat: z.boolean().optional()
  })
  .refine(notBothAdvantageAndDisadvantage, advantageFlagsRefinement);

export type RollPerceptionRequest = z.infer<typeof rollPerceptionRequestSchema>;
