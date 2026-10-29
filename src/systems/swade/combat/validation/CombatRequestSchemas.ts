import { z } from 'zod';

export const getActionCardsRequestSchema = z.object({
  combatId: z.string().optional()
});

export type GetActionCardsRequest = z.infer<typeof getActionCardsRequestSchema>;
