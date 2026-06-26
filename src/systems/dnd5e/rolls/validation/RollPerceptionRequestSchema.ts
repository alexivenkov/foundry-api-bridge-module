import { z } from 'zod';

export const rollPerceptionRequestSchema = z.object({
  actorId: z.string(),
  showInChat: z.boolean().optional()
});

export type RollPerceptionRequest = z.infer<typeof rollPerceptionRequestSchema>;
