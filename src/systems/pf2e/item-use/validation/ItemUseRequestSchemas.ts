import { z } from 'zod';

export const useConsumableRequestSchema = z.object({
  actorId: z.string(),
  itemId: z.string(),
  quantity: z.number().int().positive().optional()
});

export const castSpellRequestSchema = z.object({
  actorId: z.string(),
  spellId: z.string(),
  rank: z.number().int().min(1).max(10).optional(),
  showInChat: z.boolean().optional()
});

export const postItemRequestSchema = z.object({
  actorId: z.string(),
  itemId: z.string(),
  showInChat: z.boolean().optional()
});

export type UseConsumableRequest = z.infer<typeof useConsumableRequestSchema>;
export type CastSpellRequest = z.infer<typeof castSpellRequestSchema>;
export type PostItemRequest = z.infer<typeof postItemRequestSchema>;
