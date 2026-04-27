import { z } from 'zod';
import { CreatureType } from '@/filtering/actors/domain/value-objects';

const VALID_CREATURE_TYPES: ReadonlySet<string> = new Set<string>(Object.values(CreatureType));

export const creatureTypeArraySchema = z
  .array(
    z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .superRefine((val, ctx) => {
        if (!VALID_CREATURE_TYPES.has(val)) {
          ctx.addIssue({
            code: 'custom',
            message: `unknown creatureType: '${val}'`
          });
        }
      })
  )
  .nonempty({ message: 'creatureType array must not be empty' });
