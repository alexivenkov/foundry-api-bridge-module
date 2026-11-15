import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import type { ApplyDamageOptions } from '@/systems/pf1/damage/domain';

export interface ApplyDamageCommand {
  readonly target: Pf1ActorTarget;
  readonly options: ApplyDamageOptions;
}
