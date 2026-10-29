import type { SwadeActorTarget } from '@/systems/swade/shared/domain';
import type { SwadeApplyDamageOutcome, SwadeSoakOutcome } from '@/systems/swade/damage/domain/DamageOutcome';

export interface ApplyDamageOptions {
  readonly damage: number;
  readonly ap: number;
  readonly isHeavyWeapon: boolean;
  readonly apply: boolean;
}

export interface SoakOptions {
  readonly wounds: number;
  readonly spendBenny: boolean;
  readonly modifier: number | undefined;
  readonly modifierLabel: string | undefined;
  readonly clearIncapacitated: boolean;
  readonly showInChat: boolean;
}

/**
 * Outbound port for SWADE damage: the Toughness rule applied to an actor
 * (Shaken, Wounds, Incapacitation) and the Vigor soak roll that undoes Wounds.
 */
export interface SwadeDamagePort {
  applyDamage(target: SwadeActorTarget, options: ApplyDamageOptions): Promise<SwadeApplyDamageOutcome>;
  soak(target: SwadeActorTarget, options: SoakOptions): Promise<SwadeSoakOutcome>;
}
