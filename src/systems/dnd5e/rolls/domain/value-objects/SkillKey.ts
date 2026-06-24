import { ValidationError } from '@/systems/shared/domain/errors';

/**
 * D&D 5e skill abbreviations.
 * @see https://foundryvtt.wiki/en/basics/Macros
 */
export const SKILL_KEYS = [
  'acr', 'ani', 'arc', 'ath', 'dec', 'his', 'ins', 'itm',
  'inv', 'med', 'nat', 'prc', 'prf', 'per', 'rel', 'slt', 'ste', 'sur'
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

const KNOWN: ReadonlySet<string> = new Set<string>(SKILL_KEYS);

export function parseSkillKey(raw: string): SkillKey {
  if (!KNOWN.has(raw)) {
    throw new ValidationError(
      `Invalid skill key: ${raw}. Valid keys: ${SKILL_KEYS.join(', ')}`
    );
  }
  return raw as SkillKey;
}
