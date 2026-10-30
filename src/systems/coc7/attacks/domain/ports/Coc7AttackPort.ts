import type { Coc7ActorTarget, Coc7CheckOptions, Coc7RangeBand } from '@/systems/coc7/shared/domain';
import type { Coc7AttackRollOutcome, Coc7DamageRollOutcome } from '../AttackOutcome';

export interface RollAttackOptions {
  /** Weapon item id or name. */
  readonly itemId: string;
  readonly alternativeSkill: boolean;
  readonly options: Coc7CheckOptions;
}

export type Coc7DamageSuccessLevel = 'regular' | 'hard' | 'extreme';

export interface RollDamageOptions {
  readonly itemId: string;
  readonly range: Coc7RangeBand;
  readonly successLevel: Coc7DamageSuccessLevel;
  readonly targetTokenId: string | undefined;
  readonly showInChat: boolean;
}

/** Outbound port for CoC7 weapon attacks and damage: the check is the module's, the formula is the system's. */
export interface Coc7AttackPort {
  rollAttack(target: Coc7ActorTarget, options: RollAttackOptions): Promise<Coc7AttackRollOutcome>;
  rollDamage(target: Coc7ActorTarget, options: RollDamageOptions): Promise<Coc7DamageRollOutcome>;
}
