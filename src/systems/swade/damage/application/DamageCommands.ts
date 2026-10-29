import type { SwadeActorTarget } from '@/systems/swade/shared/domain';

export interface ApplyDamageCommand {
  readonly target: SwadeActorTarget;
  readonly damage: number;
  readonly ap: number;
  readonly isHeavyWeapon: boolean;
  readonly apply: boolean;
}

export interface SoakCommand {
  readonly target: SwadeActorTarget;
  readonly wounds: number;
  readonly spendBenny: boolean;
  readonly modifier: number | undefined;
  readonly modifierLabel: string | undefined;
  readonly clearIncapacitated: boolean;
  readonly showInChat: boolean;
}
