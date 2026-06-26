import { ValidationError } from '@/systems/shared/domain/errors';

/**
 * Supported PF2e condition slugs (pf2e 7.12.2 CONDITION_SLUGS), excluding
 * `persistent-damage` (opens an interactive dialog — unsafe headless) and
 * `malevolence` (no compendium entry in this version).
 */
export const PF2E_CONDITION_SLUGS = [
  'blinded', 'broken', 'clumsy', 'concealed', 'confused', 'controlled', 'cursebound',
  'dazzled', 'deafened', 'doomed', 'drained', 'dying', 'encumbered', 'enfeebled',
  'fascinated', 'fatigued', 'fleeing', 'friendly', 'frightened', 'grabbed', 'helpful',
  'hidden', 'hostile', 'immobilized', 'indifferent', 'invisible', 'observed', 'off-guard',
  'paralyzed', 'petrified', 'prone', 'quickened', 'restrained', 'sickened', 'slowed',
  'stunned', 'stupefied', 'unconscious', 'undetected', 'unfriendly', 'unnoticed', 'wounded'
] as const;

export type Pf2eConditionSlug = (typeof PF2E_CONDITION_SLUGS)[number];

/** Conditions that carry a numeric value (pf2e `isValued: true`). */
export const PF2E_VALUED_CONDITION_SLUGS: ReadonlySet<Pf2eConditionSlug> = new Set([
  'clumsy', 'cursebound', 'doomed', 'drained', 'dying', 'enfeebled',
  'frightened', 'sickened', 'slowed', 'stunned', 'stupefied', 'wounded'
]);

const KNOWN: ReadonlySet<string> = new Set<string>(PF2E_CONDITION_SLUGS);

export function parsePf2eConditionSlug(raw: string): Pf2eConditionSlug {
  if (!KNOWN.has(raw)) {
    throw new ValidationError(
      `Invalid PF2e condition slug: ${raw}. Valid slugs: ${PF2E_CONDITION_SLUGS.join(', ')}`
    );
  }
  return raw as Pf2eConditionSlug;
}
