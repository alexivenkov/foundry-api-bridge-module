/** One die of a SWADE trait-roll pool, explosions included. */
export interface SwadeDieOutcome {
  readonly type: string;
  readonly results: readonly number[];
  readonly total: number;
  readonly wild: boolean;
  readonly kept: boolean;
}

export interface SwadeRollModifierOutcome {
  readonly label: string;
  readonly value: number | string;
}

export type SwadeTraitOutcomeKind = 'critical-failure' | 'failure' | 'success' | 'raise';

/**
 * System-specific result of a SWADE trait roll (attribute or skill): the kept
 * die plus modifiers against a target number, with raises and the wild die.
 */
export interface SwadeTraitRollOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly trait: string;
  readonly total: number;
  readonly formula: string;
  readonly dice: readonly SwadeDieOutcome[];
  readonly modifiers: readonly SwadeRollModifierOutcome[];
  readonly modifierTotal: number;
  readonly targetNumber: number;
  readonly successes: number;
  readonly outcome: SwadeTraitOutcomeKind;
  readonly raises: number;
  readonly isCriticalFailure: boolean;
  readonly wildDie: boolean;
  readonly isCritical: boolean;
  readonly isFumble: boolean;
  readonly messageId?: string;
}
