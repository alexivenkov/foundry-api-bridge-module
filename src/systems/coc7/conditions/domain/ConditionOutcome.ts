import type { Coc7Conditions, Coc7StatusSummary } from '@/systems/coc7/shared/domain';

export interface Coc7SetConditionOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly conditions: Coc7Conditions;
  readonly statuses: readonly Coc7StatusSummary[];
}
