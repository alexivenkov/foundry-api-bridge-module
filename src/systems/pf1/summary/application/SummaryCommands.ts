import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';

export interface GetSummaryCommand {
  readonly target: Pf1ActorTarget;
}
