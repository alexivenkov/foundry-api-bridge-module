import { ValidationError } from '../../../../../kernel';
import {
  MAX_DICE,
  MAX_FORMULA_LENGTH,
  RollFormulaRequiredError,
  RollFormulaTooLongError,
  TooManyDiceError,
  assertDiceBudget,
  countRequestedDice,
  parseRollFormula,
  readNaturalExtremes,
  type RolledDice
} from '../..';

function d(faces: number, ...results: Array<number | [value: number, kept: boolean]>): RolledDice {
  return {
    faces,
    count: results.length,
    results: results.map((entry) =>
      typeof entry === 'number' ? { value: entry, kept: true } : { value: entry[0], kept: entry[1] }
    )
  };
}

describe('parseRollFormula', () => {
  it('trims the formula', () => {
    expect(parseRollFormula('  2d6 + 3 ')).toBe('2d6 + 3');
  });

  it.each(['', '   ', '\n\t'])('rejects the empty formula %j', (raw) => {
    const act = (): unknown => parseRollFormula(raw);

    expect(act).toThrow(RollFormulaRequiredError);
    expect(act).toThrow(ValidationError);
    expect(act).toThrow('Roll formula is required');
  });

  it('accepts a formula of exactly the maximum length', () => {
    const formula = '1'.repeat(MAX_FORMULA_LENGTH);

    expect(parseRollFormula(formula)).toBe(formula);
  });

  it('rejects a longer formula, naming both lengths', () => {
    const act = (): unknown => parseRollFormula('1'.repeat(MAX_FORMULA_LENGTH + 1));

    expect(act).toThrow(RollFormulaTooLongError);
    expect(act).toThrow('Roll formula is too long (201 > 200 characters)');
  });

  it('measures the length after trimming', () => {
    const padded = `   ${'1'.repeat(MAX_FORMULA_LENGTH)}   `;

    expect(parseRollFormula(padded)).toHaveLength(MAX_FORMULA_LENGTH);
  });
});

describe('dice budget', () => {
  it('sums the dice of every term', () => {
    expect(countRequestedDice([2, 1, 8])).toBe(11);
  });

  it('counts a term whose count is an expression as one die', () => {
    expect(countRequestedDice([null, 3, null])).toBe(5);
  });

  it('counts no dice in a formula without dice terms', () => {
    expect(countRequestedDice([])).toBe(0);
  });

  it('allows exactly the maximum number of dice', () => {
    expect(() => {
      assertDiceBudget([600, 400]);
    }).not.toThrow();
    expect(MAX_DICE).toBe(1000);
  });

  it('rejects one die more, naming both numbers', () => {
    const act = (): void => {
      assertDiceBudget([600, 401]);
    };

    expect(act).toThrow(TooManyDiceError);
    expect(act).toThrow('Roll formula asks for too many dice (1001 > 1000)');
  });
});

describe('readNaturalExtremes', () => {
  it.each([
    ['a natural 20', [d(20, 20)], true, false],
    ['a natural 1', [d(20, 1)], false, true],
    ['an ordinary d20', [d(20, 11)], false, false],
    ['two kept d20s showing 20 and 1', [d(20, 20, 1)], true, true],
    ['advantage keeping the 20', [d(20, [20, true], [5, false])], true, false],
    ['disadvantage discarding the 20', [d(20, [20, false], [5, true])], false, false],
    ['disadvantage keeping the 1', [d(20, [1, true], [18, false])], false, true],
    ['advantage discarding the 1', [d(20, [1, false], [18, true])], false, false],
    ['a 20 on a d100 and a 1 on a d6', [d(100, 20), d(6, 1)], false, false],
    ['a d20 in a second term', [d(6, 3), d(20, 20)], true, false],
    ['no dice at all', [], false, false]
  ])('%s', (_case, dice, isCritical, isFumble) => {
    expect(readNaturalExtremes(dice)).toEqual({ isCritical, isFumble });
  });
});
