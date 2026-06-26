import { checkToRollOutcome, damageToRollOutcome } from '../pf2eStrikeOutcomeMapper';
import type { FoundryCheckRoll, FoundryDamageRoll } from '../foundryPf2eStrikeTypes';

describe('pf2e strike outcome mappers', () => {
  const check: FoundryCheckRoll = {
    total: 19,
    formula: '1d20 + 9',
    dice: [{ faces: 20, number: 1, results: [{ result: 10 }] }],
    degreeOfSuccess: 2
  };

  it('maps an attack check and sets isCritical on degree 3', () => {
    expect(checkToRollOutcome({ ...check, degreeOfSuccess: 3 }).isCritical).toBe(true);
  });

  it('maps an attack check and sets isFumble on degree 0', () => {
    expect(checkToRollOutcome({ ...check, degreeOfSuccess: 0 }).isFumble).toBe(true);
  });

  it('leaves attack flags unset on a plain hit', () => {
    const outcome = checkToRollOutcome(check);
    expect(outcome.isCritical).toBeUndefined();
    expect(outcome.isFumble).toBeUndefined();
  });

  it('maps a damage roll without crit/fumble flags', () => {
    const damage: FoundryDamageRoll = {
      total: 14,
      formula: '2d6 + 7',
      dice: [{ faces: 6, number: 2, results: [{ result: 3 }, { result: 4 }] }]
    };

    expect(damageToRollOutcome(damage)).toEqual({
      total: 14,
      formula: '2d6 + 7',
      dice: [{ type: 'd6', count: 2, results: [3, 4] }]
    });
  });
});
