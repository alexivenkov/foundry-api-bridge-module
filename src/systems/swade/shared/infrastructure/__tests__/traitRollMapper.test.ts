import { toTraitRollOutcome, extractModifiers, isWildDie } from '../traitRollMapper';
import { makeTraitRoll } from '../../__tests__/swadeTestFixtures';

describe('toTraitRollOutcome', () => {
  it('maps the pool dice, marks the wild die and the kept die, and computes the modifier total', () => {
    const roll = makeTraitRoll({
      dice: [
        { faces: 8, results: [8, 3] },
        { faces: 6, results: [4], wild: true }
      ],
      modifiers: [
        ['Wounds', -1],
        ['Modifier', 2]
      ]
    });

    const outcome = toTraitRollOutcome(roll, { actorId: 'a1', tokenId: 't1', trait: 'agility', wildDieClass: undefined });

    expect(outcome.dice).toEqual([
      { type: 'd8', results: [8, 3], total: 11, wild: false, kept: true },
      { type: 'd6', results: [4], total: 4, wild: true, kept: false }
    ]);
    expect(outcome.total).toBe(12);
    expect(outcome.modifiers).toEqual([
      { label: 'Wounds', value: -1 },
      { label: 'Modifier', value: 2 }
    ]);
    expect(outcome.modifierTotal).toBe(1);
    expect(outcome.wildDie).toBe(true);
    expect(outcome.tokenId).toBe('t1');
    expect(outcome.trait).toBe('agility');
    expect(outcome.formula).toBe(roll.formula);
  });

  it('reports a raise as outcome raise with isCritical', () => {
    const roll = makeTraitRoll({ dice: [{ faces: 8, results: [8, 2] }], targetNumber: 4 });

    const outcome = toTraitRollOutcome(roll, { actorId: 'a1', trait: 'vigor', wildDieClass: undefined });

    expect(outcome).toMatchObject({
      successes: 2,
      outcome: 'raise',
      raises: 1,
      isCritical: true,
      isFumble: false,
      isCriticalFailure: false,
      targetNumber: 4,
      wildDie: false
    });
    expect(outcome.tokenId).toBeUndefined();
  });

  it('reports a plain success and a failure against the target number', () => {
    expect(toTraitRollOutcome(makeTraitRoll({ dice: [{ faces: 6, results: [5] }] }), { actorId: 'a1', trait: 'x', wildDieClass: undefined }))
      .toMatchObject({ successes: 1, outcome: 'success', raises: 0, isCritical: false });
    expect(toTraitRollOutcome(makeTraitRoll({ dice: [{ faces: 6, results: [3] }], targetNumber: 6 }), { actorId: 'a1', trait: 'x', wildDieClass: undefined }))
      .toMatchObject({ successes: 0, outcome: 'failure', targetNumber: 6 });
  });

  it('reports a critical failure as fumble', () => {
    const roll = makeTraitRoll({
      dice: [
        { faces: 8, results: [1] },
        { faces: 6, results: [1], wild: true }
      ],
      isCritfail: true
    });

    const outcome = toTraitRollOutcome(roll, { actorId: 'a1', trait: 'smarts', wildDieClass: undefined });

    expect(outcome).toMatchObject({ successes: -1, outcome: 'critical-failure', isCriticalFailure: true, isFumble: true, raises: 0 });
  });

  it('identifies the wild die by class when the system exposes it', () => {
    class WildDie {}
    const die = Object.assign(new WildDie(), { results: [{ result: 2 }], faces: 6 });
    expect(isWildDie(die, WildDie)).toBe(true);
    expect(isWildDie({ results: [], faces: 6, denomination: 'd6' }, WildDie)).toBe(false);
    expect(isWildDie({ results: [], faces: 6, denomination: 'dw6' }, undefined)).toBe(true);
  });

  it('falls back to the plain dice when the roll has no pool', () => {
    const roll = makeTraitRoll();
    roll.terms = [{ operator: '+' }, { total: 2, flavor: 'Modifier' }];
    const outcome = toTraitRollOutcome(roll, { actorId: 'a1', trait: 'x', wildDieClass: undefined });
    expect(outcome.dice).toHaveLength(2);
    expect(outcome.dice.every((die) => die.kept)).toBe(true);
  });

  it('labels modifier terms by flavor, then expression, then "Modifier"', () => {
    const roll = makeTraitRoll();
    roll.terms = [roll.terms[0] ?? {}, { operator: '+' }, { total: 1, expression: '@str' }, { operator: '-' }, { total: 2 }];
    expect(extractModifiers(roll, 1)).toEqual([
      { label: '@str', value: 1 },
      { label: 'Modifier', value: -2 }
    ]);
  });
});
