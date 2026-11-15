import type { z } from 'zod';
import { ValidationError, formatZodError } from '@/kernel';

export function parseRequest<TRequest>(schema: z.ZodType<TRequest>, params: unknown): TRequest {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw new ValidationError(formatZodError(parsed.error));
  }
  return parsed.data;
}
