import type { Coc7ActorTarget } from '@/systems/coc7/shared/domain';
import type { Coc7ApplyDamageOutcome } from '../DamageOutcome';

export interface ApplyDamageOptions {
  /** Damage before armor; exclusive with `heal`. */
  readonly damage: number | undefined;
  readonly heal: number | undefined;
  readonly ignoreArmor: boolean;
  /** Override the target's armor (number or formula). */
  readonly armor: string | number | undefined;
}

/** Outbound port for CoC7 hit points through the system's `dealDamage` / `setHp`. */
export interface Coc7DamagePort {
  applyDamage(target: Coc7ActorTarget, options: ApplyDamageOptions): Promise<Coc7ApplyDamageOutcome>;
}
