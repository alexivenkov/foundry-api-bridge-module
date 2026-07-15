import { ValidationError } from '@/kernel/domain/errors';

export enum ItemType {
  Weapon = 'weapon',
  Equipment = 'equipment',
  Consumable = 'consumable',
  Tool = 'tool',
  Container = 'container',
  Loot = 'loot',
  Spell = 'spell',
  Feat = 'feat',
  Background = 'background',
  Race = 'race',
  Class = 'class',
  Subclass = 'subclass',
  Feature = 'feature'
}

const KNOWN: ReadonlySet<string> = new Set<string>(Object.values(ItemType));

export function parseItemType(raw: string): ItemType {
  const normalized = raw.trim().toLowerCase();
  if (!KNOWN.has(normalized)) {
    throw new ValidationError(`unknown itemType: '${raw}'`);
  }
  return normalized as ItemType;
}
