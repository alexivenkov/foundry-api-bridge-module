import type { Coc7ActorTarget, Coc7ConditionId } from '@/systems/coc7/shared/domain';
import type { Coc7SetConditionOutcome } from '../ConditionOutcome';

export interface SetConditionOptions {
  readonly condition: Coc7ConditionId;
  readonly active: boolean;
  /** `tempoInsane` only: rounds (true) or hours (false). */
  readonly realTime: boolean | undefined;
  readonly duration: number | undefined;
}

/** Outbound port for the seven CoC7 conditions through `conditionsSet` / `conditionsUnset`. */
export interface Coc7ConditionPort {
  setCondition(target: Coc7ActorTarget, options: SetConditionOptions): Promise<Coc7SetConditionOutcome>;
}
