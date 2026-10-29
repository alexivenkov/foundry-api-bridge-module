import type { SwadeActorTarget } from '@/systems/swade/shared/domain';

export interface GetActorSummaryCommand {
  readonly target: SwadeActorTarget;
}
