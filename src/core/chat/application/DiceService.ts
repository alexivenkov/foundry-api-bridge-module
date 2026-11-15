import { requireActor, type ActorLocator, type ActorTarget, type LocatedActor, type SceneLocator } from '@/core/shared';
import {
  MAX_DICE,
  RollFormulaTooLongError,
  TooManyDiceError,
  UNEVALUABLE_FORMULA,
  UnresolvedRollDataError,
  assertDiceBudget,
  assertSimulationBudget,
  countRequestedDice,
  parseRollFormula,
  readNaturalExtremes,
  summarizeTotals,
  toRollDataSpec,
  type ChatSpeakers,
  type DiceRoll,
  type DiceRoller,
  type NaturalExtremes,
  type RollDataSpec,
  type RollDataValues,
  type RollFormulaInspector,
  type RollPostOptions,
  type RollTotalsSummary
} from '@/core/chat/domain';
import type { RollDiceCommand, SimulateRollQuery, ValidateRollFormulaQuery } from './commands';
import { requirePort } from './requirePort';

export interface DiceServiceDependencies {
  readonly dice: DiceRoller;
  /** Roll data references and the formula checks. */
  readonly formulas?: RollFormulaInspector | undefined;
  /** The speaker of a posted roll. */
  readonly speakers?: ChatSpeakers | undefined;
  readonly scenes?: SceneLocator | undefined;
  readonly locator?: ActorLocator | undefined;
}

export interface DiceRollResult extends NaturalExtremes {
  readonly roll: DiceRoll;
}

export interface RollFormulaVerdict {
  /** Trimmed. */
  readonly formula: string;
  readonly valid: boolean;
  /** Null when valid. */
  readonly reason: string | null;
  readonly unresolvedReferences: readonly string[];
}

export interface RollSimulation extends RollTotalsSummary {
  readonly formula: string;
  readonly iterations: number;
  readonly totals: readonly number[];
}

export class DiceService {
  constructor(private readonly deps: DiceServiceDependencies) {}

  /**
   * The formula is checked before it is parsed, and its dice are counted before
   * any is rolled. With roll data, a reference it does not set is refused
   * rather than rolled as 0; without any, the core rolls it as 0.
   */
  async roll(command: RollDiceCommand): Promise<DiceRollResult> {
    const formula = parseRollFormula(command.formula);
    const roller = command.roller !== undefined ? this.locate(command.roller) : undefined;
    const data = toRollDataSpec(roller?.ref, command.data) ?? undefined;
    if (data !== undefined) {
      this.assertResolved(formula, data);
    }

    const prepared = this.deps.dice.prepare(formula, data);
    assertDiceBudget(prepared.diceCounts);

    const roll = await prepared.roll();
    if (command.showInChat) {
      const options = this.postOptions(command, roller);
      await (options !== undefined ? prepared.post(command.flavor, options) : prepared.post(command.flavor));
    }
    return { roll, ...readNaturalExtremes(roll.dice) };
  }

  /** Nothing is rolled. A formula over the length limit is reported as invalid, not refused. */
  validate(query: ValidateRollFormulaQuery): RollFormulaVerdict {
    let formula: string;
    try {
      formula = parseRollFormula(query.formula);
    } catch (error) {
      if (error instanceof RollFormulaTooLongError) {
        return { formula: query.formula.trim(), valid: false, reason: error.message, unresolvedReferences: [] };
      }
      throw error;
    }

    const formulas = requirePort(this.deps.formulas, 'formulas');
    const data = this.rollData(query.roller, query.data);
    const unresolvedReferences = formulas.findUnresolvedReferences(formula, data);
    const verdict = (reason: string | null): RollFormulaVerdict => ({
      formula,
      valid: reason === null,
      reason,
      unresolvedReferences
    });

    if (!formulas.isValid(formula, data)) {
      return verdict(UNEVALUABLE_FORMULA);
    }
    const requested = countRequestedDice(this.deps.dice.prepare(formula, data).diceCounts);
    return verdict(requested > MAX_DICE ? new TooManyDiceError(requested, MAX_DICE).message : null);
  }

  /** Every reference must be set: a simulation has no legacy of rolling unset data as 0. */
  async simulate(query: SimulateRollQuery): Promise<RollSimulation> {
    const formula = parseRollFormula(query.formula);
    const data = this.rollData(query.roller, query.data);
    this.assertResolved(formula, data);

    const { diceCounts } = this.deps.dice.prepare(formula, data);
    assertDiceBudget(diceCounts);
    assertSimulationBudget(diceCounts, query.iterations);

    const totals = await requirePort(this.deps.formulas, 'formulas').simulate(formula, data, query.iterations);
    return { formula, iterations: query.iterations, totals, ...summarizeTotals(totals) };
  }

  private locate(target: ActorTarget): LocatedActor {
    return requireActor(requirePort(this.deps.scenes, 'scenes'), requirePort(this.deps.locator, 'locator'), target);
  }

  private rollData(roller: ActorTarget | undefined, values: RollDataValues | undefined): RollDataSpec | undefined {
    const located = roller !== undefined ? this.locate(roller) : undefined;
    return toRollDataSpec(located?.ref, values) ?? undefined;
  }

  private assertResolved(formula: string, data: RollDataSpec | undefined): void {
    const missing = requirePort(this.deps.formulas, 'formulas').findUnresolvedReferences(formula, data);
    if (missing.length > 0) {
      throw new UnresolvedRollDataError(missing);
    }
  }

  /** None when nothing about the post differs from a plain one. */
  private postOptions(command: RollDiceCommand, roller: LocatedActor | undefined): RollPostOptions | undefined {
    const speaker =
      roller !== undefined
        ? requirePort(this.deps.speakers, 'speakers').speakerFor(roller.ref, command.alias)
        : command.alias !== undefined
          ? requirePort(this.deps.speakers, 'speakers').standaloneSpeaker(command.alias)
          : undefined;
    if (speaker === undefined && command.visibility === undefined) {
      return undefined;
    }
    return { speaker, visibility: command.visibility };
  }
}
