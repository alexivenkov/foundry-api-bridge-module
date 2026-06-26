import { ValidationError } from '@/systems/shared/domain/errors';

/**
 * The 16 core PF2e skill slugs (pf2e 7.12.2, CORE_SKILL_SLUGS). Lore skills are
 * dynamic per-actor and are not covered here.
 */
export const PF2E_SKILL_SLUGS = [
  'acrobatics', 'arcana', 'athletics', 'crafting', 'deception', 'diplomacy',
  'intimidation', 'medicine', 'nature', 'occultism', 'performance', 'religion',
  'society', 'stealth', 'survival', 'thievery'
] as const;

export type Pf2eSkillSlug = (typeof PF2E_SKILL_SLUGS)[number];

const KNOWN: ReadonlySet<string> = new Set<string>(PF2E_SKILL_SLUGS);

export function parsePf2eSkillSlug(raw: string): Pf2eSkillSlug {
  if (!KNOWN.has(raw)) {
    throw new ValidationError(
      `Invalid PF2e skill slug: ${raw}. Valid slugs: ${PF2E_SKILL_SLUGS.join(', ')}`
    );
  }
  return raw as Pf2eSkillSlug;
}
