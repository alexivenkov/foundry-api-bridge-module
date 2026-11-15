import { readD20Result, toD20RollOutcome, toRollData, toRollOutcome } from '../rollReader';
import { d20RollData, damageRollData, liveRoll } from '@/systems/pf1/shared/__tests__/pf1TestFixtures';

describe('pf1 roll reader', () => {
  it('reads a JSON string, a live roll and plain data the same way', () => {
    const data = d20RollData([14], 6);
    expect(toRollData(JSON.stringify(data))).toEqual(data);
    expect(toRollData(liveRoll(data))).toEqual(data);
    expect(toRollData(data)).toBe(data);
  });

  it('refuses an unreadable roll string', () => {
    expect(() => toRollData('{not json')).toThrow('The system answered an unreadable roll');
  });

  it('keeps only the active d20 of 2d20kh as the natural roll', () => {
    const outcome = toD20RollOutcome(d20RollData([17, 4], 3));
    expect(outcome).toEqual({
      total: 20,
      formula: '2d20kh + 3',
      dice: [{ type: 'd20', count: 2, results: [17] }],
      natural: 17,
      isStatic: false
    });
  });

  it('marks Take 10 as static, with the spoofed d20 as the natural roll', () => {
    const outcome = toD20RollOutcome(d20RollData([10], 4, { staticRoll: 10 }));
    expect(outcome).toMatchObject({ natural: 10, isStatic: true, total: 14 });
  });

  it('reads a numeric head term and a roll without terms', () => {
    expect(toD20RollOutcome({ total: 5, formula: '5', terms: [{ class: 'NumericTerm', number: 5 }] }).natural).toBe(5);
    expect(toD20RollOutcome({}).natural).toBeNull();
    expect(toRollOutcome({})).toEqual({ total: 0, formula: '', dice: [] });
  });

  it('lists every dice term of a damage roll', () => {
    expect(toRollOutcome(damageRollData(8, [3, 6], 2)).dice).toEqual([{ type: 'd8', count: 2, results: [3, 6] }]);
  });

  it('finds the dice of pf1 weapon damage inside sizeRoll(…) and parentheses (shape seen in pf1 11.11)', () => {
    const die = { class: 'Die', number: 1, faces: 8, results: [{ result: 5, active: true }] };
    const outcome = toRollOutcome({
      formula: 'sizeRoll(1,8,4) + (1d6) + 3[Strength]',
      total: 11,
      terms: [
        {
          class: 'FunctionTerm',
          rolls: [
            { formula: '1', terms: [{ class: 'NumericTerm', number: 1 }] },
            { formula: '1d8', terms: [die] }
          ]
        },
        { class: 'OperatorTerm' },
        { class: 'ParentheticalTerm', roll: { formula: '1d6', terms: [{ class: 'Die', number: 1, faces: 6, results: [{ result: 3, active: true }] }] } }
      ]
    });
    expect(outcome.dice).toEqual([
      { type: 'd8', count: 1, results: [5] },
      { type: 'd6', count: 1, results: [3] }
    ]);
  });

  it('answers the message id only for a created message', () => {
    const data = d20RollData([9], 1);
    expect(readD20Result({ id: 'm1', rolls: [liveRoll(data)] })).toEqual({ roll: data, messageId: 'm1' });
    expect(readD20Result({ id: null, rolls: [JSON.stringify(data)] })).toEqual({ roll: data });
  });

  it('turns a cancelled or empty roll into an error', () => {
    expect(() => readD20Result(undefined)).toThrow('Roll was cancelled');
    expect(() => readD20Result({ rolls: [] })).toThrow('The system answered no roll');
  });
});
