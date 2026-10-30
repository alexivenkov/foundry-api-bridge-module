import type { Coc7ActorTarget } from '@/systems/coc7/shared/domain';

export interface GetActorSummaryCommand {
  readonly target: Coc7ActorTarget;
}
