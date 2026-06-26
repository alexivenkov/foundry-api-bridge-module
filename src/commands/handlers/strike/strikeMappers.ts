import type { RollResult, StrikeListResult } from '@/commands/types';
import type { RollOutcome } from '@/systems/shared/domain';
import type { StrikeListOutcome } from '@/systems/pf2e/strikes';

export function toRollResult(outcome: RollOutcome): RollResult {
  const result: RollResult = {
    total: outcome.total,
    formula: outcome.formula,
    dice: outcome.dice.map((d) => ({
      type: d.type,
      count: d.count,
      results: [...d.results]
    }))
  };

  if (outcome.isCritical) {
    result.isCritical = true;
  }
  if (outcome.isFumble) {
    result.isFumble = true;
  }

  return result;
}

export function toStrikeListResult(outcome: StrikeListOutcome): StrikeListResult {
  return {
    actorId: outcome.actorId,
    actorName: outcome.actorName,
    strikes: outcome.strikes.map((strike) => ({
      slug: strike.slug,
      label: strike.label,
      ready: strike.ready,
      variants: [...strike.variants]
    }))
  };
}
