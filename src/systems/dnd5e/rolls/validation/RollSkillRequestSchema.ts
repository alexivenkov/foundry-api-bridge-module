import { z } from 'zod';

export const rollSkillRequestSchema = z.object({
  actorId: z.string(),
  skill: z.string(),
  showInChat: z.boolean().optional()
});

export type RollSkillRequest = z.infer<typeof rollSkillRequestSchema>;
