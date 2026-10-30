import type { Coc7ActorTarget, Coc7ConditionId } from '@/systems/coc7/shared/domain';

export interface SetConditionCommand {
  readonly target: Coc7ActorTarget;
  readonly condition: Coc7ConditionId;
  readonly active: boolean;
  readonly realTime: boolean | undefined;
  readonly duration: number | undefined;
}
