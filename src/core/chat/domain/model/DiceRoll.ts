export interface RolledDie {
  readonly value: number;
  /** False for a die that a keep / drop modifier discarded. */
  readonly kept: boolean;
}

/** One dice term of a formula after the roll, e.g. the `2d20` of `2d20kh1 + 5`. */
export interface RolledDice {
  readonly faces: number;
  readonly count: number;
  readonly results: readonly RolledDie[];
}

export interface DiceRoll {
  readonly formula: string;
  readonly total: number;
  readonly dice: readonly RolledDice[];
}
