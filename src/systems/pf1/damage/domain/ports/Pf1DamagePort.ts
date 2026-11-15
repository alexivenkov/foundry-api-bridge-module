import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import type { Pf1ApplyDamageOutcome } from '../DamageOutcome';

export interface ApplyDamageOptions {
  /** Positive damages, negative heals (the system's own sign). */
  readonly value: number;
  readonly nonlethal: boolean;
  /** Wounds & Vigor: straight to Wounds. */
  readonly asWounds: boolean;
  /** Damage reduction or energy resistance subtracted after the ratio. */
  readonly reduction: number | undefined;
  /** Multiplier applied first: 0.5 for half damage, 1.5 for vulnerability. */
  readonly ratio: number | undefined;
}

/** Outbound port for `ActorPF#applyDamage`: hit points, temporary HP, nonlethal damage and Wounds & Vigor. */
export interface Pf1DamagePort {
  applyDamage(target: Pf1ActorTarget, options: ApplyDamageOptions): Promise<Pf1ApplyDamageOutcome>;
}
