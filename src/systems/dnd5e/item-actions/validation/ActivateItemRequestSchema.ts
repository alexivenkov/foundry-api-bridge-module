import { z } from 'zod';

export const activateItemRequestSchema = z.object({
  actorId: z.string(),
  itemId: z.string(),
  activityId: z.string().optional(),
  activityType: z.string().optional(),
  targetTokenIds: z.array(z.string()).optional(),
  templatePosition: z
    .object({
      x: z.number(),
      y: z.number(),
      direction: z.number().optional()
    })
    .optional(),
  spellLevel: z.number().optional()
});

export type ActivateItemRequest = z.infer<typeof activateItemRequestSchema>;
