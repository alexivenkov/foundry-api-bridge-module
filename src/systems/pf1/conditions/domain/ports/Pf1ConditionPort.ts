import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import type { Pf1SetConditionOutcome } from '../ConditionOutcome';

/** Outbound port for PF1 conditions through `ActorPF#setConditions`, which also resolves condition tracks and immunities. */
export interface Pf1ConditionPort {
  setCondition(target: Pf1ActorTarget, condition: string, active: boolean): Promise<Pf1SetConditionOutcome>;
}
