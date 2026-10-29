import type { SwadeActorTarget, SwadeTraitRollOutcome } from '@/systems/swade/shared/domain';
import type { SwadeAttackRollOutcome, SwadeDamageRollOutcome } from '@/systems/swade/rolls/domain/RollOutcome';

export interface TraitRollOptions {
  readonly modifier: number | undefined;
  readonly modifierLabel: string | undefined;
  readonly targetNumber: number;
  readonly ignoreWounds: boolean;
  readonly showInChat: boolean;
}

export interface SkillRollOptions extends TraitRollOptions {
  readonly unskilled: boolean;
}

export interface AttackRollOptions {
  readonly targetTokenId: string | undefined;
  readonly targetNumber: number | undefined;
  readonly modifier: number | undefined;
  readonly modifierLabel: string | undefined;
  readonly showInChat: boolean;
}

export interface DamageRollOptions {
  readonly raise: boolean;
  readonly modifier: number | string | undefined;
  readonly modifierLabel: string | undefined;
  readonly ap: number | undefined;
  readonly targetTokenId: string | undefined;
  readonly showInChat: boolean;
}

/**
 * Outbound port for SWADE trait and damage rolls through the system's own
 * builders (`rollAttribute`, `rollSkill`, `makeUnskilledAttempt`,
 * `item.rollDamage`) with `suppressChat`, so no dialog ever opens.
 */
export interface SwadeRollPort {
  rollAttribute(target: SwadeActorTarget, attribute: string, options: TraitRollOptions): Promise<SwadeTraitRollOutcome>;
  rollSkill(target: SwadeActorTarget, skill: string, options: SkillRollOptions): Promise<SwadeTraitRollOutcome>;
  rollAttack(target: SwadeActorTarget, itemId: string, options: AttackRollOptions): Promise<SwadeAttackRollOutcome>;
  rollDamage(target: SwadeActorTarget, itemId: string, options: DamageRollOptions): Promise<SwadeDamageRollOutcome>;
}
