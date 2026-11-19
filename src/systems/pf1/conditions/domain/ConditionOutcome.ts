export interface Pf1SetConditionOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  /** The registry id the request resolved to. */
  readonly condition: string;
  /** The condition's state after the call. Still false after enabling means the actor is immune. */
  readonly active: boolean;
  /** The system created or deleted an effect (false when it was already in that state, or the actor is immune). */
  readonly changed: boolean;
  /** Every active condition: enabling one of a track (fear, lethargy, dying) clears the others. */
  readonly conditions: readonly string[];
}
