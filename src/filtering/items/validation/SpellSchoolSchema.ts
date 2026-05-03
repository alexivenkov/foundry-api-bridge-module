import { z } from 'zod';
import { SpellSchool } from '@/filtering/items/domain/value-objects';

const VALID_SCHOOLS: ReadonlySet<string> = new Set<string>(Object.values(SpellSchool));

export const spellSchoolArraySchema = z
  .array(
    z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .superRefine((val, ctx) => {
        if (!VALID_SCHOOLS.has(val)) {
          ctx.addIssue({
            code: 'custom',
            message: `unknown spellSchool: '${val}'`
          });
        }
      })
  )
  .nonempty({ message: 'spellSchool array must not be empty' });
