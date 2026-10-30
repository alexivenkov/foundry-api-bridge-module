import type {
  Coc7CheckOutcome,
  Coc7DieRollOutcome,
  Coc7RangeBand,
  Coc7SkillRef,
  Coc7WeaponDamageFormulas
} from '@/systems/coc7/shared/domain';

export interface Coc7AttackWeaponOutcome {
  readonly id: string;
  readonly name: string;
  readonly skill: Coc7SkillRef;
  readonly ranged: boolean;
  readonly malfunction?: number;
  readonly impaling: boolean;
  /** Damage bonus already applied. */
  readonly damage: Coc7WeaponDamageFormulas;
}

export interface Coc7AttackRollOutcome extends Coc7CheckOutcome {
  readonly weapon: Coc7AttackWeaponOutcome;
  /** `total >= weapon.malfunction`. */
  readonly isMalfunction: boolean;
  /** Extreme or critical success with an impaling weapon. */
  readonly impale: boolean;
}

export interface Coc7DamageTargetOutcome {
  readonly tokenId: string;
  readonly name: string;
  readonly armor: number;
  readonly armorFormula?: string;
  readonly wouldInflict: number;
}

export interface Coc7DamageRollOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly weapon: { readonly id: string; readonly name: string };
  readonly range: Coc7RangeBand;
  readonly formula: string;
  /** The damage bonus term appended (`+1d4`, `+1D2`, `-1`, or empty). */
  readonly damageBonus: string;
  readonly impale: boolean;
  readonly maximized: boolean;
  readonly dice: readonly Coc7DieRollOutcome[];
  readonly total: number;
  readonly versusTarget?: Coc7DamageTargetOutcome;
  readonly messageId?: string;
}
