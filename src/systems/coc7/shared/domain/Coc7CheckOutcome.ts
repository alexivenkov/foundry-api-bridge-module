import type { Coc7CheckKind, Coc7ConditionId } from './Coc7Keys';
import type { Coc7CheckResolution } from './Coc7CheckRoll';
import type { Coc7Difficulty } from './Coc7Difficulty';

/** The caller's check options after validation; `difficulty` undefined means the world's default. */
export interface Coc7CheckOptions {
  readonly difficulty: Coc7Difficulty | undefined;
  readonly bonusDice: number;
  readonly penaltyDice: number;
  readonly flatDiceModifier: number;
  readonly flatThresholdModifier: number;
  readonly blind: boolean;
  readonly showInChat: boolean;
}

/** A resolved d100 check against one actor's value, as the checks and attack slices return it. */
export interface Coc7CheckOutcome extends Coc7CheckResolution {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly kind: Coc7CheckKind;
  /** Skill name, `STR` … `EDU`, `Idea`, `Know`, `Luck`, `Sanity`. */
  readonly name: string;
  readonly canPush: boolean;
  readonly markedForDevelopment: boolean;
  readonly messageId?: string;
}

export type Coc7Conditions = Readonly<Record<Coc7ConditionId, boolean>>;

export interface Coc7StatusSummary {
  readonly id: string;
  readonly name: string;
  readonly phobia: boolean;
  readonly mania: boolean;
}

export interface Coc7SkillRef {
  readonly id: string;
  readonly name: string;
  readonly value: number;
}

export interface Coc7WeaponDamageFormulas {
  readonly normal: string;
  readonly long?: string;
  readonly extreme?: string;
}

export interface Coc7DieRollOutcome {
  readonly formula: string;
  readonly results: readonly number[];
  readonly total: number;
}
