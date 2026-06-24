import { z } from 'zod';

export const rollAbilityRequestSchema = z.object({
  actorId: z.string(),
  ability: z.string(),
  showInChat: z.boolean().optional()
});

export type RollAbilityRequest = z.infer<typeof rollAbilityRequestSchema>;
