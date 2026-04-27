import { z } from 'zod';

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(200).optional(),
  offset: z.number().int().min(0).optional()
});

export type PaginationInput = z.infer<typeof paginationSchema>;
