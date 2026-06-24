import { z } from 'zod';

export const rollDamageRequestSchema = z.object({
  actorId: z.string(),
  itemId: z.string(),
  critical: z.boolean().optional(),
  showInChat: z.boolean().optional()
});

export type RollDamageRequest = z.infer<typeof rollDamageRequestSchema>;
