import { COC7_CONDITION_IDS, type Coc7ConditionId, type Coc7Conditions, type Coc7StatusSummary } from '@/systems/coc7/shared/domain';
import type { FoundryCoc7Actor } from './foundryCoc7Types';

function effectCarries(actor: FoundryCoc7Actor, id: Coc7ConditionId): boolean {
  return actor.effects.contents.some((effect) => effect.statuses.has(id));
}

/**
 * A condition is on when the sheet flag says so or the status effect exists:
 * with status icons enabled the system creates the effect first and sets the
 * flag from the `createActiveEffect` hook without awaiting it.
 */
export function readCoc7Conditions(actor: FoundryCoc7Actor): Coc7Conditions {
  const conditions = actor.system.conditions;
  const result = {} as Record<Coc7ConditionId, boolean>;
  for (const id of COC7_CONDITION_IDS) {
    result[id] = (conditions?.[id].value ?? false) || effectCarries(actor, id);
  }
  return result;
}

export function readCoc7Statuses(actor: FoundryCoc7Actor): Coc7StatusSummary[] {
  return actor.items.contents
    .filter((item) => item.type === 'status')
    .map((item) => ({
      id: item.id,
      name: item.name,
      phobia: item.system.type?.phobia === true,
      mania: item.system.type?.mania === true
    }));
}

const SETTLE_ATTEMPTS = 10;
const SETTLE_DELAY_MS = 50;

/**
 * After `conditionsUnset` the effect is gone at once but the flag is cleared
 * from the `deleteActiveEffect` hook without awaiting; wait briefly for it so
 * the answer does not report a stale `true`.
 */
export async function settleConditionCleared(actor: FoundryCoc7Actor, id: Coc7ConditionId): Promise<void> {
  for (let attempt = 0; attempt < SETTLE_ATTEMPTS; attempt += 1) {
    if (!actor.hasConditionStatus(id) && !effectCarries(actor, id)) {
      return;
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, SETTLE_DELAY_MS);
    });
  }
}
