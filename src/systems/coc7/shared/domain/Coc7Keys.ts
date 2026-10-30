import { ValidationError } from '@/systems/shared/domain/errors';

export const COC7_CHARACTERISTIC_KEYS = ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu'] as const;
export type Coc7CharacteristicKey = (typeof COC7_CHARACTERISTIC_KEYS)[number];

/** `idea` rolls INT and `know` rolls EDU (the system's `config.idea` / `config.know`). */
export const COC7_CHARACTERISTIC_CHECKS = [...COC7_CHARACTERISTIC_KEYS, 'idea', 'know'] as const;
export type Coc7CharacteristicCheck = (typeof COC7_CHARACTERISTIC_CHECKS)[number];

export const COC7_ATTRIBUTE_KEYS = ['luck', 'sanity'] as const;
export type Coc7AttributeKey = (typeof COC7_ATTRIBUTE_KEYS)[number];

/** The seven condition flags of `system.conditions` (CoC7 `STATUS_EFFECTS`). */
export const COC7_CONDITION_IDS = [
  'criticalWounds',
  'unconscious',
  'dying',
  'dead',
  'prone',
  'tempoInsane',
  'indefInsane'
] as const;
export type Coc7ConditionId = (typeof COC7_CONDITION_IDS)[number];

export const COC7_RANGE_BANDS = ['normal', 'long', 'extreme'] as const;
export type Coc7RangeBand = (typeof COC7_RANGE_BANDS)[number];

export const COC7_LUCK_ACTIONS = ['spend', 'set', 'add'] as const;
export type Coc7LuckAction = (typeof COC7_LUCK_ACTIONS)[number];

export type Coc7CheckKind = 'skill' | 'characteristic' | 'attribute' | 'weapon';

export function characteristicOfCheck(check: Coc7CharacteristicCheck): Coc7CharacteristicKey {
  if (check === 'idea') {
    return 'int';
  }
  if (check === 'know') {
    return 'edu';
  }
  return check;
}

export function characteristicCheckName(check: Coc7CharacteristicCheck): string {
  if (check === 'idea') {
    return 'Idea';
  }
  if (check === 'know') {
    return 'Know';
  }
  return check.toUpperCase();
}

export function parseCoc7CharacteristicKey(value: string): Coc7CharacteristicKey {
  const key = value.toLowerCase();
  const found = COC7_CHARACTERISTIC_KEYS.find((candidate) => candidate === key);
  if (!found) {
    throw new ValidationError(`Unknown characteristic: ${value}`);
  }
  return found;
}
