import type {
  ConditionMutationOutcome,
  ConditionRemovalOutcome,
  ConditionListOutcome
} from '@/systems/pf2e/conditions/domain/ConditionOutcome';

/**
 * Outbound port for PF2e conditions via the actor condition API
 * (`increaseCondition`/`decreaseCondition`/`getCondition`/`conditions`).
 * Slugs arrive as plain strings and are validated inside the gateway.
 */
export interface Pf2eConditionPort {
  /** Set a condition — for valued conditions to an exact `value`, else just present. */
  setCondition(actorId: string, slug: string, value: number | undefined): Promise<ConditionMutationOutcome>;
  /** Remove a condition entirely. */
  removeCondition(actorId: string, slug: string): Promise<ConditionRemovalOutcome>;
  /** Increase a valued condition by 1 (creates it if absent). */
  increaseCondition(actorId: string, slug: string): Promise<ConditionMutationOutcome>;
  /** Decrease a valued condition by 1 (removes it at 0). */
  decreaseCondition(actorId: string, slug: string): Promise<ConditionMutationOutcome>;
  /** List the actor's active conditions. */
  getConditions(actorId: string): Promise<ConditionListOutcome>;
}
