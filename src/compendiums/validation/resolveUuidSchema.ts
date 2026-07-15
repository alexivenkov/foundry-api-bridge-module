import { z } from 'zod';

export const resolveUuidRequestSchema = z.object({
  uuid: z.string()
});

export type ResolveUuidRequest = z.infer<typeof resolveUuidRequestSchema>;
