import { ValidationError } from '@/filtering/shared/domain/errors';

export enum ItemRarity {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  VeryRare = 'veryRare',
  Legendary = 'legendary',
  Artifact = 'artifact'
}

// FOUNDRY-specific edge case: dnd5e versions use either 'veryRare' (camelCase)
// or 'very rare' (with a space) for the "very rare" rarity tier. The parser
// normalizes both forms (and the lower-case 'veryrare' fallback) to
// ItemRarity.VeryRare.
const RAW_TO_RARITY: ReadonlyMap<string, ItemRarity> = new Map<string, ItemRarity>([
  ['common', ItemRarity.Common],
  ['uncommon', ItemRarity.Uncommon],
  ['rare', ItemRarity.Rare],
  ['veryrare', ItemRarity.VeryRare],
  ['very rare', ItemRarity.VeryRare],
  ['legendary', ItemRarity.Legendary],
  ['artifact', ItemRarity.Artifact]
]);

export function parseItemRarity(raw: string): ItemRarity {
  const normalized = raw.trim().toLowerCase();
  const found = RAW_TO_RARITY.get(normalized);
  if (found === undefined) {
    throw new ValidationError(`unknown itemRarity: '${raw}'`);
  }
  return found;
}
