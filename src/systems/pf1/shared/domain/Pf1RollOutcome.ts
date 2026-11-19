/** One dice term of a roll: only the results Foundry kept (`active`) are listed. */
export interface Pf1DieOutcome {
  readonly type: string;
  readonly count: number;
  readonly results: readonly number[];
}

export interface Pf1RollOutcome {
  readonly total: number;
  readonly formula: string;
  readonly dice: readonly Pf1DieOutcome[];
}

/** A `D20RollPF`: the natural d20 (after `kh`/`kl`, or the Take 10/20 value) and whether it was static. */
export interface Pf1D20RollOutcome extends Pf1RollOutcome {
  readonly natural: number | null;
  readonly isStatic: boolean;
}

/** Shared roll options of every pf1 d20 check. */
export interface Pf1CheckOptions {
  /** Extra roll formula appended to the check, e.g. `2` or `1d4[Bless]`. */
  readonly bonus: string | undefined;
  readonly dc: number | undefined;
  /** Take 10 / Take 20: the system's `staticRoll`. */
  readonly takeX: 10 | 20 | undefined;
  readonly rollMode: string | undefined;
  readonly showInChat: boolean;
}
