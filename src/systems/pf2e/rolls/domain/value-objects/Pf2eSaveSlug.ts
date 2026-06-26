import { ValidationError } from '@/systems/shared/domain/errors';

/** PF2e saving-throw slugs (pf2e 7.12.2, SAVE_TYPES). */
export const PF2E_SAVE_SLUGS = ['fortitude', 'reflex', 'will'] as const;

export type Pf2eSaveSlug = (typeof PF2E_SAVE_SLUGS)[number];

const KNOWN: ReadonlySet<string> = new Set<string>(PF2E_SAVE_SLUGS);

export function parsePf2eSaveSlug(raw: string): Pf2eSaveSlug {
  if (!KNOWN.has(raw)) {
    throw new ValidationError(
      `Invalid PF2e save slug: ${raw}. Valid slugs: ${PF2E_SAVE_SLUGS.join(', ')}`
    );
  }
  return raw as Pf2eSaveSlug;
}
