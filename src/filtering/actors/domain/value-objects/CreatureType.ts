import { ValidationError } from '@/kernel/domain/errors';

export enum CreatureType {
  Aberration = 'aberration',
  Beast = 'beast',
  Celestial = 'celestial',
  Construct = 'construct',
  Dragon = 'dragon',
  Elemental = 'elemental',
  Fey = 'fey',
  Fiend = 'fiend',
  Giant = 'giant',
  Humanoid = 'humanoid',
  Monstrosity = 'monstrosity',
  Ooze = 'ooze',
  Plant = 'plant',
  Undead = 'undead'
}

const KNOWN: ReadonlySet<string> = new Set<string>(Object.values(CreatureType));

export function parseCreatureType(raw: string): CreatureType {
  const normalized = raw.trim().toLowerCase();
  if (!KNOWN.has(normalized)) {
    throw new ValidationError(`unknown creatureType: '${raw}'`);
  }
  return normalized as CreatureType;
}
