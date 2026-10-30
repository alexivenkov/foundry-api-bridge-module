import type { Coc7ActorTarget, Coc7LuckAction } from '@/systems/coc7/shared/domain';
import type { Coc7LuckOutcome } from '../LuckOutcome';

export interface LuckOptions {
  readonly action: Coc7LuckAction;
  readonly amount: number;
}

/** Outbound port for CoC7 Luck through the system's `spendLuck` / `setLuck`. */
export interface Coc7LuckPort {
  luck(target: Coc7ActorTarget, options: LuckOptions): Promise<Coc7LuckOutcome>;
}
