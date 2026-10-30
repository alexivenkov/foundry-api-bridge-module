import { ValidationError } from '@/systems/shared/domain/errors';
import type { FoundryCoc7Actor, FoundryCoc7Item } from './foundryCoc7Types';

/** A skill by item id, CoC ID (`i.skill.dodge`) or name (`Spot Hidden`, `Fighting (Brawl)`), as the system resolves them. */
export function findCoc7Skill(actor: FoundryCoc7Actor, reference: string): FoundryCoc7Item | undefined {
  const byId = actor.items.get(reference);
  if (byId && byId.type === 'skill') {
    return byId;
  }
  const byCocId = actor.getFirstItemByCoCID(reference);
  if (byCocId && byCocId.type === 'skill') {
    return byCocId;
  }
  const byName = actor.getSkillByName(reference);
  if (byName && byName.type === 'skill') {
    return byName;
  }
  return undefined;
}

export function requireCoc7Skill(actor: FoundryCoc7Actor, reference: string): FoundryCoc7Item {
  const skill = findCoc7Skill(actor, reference);
  if (!skill) {
    throw new ValidationError(`Skill not found: ${reference}`);
  }
  return skill;
}

/** A weapon by item id or name among the actor's items. */
export function requireCoc7Weapon(actor: FoundryCoc7Actor, reference: string): FoundryCoc7Item {
  const byId = actor.items.get(reference);
  if (byId) {
    if (byId.type !== 'weapon') {
      throw new ValidationError(`Item is not a weapon: ${byId.name}`);
    }
    return byId;
  }
  const name = reference.trim().toLowerCase();
  const byName = actor.items.contents.find((item) => item.type === 'weapon' && item.name.trim().toLowerCase() === name);
  if (!byName) {
    throw new ValidationError(`Weapon not found: ${reference}`);
  }
  return byName;
}

export function cocIdOf(item: FoundryCoc7Item): string | undefined {
  const id = item.flags.CoC7?.cocidFlag?.id;
  return typeof id === 'string' && id !== '' ? id : undefined;
}
