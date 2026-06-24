import { ValidationError } from '@/systems/shared/domain/errors';

/**
 * D&D 5e ability score keys.
 */
export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export type AbilityKey = (typeof ABILITY_KEYS)[number];

const KNOWN: ReadonlySet<string> = new Set<string>(ABILITY_KEYS);

export function parseAbilityKey(raw: string): AbilityKey {
  if (!KNOWN.has(raw)) {
    throw new ValidationError(
      `Invalid ability key: ${raw}. Valid keys: ${ABILITY_KEYS.join(', ')}`
    );
  }
  return raw as AbilityKey;
}
