import { z } from 'zod';

export const rollSaveRequestSchema = z.object({
  actorId: z.string(),
  save: z.string(),
  showInChat: z.boolean().optional()
});

export type RollSaveRequest = z.infer<typeof rollSaveRequestSchema>;
