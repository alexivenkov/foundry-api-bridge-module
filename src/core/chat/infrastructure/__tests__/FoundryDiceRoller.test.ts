import { FoundryDiceRoller } from '../FoundryDiceRoller';
import type { FoundryRoll, FoundryRollTerm } from '../foundryRollTypes';

interface RollMocks {
  roller: FoundryDiceRoller;
  Roll: jest.Mock;
  evaluate: jest.Mock;
  toMessage: jest.Mock;
}

function rollerOver(roll: Partial<Pick<FoundryRoll, 'dice' | 'terms' | 'total' | 'formula'>> = {}): RollMocks {
  const evaluate = jest.fn().mockResolvedValue(undefined);
  const toMessage = jest.fn().mockResolvedValue(undefined);
  const instance: FoundryRoll = { total: 0, formula: '', terms: [], ...roll, evaluate, toMessage };
  const Roll = jest.fn(() => instance);
  return {
    roller: new FoundryDiceRoller(() => ({ Roll: Roll as unknown as new (formula: string) => FoundryRoll })),
    Roll,
    evaluate,
    toMessage
  };
}

describe('FoundryDiceRoller', () => {
  describe('prepare', () => {
    it('parses the formula without rolling it', () => {
      const { roller, Roll, evaluate } = rollerOver();

      roller.prepare('2d6+3');

      expect(Roll).toHaveBeenCalledWith('2d6+3');
      expect(evaluate).not.toHaveBeenCalled();
    });

    it('reports how many dice each dice term asks for', () => {
      const { roller } = rollerOver({ dice: [{ number: 2 }, { number: 600 }] });

      expect(roller.prepare('2d6+600d20').diceCounts).toEqual([2, 600]);
    });

    it('reports a count that is not a plain number as unknown', () => {
      const { roller } = rollerOver({
        dice: [{ number: undefined }, { number: '(1d4)' }, { number: Number.NaN }, { number: Infinity }, {}]
      });

      expect(roller.prepare('(1d4)d6').diceCounts).toEqual([null, null, null, null, null]);
    });

    it('reports no dice when the roll exposes none', () => {
      expect(rollerOver().roller.prepare('5').diceCounts).toEqual([]);
    });

    it('lets a formula the core cannot parse fail with the core error', () => {
      const roller = new FoundryDiceRoller(() => ({
        Roll: class {
          constructor() {
            throw new Error('Unresolved StringTerm');
          }
        } as unknown as new (formula: string) => FoundryRoll
      }));

      expect(() => roller.prepare('1d20 +')).toThrow('Unresolved StringTerm');
    });
  });

  describe('roll', () => {
    it('evaluates the roll and describes its dice terms', async () => {
      const terms: FoundryRollTerm[] = [
        { faces: 20, number: 2, results: [{ result: 20, active: true }, { result: 5, active: false }] },
        {},
        { faces: 6, results: [{ result: 4 }] }
      ];
      const { roller, evaluate } = rollerOver({ total: 24, formula: '2d20kh1 + 1d6', terms });

      await expect(roller.prepare('2d20kh1+1d6').roll()).resolves.toEqual({
        formula: '2d20kh1 + 1d6',
        total: 24,
        dice: [
          { faces: 20, count: 2, results: [{ value: 20, kept: true }, { value: 5, kept: false }] },
          { faces: 6, count: 1, results: [{ value: 4, kept: true }] }
        ]
      });
      expect(evaluate).toHaveBeenCalledTimes(1);
    });

    it('skips terms that have faces but no results, or results but no faces', async () => {
      const { roller } = rollerOver({ terms: [{ faces: 6 }, { results: [{ result: 3 }] }] });

      await expect(roller.prepare('x').roll()).resolves.toMatchObject({ dice: [] });
    });
  });

  describe('post', () => {
    it.each([
      ['a flavor', 'Attack', { flavor: 'Attack' }],
      ['a null flavor', null, { flavor: null }],
      ['no flavor', undefined, {}]
    ])('posts the roll to the chat with %s', async (_case, flavor, expected) => {
      const { roller, toMessage } = rollerOver();

      await roller.prepare('1d20').post(flavor);

      expect(toMessage).toHaveBeenCalledWith(expected);
    });
  });

  it('reads the Roll class at call time, not when it is built', () => {
    const { Roll } = rollerOver();
    const provider = jest.fn(() => ({ Roll: Roll as unknown as new (formula: string) => FoundryRoll }));

    const roller = new FoundryDiceRoller(provider);
    expect(provider).not.toHaveBeenCalled();

    roller.prepare('1d4');
    expect(provider).toHaveBeenCalledTimes(1);
  });
});
