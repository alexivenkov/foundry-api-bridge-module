import type { Coc7ActorTarget, Coc7LuckAction } from '@/systems/coc7/shared/domain';

export interface LuckCommand {
  readonly target: Coc7ActorTarget;
  readonly action: Coc7LuckAction;
  readonly amount: number;
}
