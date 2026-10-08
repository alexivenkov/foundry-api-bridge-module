import { z } from 'zod';
import { advantageFlagShape, advantageFlagsRefinement, notBothAdvantageAndDisadvantage } from './advantageFlags';

export const rollSaveRequestSchema = z
  .object({
    actorId: z.string(),
    ability: z.string(),
    ...advantageFlagShape,
    showInChat: z.boolean().optional()
  })
  .refine(notBothAdvantageAndDisadvantage, advantageFlagsRefinement);

export type RollSaveRequest = z.infer<typeof rollSaveRequestSchema>;
