import type { Pf1D20RollOutcome, Pf1RollOutcome } from '@/systems/pf1/shared/domain';

/** One damage roll: the system's `DamageRoll` with its damage types. */
export interface Pf1DamageRollOutcome extends Pf1RollOutcome {
  readonly types: readonly string[];
}

export interface Pf1AttackRollOutcome extends Pf1D20RollOutcome {
  /** The natural roll is in the weapon's critical range. */
  readonly isThreat: boolean;
  readonly isNat1: boolean;
}

/**
 * One attack of an action use (an iterative, a natural attack, Haste, Rapid
 * Shot, …). `damageTotal` already applies the minimum-1 rule; on a threat the
 * system also rolls `critConfirm` and `critDamage`, whose total is the whole
 * damage of a confirmed critical hit (normal damage included).
 */
export interface Pf1AttackOutcome {
  readonly label: string | null;
  readonly attack?: Pf1AttackRollOutcome;
  readonly critConfirm?: Pf1D20RollOutcome;
  readonly damage: readonly Pf1DamageRollOutcome[];
  readonly damageTotal: number;
  readonly critDamage: readonly Pf1DamageRollOutcome[];
  readonly critDamageTotal?: number;
  readonly nonlethal: boolean;
}

export interface Pf1UseItemOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly item: { readonly id: string; readonly name: string; readonly type: string };
  readonly action?: { readonly id: string; readonly name: string };
  readonly attacks: readonly Pf1AttackOutcome[];
  readonly save?: { readonly dc: number; readonly type?: string };
  readonly messageId?: string;
}
