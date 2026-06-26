import { z } from 'zod';

export const listStrikesRequestSchema = z.object({
  actorId: z.string()
});

export const rollStrikeRequestSchema = z.object({
  actorId: z.string(),
  slug: z.string(),
  mapIncrease: z.number().int().min(0).max(2).optional(),
  showInChat: z.boolean().optional()
});

export const rollStrikeDamageRequestSchema = z.object({
  actorId: z.string(),
  slug: z.string(),
  critical: z.boolean().optional(),
  showInChat: z.boolean().optional()
});

export type ListStrikesRequest = z.infer<typeof listStrikesRequestSchema>;
export type RollStrikeRequest = z.infer<typeof rollStrikeRequestSchema>;
export type RollStrikeDamageRequest = z.infer<typeof rollStrikeDamageRequestSchema>;
