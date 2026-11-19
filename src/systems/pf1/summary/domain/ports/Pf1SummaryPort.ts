import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import type { Pf1ActorSummary } from '../SummaryOutcome';

/** Outbound port reading the normalized PF1 sheet from the prepared actor data. */
export interface Pf1SummaryPort {
  getSummary(target: Pf1ActorTarget): Promise<Pf1ActorSummary>;
}
