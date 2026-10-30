import type { Coc7ActorTarget } from '@/systems/coc7/shared/domain';

export interface ApplyDamageCommand {
  readonly target: Coc7ActorTarget;
  readonly damage: number | undefined;
  readonly heal: number | undefined;
  readonly ignoreArmor: boolean;
  readonly armor: string | number | undefined;
}
