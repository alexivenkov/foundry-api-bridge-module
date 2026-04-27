import { z } from 'zod';
import { makeRangeSchema } from '@/filtering/shared/validation';

const abilityRangeSchema = makeRangeSchema({ integerOnly: true, minBound: 0 });

export const abilityScoresSchema = z
  .object({
    str: abilityRangeSchema.optional(),
    dex: abilityRangeSchema.optional(),
    con: abilityRangeSchema.optional(),
    int: abilityRangeSchema.optional(),
    wis: abilityRangeSchema.optional(),
    cha: abilityRangeSchema.optional()
  })
  .refine(
    (obj) => Object.values(obj).some((v) => v !== undefined),
    { message: 'abilities must specify at least one ability range' }
  );
