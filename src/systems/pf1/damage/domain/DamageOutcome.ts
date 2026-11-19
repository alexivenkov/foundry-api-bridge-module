import type { Pf1HealthState } from '@/systems/pf1/shared/domain';

export type { Pf1HealthState };

export interface Pf1ApplyDamageOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  /** False when the health did not change (ratio and reduction left nothing, or healing at full HP). */
  readonly applied: boolean;
  readonly before: Pf1HealthState;
  readonly after: Pf1HealthState;
}
