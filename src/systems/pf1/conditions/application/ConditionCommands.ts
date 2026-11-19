import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';

export interface SetConditionCommand {
  readonly target: Pf1ActorTarget;
  readonly condition: string;
  readonly active: boolean;
}
