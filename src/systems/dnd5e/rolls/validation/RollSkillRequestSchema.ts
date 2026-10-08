import { z } from 'zod';
import { advantageFlagShape, advantageFlagsRefinement, notBothAdvantageAndDisadvantage } from './advantageFlags';

export const rollSkillRequestSchema = z
  .object({
    actorId: z.string(),
    skill: z.string(),
    ...advantageFlagShape,
    showInChat: z.boolean().optional()
  })
  .refine(notBothAdvantageAndDisadvantage, advantageFlagsRefinement);

export type RollSkillRequest = z.infer<typeof rollSkillRequestSchema>;
