import { ValidationError } from '@/filtering/shared/domain/errors';

export enum SpellSchool {
  Abjuration = 'abjuration',
  Conjuration = 'conjuration',
  Divination = 'divination',
  Enchantment = 'enchantment',
  Evocation = 'evocation',
  Illusion = 'illusion',
  Necromancy = 'necromancy',
  Transmutation = 'transmutation'
}

const KNOWN: ReadonlySet<string> = new Set<string>(Object.values(SpellSchool));

export function parseSpellSchool(raw: string): SpellSchool {
  const normalized = raw.trim().toLowerCase();
  if (!KNOWN.has(normalized)) {
    throw new ValidationError(`unknown spellSchool: '${raw}'`);
  }
  return normalized as SpellSchool;
}
