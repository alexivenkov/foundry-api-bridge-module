export interface DiceOutcome {
  readonly type: string;
  readonly count: number;
  readonly results: readonly number[];
}

/**
 * System-neutral result of a roll. Each game-system adapter maps its native
 * roll into this shape; inbound adapters map it onto the wire `RollResult`.
 */
export type RollMode = 'advantage' | 'normal' | 'disadvantage';

export interface RollOutcome {
  readonly total: number;
  readonly formula: string;
  readonly dice: readonly DiceOutcome[];
  readonly isCritical?: boolean;
  readonly isFumble?: boolean;
  /** Advantage mode the system actually applied to a d20 roll, when it reports one. */
  readonly mode?: RollMode;
  /** The d20 result that was kept (the higher of two with advantage, the lower with disadvantage). */
  readonly kept?: number;
}
