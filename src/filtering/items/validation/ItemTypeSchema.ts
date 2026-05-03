import { z } from 'zod';
import { ItemType } from '@/filtering/items/domain/value-objects';

const VALID_ITEM_TYPES: ReadonlySet<string> = new Set<string>(Object.values(ItemType));

export const itemTypeArraySchema = z
  .array(
    z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .superRefine((val, ctx) => {
        if (!VALID_ITEM_TYPES.has(val)) {
          ctx.addIssue({
            code: 'custom',
            message: `unknown itemType: '${val}'`
          });
        }
      })
  )
  .nonempty({ message: 'type array must not be empty' });
