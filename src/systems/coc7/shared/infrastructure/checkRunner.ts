import {
  parseCoc7Difficulty,
  resolveCoc7Check,
  type Coc7CheckOptions,
  type Coc7CheckResolution,
  type Coc7Difficulty
} from '@/systems/coc7/shared/domain';
import { settingValue } from './chat';
import type { Coc7DiceRoller, FoundryRollLike } from './dice';
import type { FoundryCoc7Game } from './foundryCoc7Types';

export function effectiveDifficulty(game: FoundryCoc7Game, requested: Coc7Difficulty | undefined): Coc7Difficulty {
  if (requested !== undefined) {
    return requested;
  }
  return parseCoc7Difficulty(settingValue(game, 'defaultCheckDifficulty'));
}

export interface Coc7RolledCheck {
  readonly resolution: Coc7CheckResolution;
  /** The Foundry `Roll` objects (tens, unit) to attach to a card. */
  readonly rolls: readonly FoundryRollLike[];
}

/** Roll the d100 pool through Foundry (`1d10` unit, `(1 + bonus + penalty)d10` tens) and resolve it. */
export async function rollCoc7Check(
  game: FoundryCoc7Game,
  dice: Coc7DiceRoller,
  threshold: number,
  options: Coc7CheckOptions
): Promise<Coc7RolledCheck> {
  const difficulty = effectiveDifficulty(game, options.difficulty);
  const tens = await dice.rollD10(1 + options.bonusDice + options.penaltyDice);
  const unit = await dice.rollD10(1);
  const resolution = resolveCoc7Check(
    {
      threshold,
      difficulty,
      bonusDice: options.bonusDice,
      penaltyDice: options.penaltyDice,
      flatDiceModifier: options.flatDiceModifier,
      flatThresholdModifier: options.flatThresholdModifier
    },
    { tens: tens.results, unit: unit.results[0] ?? 10 }
  );
  return { resolution, rolls: [tens.roll, unit.roll] };
}

const DIFFICULTY_LABEL: Readonly<Record<Coc7Difficulty, string>> = {
  unknown: 'Unknown',
  regular: 'Regular',
  hard: 'Hard',
  extreme: 'Extreme',
  critical: 'Critical'
};

const OUTCOME_LABEL: Readonly<Record<Coc7CheckResolution['outcome'], string>> = {
  fumble: 'Fumble',
  failure: 'Failure',
  regular: 'Regular success',
  hard: 'Hard success',
  extreme: 'Extreme success',
  critical: 'Critical success'
};

export function outcomeLabel(resolution: Coc7CheckResolution): string {
  return OUTCOME_LABEL[resolution.outcome];
}

/** The lines of a check card: threshold with difficulty, the dice, the total and the outcome. */
export function checkCardLines(name: string, resolution: Coc7CheckResolution): string[] {
  const tens = resolution.dice.tens.map((die) => (die.value === 0 ? '00' : String(die.value))).join(' | ');
  const kept = resolution.dice.tens.find((die) => die.kept);
  const keptText =
    resolution.dice.tens.length > 1 && kept !== undefined ? ` (kept ${kept.value === 0 ? '00' : String(kept.value)})` : '';
  const poolText =
    resolution.dice.bonusDice > 0
      ? `, ${String(resolution.dice.bonusDice)} bonus`
      : resolution.dice.penaltyDice > 0
        ? `, ${String(resolution.dice.penaltyDice)} penalty`
        : '';
  const lines = [
    `${name} ${String(resolution.threshold)} — ${DIFFICULTY_LABEL[resolution.difficulty]}`,
    `tens ${tens}${keptText}, unit ${String(resolution.dice.unit)}${poolText}`,
    `Total ${String(resolution.total)}`,
    outcomeLabel(resolution)
  ];
  return lines;
}
