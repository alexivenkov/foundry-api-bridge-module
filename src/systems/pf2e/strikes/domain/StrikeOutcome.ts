export interface StrikeSummary {
  readonly slug: string;
  readonly label: string;
  readonly ready: boolean;
  readonly variants: readonly string[];
}

export interface StrikeListOutcome {
  readonly actorId: string;
  readonly actorName: string;
  readonly strikes: readonly StrikeSummary[];
}
