import { z } from 'zod';

export const useItemRequestSchema = z.object({
  actorId: z.string(),
  itemId: z.string(),
  activityId: z.string().optional(),
  activityType: z.string().optional(),
  consume: z.boolean().optional(),
  scaling: z.number().optional(),
  showInChat: z.boolean().optional()
});

export type UseItemRequest = z.infer<typeof useItemRequestSchema>;
