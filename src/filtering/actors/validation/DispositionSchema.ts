import { z } from 'zod';
import { Disposition } from '@/filtering/actors/domain/value-objects';

const VALID_DISPOSITIONS: ReadonlySet<string> = new Set<string>(Object.values(Disposition));

export const dispositionArraySchema = z
  .array(
    z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .superRefine((val, ctx) => {
        if (!VALID_DISPOSITIONS.has(val)) {
          ctx.addIssue({
            code: 'custom',
            message: `unknown disposition: '${val}'`
          });
        }
      })
  )
  .nonempty({ message: 'disposition array must not be empty' });
