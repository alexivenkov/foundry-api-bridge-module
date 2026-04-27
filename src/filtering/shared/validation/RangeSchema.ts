import { z } from 'zod';

export interface MakeRangeSchemaOptions {
  allowedValues?: readonly number[];
  integerOnly?: boolean;
  minBound?: number;
}

export type RangeSchemaOutput = { min?: number; max?: number };

export function makeRangeSchema(
  opts: MakeRangeSchemaOptions = {}
): z.ZodType<RangeSchemaOutput> {
  const { allowedValues, integerOnly, minBound } = opts;

  const baseField = (): z.ZodType<number> => {
    let s: z.ZodType<number> = integerOnly ? z.number().int() : z.number();
    if (minBound !== undefined) {
      s = (s as z.ZodNumber).gte(minBound);
    }
    return s;
  };

  const buildField = (): z.ZodType<number | undefined> => {
    let optional: z.ZodType<number | undefined> = baseField().optional();
    if (allowedValues !== undefined) {
      const allowed = allowedValues;
      const message = `must be one of allowed values: ${allowed.join(', ')}`;
      optional = optional.refine(
        (v) => v === undefined || allowed.includes(v),
        { message }
      );
    }
    return optional;
  };

  const objectSchema = z.object({
    min: buildField(),
    max: buildField()
  });

  return objectSchema
    .refine(
      (v) => v.min !== undefined || v.max !== undefined,
      { message: 'range must specify at least min or max' }
    )
    .superRefine((v, ctx) => {
      if (v.min !== undefined && v.max !== undefined && v.min > v.max) {
        ctx.addIssue({
          code: 'custom',
          message: `min (${String(v.min)}) must be <= max (${String(v.max)})`,
          path: []
        });
      }
    }) as z.ZodType<RangeSchemaOutput>;
}
