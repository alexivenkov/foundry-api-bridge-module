import { NO_VITALS, type ActorVitals } from '@/core/shared/domain';

export interface FoundryActorWithAttributes {
  system?: {
    attributes?: {
      hp?: { value?: unknown; max?: unknown } | null;
      ac?: { value?: unknown } | null;
    };
  };
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * NOT system-neutral, and the only place core code looks inside `actor.system`.
 *
 * Reads the `system.attributes.hp { value, max }` / `system.attributes.ac.value`
 * layout that dnd5e and pf2e share. Any other layout yields no vitals. It exists
 * for the `hp` / `ac` fields that token, scene and combat results have always
 * carried; system-specific data belongs in a `<system>/get-actor-summary` slice.
 */
export function readConventionalVitals(actor: FoundryActorWithAttributes | null | undefined): ActorVitals {
  const attributes = actor?.system?.attributes;
  if (attributes === undefined) {
    return NO_VITALS;
  }
  const { hp, ac } = attributes;
  return {
    hp: hp && isNumber(hp.value) && isNumber(hp.max) ? { value: hp.value, max: hp.max } : null,
    ac: ac && isNumber(ac.value) ? ac.value : null
  };
}
