import { toRollOutcome } from '../pf2eRollOutcomeMapper';
import type { FoundryCheckRoll } from '../foundryPf2eRollTypes';

const base: FoundryCheckRoll = {
  total: 17,
  formula: '1d20 + 7',
  dice: [{ faces: 20, number: 1, results: [{ result: 10 }] }],
  degreeOfSuccess: 2
};

describe('pf2e toRollOutcome', () => {
  it('maps total, formula and dice', () => {
    expect(toRollOutcome(base)).toEqual({
      total: 17,
      formula: '1d20 + 7',
      dice: [{ type: 'd20', count: 1, results: [10] }]
    });
  });

  it('sets isCritical on critical success (degree 3)', () => {
    expect(toRollOutcome({ ...base, degreeOfSuccess: 3 }).isCritical).toBe(true);
  });

  it('sets isFumble on critical failure (degree 0)', () => {
    expect(toRollOutcome({ ...base, degreeOfSuccess: 0 }).isFumble).toBe(true);
  });

  it('leaves flags unset on plain success/failure', () => {
    const outcome = toRollOutcome({ ...base, degreeOfSuccess: 1 });
    expect(outcome.isCritical).toBeUndefined();
    expect(outcome.isFumble).toBeUndefined();
  });

  it('ignores dice terms without faces or results', () => {
    const outcome = toRollOutcome({ ...base, dice: [{ number: 1 }] });
    expect(outcome.dice).toEqual([]);
  });
});
