import { z } from 'zod';
import { advantageFlagShape, advantageFlagsRefinement, notBothAdvantageAndDisadvantage } from './advantageFlags';

export const rollAbilityRequestSchema = z
  .object({
    actorId: z.string(),
    ability: z.string(),
    ...advantageFlagShape,
    showInChat: z.boolean().optional()
  })
  .refine(notBothAdvantageAndDisadvantage, advantageFlagsRefinement);

export type RollAbilityRequest = z.infer<typeof rollAbilityRequestSchema>;
