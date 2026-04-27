import { z } from 'zod';
import { Size } from '@/filtering/actors/domain/value-objects';

const VALID_SIZES: ReadonlySet<string> = new Set<string>(Object.values(Size));

export const sizeArraySchema = z
  .array(
    z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .superRefine((val, ctx) => {
        if (!VALID_SIZES.has(val)) {
          ctx.addIssue({
            code: 'custom',
            message: `unknown size: '${val}'`
          });
        }
      })
  )
  .nonempty({ message: 'size array must not be empty' });
