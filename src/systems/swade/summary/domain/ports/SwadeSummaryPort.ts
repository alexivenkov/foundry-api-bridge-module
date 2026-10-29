import type { SwadeActorTarget } from '@/systems/swade/shared/domain';
import type { SwadeActorSummary } from '@/systems/swade/summary/domain/SummaryOutcome';

/** Outbound port for the sheet summary: a side-effect-free read of the actor. */
export interface SwadeSummaryPort {
  getSummary(target: SwadeActorTarget): Promise<SwadeActorSummary>;
}
