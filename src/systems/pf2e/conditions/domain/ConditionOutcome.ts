/** System-neutral snapshot of a single PF2e condition on an actor. */
export interface ConditionState {
  readonly slug: string;
  readonly name: string;
  readonly value: number | null;
  readonly active: boolean;
}

/** Result of a set/increase/decrease — the resulting condition, or null if absent. */
export interface ConditionMutationOutcome {
  readonly actorId: string;
  readonly condition: ConditionState | null;
}

export interface ConditionRemovalOutcome {
  readonly actorId: string;
  readonly slug: string;
  readonly removed: boolean;
}

export interface ConditionListOutcome {
  readonly actorId: string;
  readonly actorName: string;
  readonly conditions: readonly ConditionState[];
}
