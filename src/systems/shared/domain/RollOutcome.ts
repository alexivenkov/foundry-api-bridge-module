export interface DiceOutcome {
  readonly type: string;
  readonly count: number;
  readonly results: readonly number[];
}

/**
 * System-neutral result of a roll. Each game-system adapter maps its native
 * roll into this shape; inbound adapters map it onto the wire `RollResult`.
 */
export interface RollOutcome {
  readonly total: number;
  readonly formula: string;
  readonly dice: readonly DiceOutcome[];
  readonly isCritical?: boolean;
  readonly isFumble?: boolean;
}
