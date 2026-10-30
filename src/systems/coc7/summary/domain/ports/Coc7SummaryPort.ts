import type { Coc7ActorTarget } from '@/systems/coc7/shared/domain';
import type { Coc7ActorSummaryOutcome } from '../SummaryOutcome';

/** Outbound port for the normalized CoC7 sheet (read-only). */
export interface Coc7SummaryPort {
  getSummary(target: Coc7ActorTarget): Promise<Coc7ActorSummaryOutcome>;
}
