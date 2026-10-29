import { ValidationError } from '@/systems/shared/domain/errors';

/** The five SWADE attributes (swade 6.0.4 `SWADE.attributes`). */
export const SWADE_ATTRIBUTE_KEYS = ['agility', 'smarts', 'spirit', 'strength', 'vigor'] as const;

export type SwadeAttributeKey = (typeof SWADE_ATTRIBUTE_KEYS)[number];

const KNOWN: ReadonlySet<string> = new Set<string>(SWADE_ATTRIBUTE_KEYS);

export function parseSwadeAttributeKey(raw: string): SwadeAttributeKey {
  if (!KNOWN.has(raw)) {
    throw new ValidationError(
      `Invalid SWADE attribute: ${raw}. Valid attributes: ${SWADE_ATTRIBUTE_KEYS.join(', ')}`
    );
  }
  return raw as SwadeAttributeKey;
}
