import type {
  ConditionMutationResult,
  ConditionListResult,
  ConditionStateWire
} from '@/commands/types';
import type {
  ConditionState,
  ConditionMutationOutcome,
  ConditionListOutcome
} from '@/systems/pf2e/conditions';

function toConditionStateWire(state: ConditionState): ConditionStateWire {
  return {
    slug: state.slug,
    name: state.name,
    value: state.value,
    active: state.active
  };
}

export function toMutationResult(outcome: ConditionMutationOutcome): ConditionMutationResult {
  return {
    actorId: outcome.actorId,
    condition: outcome.condition ? toConditionStateWire(outcome.condition) : null
  };
}

export function toListResult(outcome: ConditionListOutcome): ConditionListResult {
  return {
    actorId: outcome.actorId,
    actorName: outcome.actorName,
    conditions: outcome.conditions.map(toConditionStateWire)
  };
}
