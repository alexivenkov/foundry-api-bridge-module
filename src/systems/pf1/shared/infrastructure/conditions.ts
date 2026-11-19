import { ValidationError } from '@/systems/shared/domain/errors';
import type { FoundryPf1Actor, FoundryPf1Condition, FoundryPf1Registry } from './foundryPf1Types';

function conditionIdOf(condition: FoundryPf1Condition): string | undefined {
  return condition.id ?? condition._id;
}

/** Every condition id the system (and any module that extends `pf1.registry.conditions`) knows. */
export function pf1ConditionIds(registry: FoundryPf1Registry | undefined): string[] {
  return (registry?.conditions.contents ?? [])
    .map(conditionIdOf)
    .filter((id): id is string => typeof id === 'string');
}

/** The registry id for `condition`, matched exactly first, then case-insensitively (`flatfooted` → `flatFooted`). */
export function resolvePf1ConditionId(registry: FoundryPf1Registry | undefined, condition: string): string {
  if (!registry) {
    throw new ValidationError('pf1.registry.conditions is not available: is the pf1 system loaded?');
  }
  if (registry.conditions.get(condition)) {
    return condition;
  }
  const ids = pf1ConditionIds(registry);
  const needle = condition.trim().toLowerCase();
  const match = ids.find((id) => id.toLowerCase() === needle);
  if (match === undefined) {
    throw new ValidationError(`Unknown PF1 condition: ${condition}. Valid conditions: ${ids.join(', ')}`);
  }
  return match;
}

/** The registry conditions currently active on the actor (`actor.statuses` also holds non-condition statuses). */
export function activePf1Conditions(actor: FoundryPf1Actor, registry: FoundryPf1Registry | undefined): string[] {
  return pf1ConditionIds(registry).filter((id) => actor.statuses.has(id));
}
