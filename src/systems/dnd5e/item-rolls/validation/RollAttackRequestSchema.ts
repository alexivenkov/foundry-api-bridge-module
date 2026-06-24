import { z } from 'zod';

export const rollAttackRequestSchema = z.object({
  actorId: z.string(),
  itemId: z.string(),
  advantage: z.boolean().optional(),
  disadvantage: z.boolean().optional(),
  showInChat: z.boolean().optional()
});

export type RollAttackRequest = z.infer<typeof rollAttackRequestSchema>;
