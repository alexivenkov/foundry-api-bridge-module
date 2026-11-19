export interface Pf1HealthState {
  readonly hp: {
    readonly value: number;
    readonly max: number;
    readonly temp: number;
    readonly nonlethal: number;
  };
  /** Only when the Wounds & Vigor variant rule tracks the actor. */
  readonly vigor?: { readonly value: number; readonly max: number; readonly temp: number };
  readonly wounds?: { readonly value: number; readonly max: number };
}

export interface Pf1ApplyDamageOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  /** False when the health did not change (ratio and reduction left nothing, or healing at full HP). */
  readonly applied: boolean;
  readonly before: Pf1HealthState;
  readonly after: Pf1HealthState;
}
