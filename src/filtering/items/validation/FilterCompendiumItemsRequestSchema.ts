import { z } from 'zod';
import { itemTypeArraySchema } from './ItemTypeSchema';
import { itemRarityArraySchema } from './ItemRaritySchema';
import { spellSchoolArraySchema } from './SpellSchoolSchema';
import { weightRangeSchema } from './WeightRangeSchema';
import { priceRangeSchema } from './PriceRangeSchema';
import { spellLevelRangeSchema } from './SpellLevelRangeSchema';

export const filterCompendiumItemsRequestSchema = z.object({
  packIds: z.array(z.string()).optional(),
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'name must be non-empty after trim'))
    .optional(),
  type: itemTypeArraySchema.optional(),
  rarity: itemRarityArraySchema.optional(),
  spellSchool: spellSchoolArraySchema.optional(),
  requiresAttunement: z.boolean().optional(),
  identified: z.boolean().optional(),
  hasActivities: z.boolean().optional(),
  isContainer: z.boolean().optional(),
  weight: weightRangeSchema.optional(),
  price: priceRangeSchema.optional(),
  spellLevel: spellLevelRangeSchema.optional(),
  limit: z.number().int().min(1).max(200).optional(),
  offset: z.number().int().min(0).optional()
});

export type FilterCompendiumItemsRequest = z.infer<
  typeof filterCompendiumItemsRequestSchema
>;
