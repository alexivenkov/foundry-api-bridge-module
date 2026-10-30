import type { Coc7ActorTarget, Coc7CheckOptions, Coc7RangeBand } from '@/systems/coc7/shared/domain';
import type { Coc7DamageSuccessLevel } from '@/systems/coc7/attacks/domain';

export interface RollAttackCommand {
  readonly target: Coc7ActorTarget;
  readonly itemId: string;
  readonly alternativeSkill: boolean;
  readonly options: Coc7CheckOptions;
}

export interface RollDamageCommand {
  readonly target: Coc7ActorTarget;
  readonly itemId: string;
  readonly range: Coc7RangeBand;
  readonly successLevel: Coc7DamageSuccessLevel;
  readonly targetTokenId: string | undefined;
  readonly showInChat: boolean;
}
