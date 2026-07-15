import { z } from 'zod';
import { makeRangeSchema } from '@/kernel';

export const PF2E_ACTOR_TYPES = [
  'army',
  'character',
  'familiar',
  'hazard',
  'loot',
  'npc',
  'party',
  'vehicle'
] as const;

export const PF2E_ITEM_TYPES = [
  'action',
  'affliction',
  'ammo',
  'ancestry',
  'armor',
  'background',
  'backpack',
  'book',
  'campaignFeature',
  'class',
  'condition',
  'consumable',
  'deity',
  'effect',
  'equipment',
  'feat',
  'heritage',
  'kit',
  'lore',
  'melee',
  'shield',
  'spell',
  'spellcastingEntry',
  'treasure',
  'weapon'
] as const;

export const PF2E_RARITIES = ['common', 'uncommon', 'rare', 'unique'] as const;

export const PF2E_SIZES = ['tiny', 'sm', 'med', 'lg', 'huge', 'grg'] as const;

// Creature levels go below zero (-1 kobolds), so the level range is a plain
// integer range without a lower bound.
const levelRange = makeRangeSchema({ integerOnly: true });
const nonNegativeIntRange = makeRangeSchema({ integerOnly: true, minBound: 0 });
const priceRange = makeRangeSchema({ minBound: 0 });

const nameField = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, 'name must be non-empty after trim'));

const stringListField = (message: string): z.ZodType<string[]> =>
  z.array(z.string().min(1)).nonempty({ message }) as unknown as z.ZodType<string[]>;

const paginationFields = {
  limit: z.number().int().min(1).max(200).optional(),
  offset: z.number().int().min(0).optional()
};

export const pf2eFilterCompendiumActorsRequestSchema = z.object({
  packIds: z.array(z.string()).optional(),
  name: nameField.optional(),
  type: z.array(z.enum(PF2E_ACTOR_TYPES)).nonempty({ message: 'type array must not be empty' }).optional(),
  level: levelRange.optional(),
  traits: stringListField('traits array must not be empty').optional(),
  rarity: z.array(z.enum(PF2E_RARITIES)).nonempty({ message: 'rarity array must not be empty' }).optional(),
  size: z.array(z.enum(PF2E_SIZES)).nonempty({ message: 'size array must not be empty' }).optional(),
  maxHp: nonNegativeIntRange.optional(),
  ac: nonNegativeIntRange.optional(),
  ...paginationFields
});

export type Pf2eFilterCompendiumActorsRequest = z.infer<
  typeof pf2eFilterCompendiumActorsRequestSchema
>;

export const pf2eFilterCompendiumItemsRequestSchema = z.object({
  packIds: z.array(z.string()).optional(),
  name: nameField.optional(),
  type: z.array(z.enum(PF2E_ITEM_TYPES)).nonempty({ message: 'type array must not be empty' }).optional(),
  level: levelRange.optional(),
  traits: stringListField('traits array must not be empty').optional(),
  rarity: z.array(z.enum(PF2E_RARITIES)).nonempty({ message: 'rarity array must not be empty' }).optional(),
  category: stringListField('category array must not be empty').optional(),
  traditions: stringListField('traditions array must not be empty').optional(),
  priceGold: priceRange.optional(),
  ...paginationFields
});

export type Pf2eFilterCompendiumItemsRequest = z.infer<
  typeof pf2eFilterCompendiumItemsRequestSchema
>;
