import { z } from 'zod';

export const setConditionRequestSchema = z.object({
  actorId: z.string(),
  slug: z.string(),
  value: z.number().int().positive().optional()
});

export const conditionSlugRequestSchema = z.object({
  actorId: z.string(),
  slug: z.string()
});

export const getConditionsRequestSchema = z.object({
  actorId: z.string()
});

export type SetConditionRequest = z.infer<typeof setConditionRequestSchema>;
export type ConditionSlugRequest = z.infer<typeof conditionSlugRequestSchema>;
export type GetConditionsRequest = z.infer<typeof getConditionsRequestSchema>;
