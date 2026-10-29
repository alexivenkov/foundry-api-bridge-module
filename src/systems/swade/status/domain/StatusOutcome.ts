export interface SwadeSetStatusOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly status: string;
  readonly active: boolean;
  /** Every status id active on the actor after the call, linked statuses included. */
  readonly statuses: readonly string[];
}
