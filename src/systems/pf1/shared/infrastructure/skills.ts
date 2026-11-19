import { ValidationError } from '@/systems/shared/domain/errors';
import type { FoundryPf1Actor, FoundryPf1SkillInfo } from './foundryPf1Types';

/** Every skill id of an actor in sheet order: each main skill, then its `main.sub` children (Craft, Perform, …). */
export function skillIdsOf(actor: FoundryPf1Actor): string[] {
  const ids: string[] = [];
  for (const [id, skill] of Object.entries(actor.system.skills ?? {})) {
    ids.push(id);
    for (const subId of Object.keys(skill.subSkills ?? {})) {
      ids.push(`${id}.${subId}`);
    }
  }
  return ids;
}

/** `actor.getSkillInfo` throws for an unknown id; this answers undefined instead. */
export function skillInfoOf(actor: FoundryPf1Actor, id: string): FoundryPf1SkillInfo | undefined {
  try {
    return actor.getSkillInfo(id);
  } catch {
    return undefined;
  }
}

export function skillNameOf(info: FoundryPf1SkillInfo | undefined, id: string): string {
  return info?.fullName ?? info?.name ?? id;
}

/**
 * A skill by its system id (`per`, `crf.alchemy`) or, case-insensitively, by
 * its sheet name (`Perception`, `Craft (Alchemy)`, or the bare sub-skill name).
 */
export function resolvePf1Skill(actor: FoundryPf1Actor, skill: string): { id: string; name: string } {
  if (actor.system.skills === undefined) {
    throw new ValidationError(`Actor has no skills: ${actor.name}`);
  }
  const ids = skillIdsOf(actor);
  if (ids.includes(skill)) {
    return { id: skill, name: skillNameOf(skillInfoOf(actor, skill), skill) };
  }
  const needle = skill.trim().toLowerCase();
  for (const id of ids) {
    const info = skillInfoOf(actor, id);
    const names = [info?.fullName, info?.name].filter((n): n is string => typeof n === 'string');
    if (names.some((name) => name.trim().toLowerCase() === needle)) {
      return { id, name: skillNameOf(info, id) };
    }
  }
  throw new ValidationError(
    `Skill not found: ${skill}. Use a skill id such as "per", "acr" or "crf.alchemy", or the skill's name`
  );
}
