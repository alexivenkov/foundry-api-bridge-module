import { checkCardLines, effectiveDifficulty, rollCoc7Check } from '../checkRunner';
import { FakeDiceRoller, makeGame } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

const options = { difficulty: undefined, bonusDice: 0, penaltyDice: 0, flatDiceModifier: 0, flatThresholdModifier: 0, blind: false, showInChat: false };

describe('rollCoc7Check', () => {
  it('rolls the tens pool and the unit through the roller and resolves with the world default difficulty', async () => {
    const dice = new FakeDiceRoller().queueCheck([3], 7);
    const { resolution, rolls } = await rollCoc7Check(makeGame({ settings: { defaultCheckDifficulty: 'hard' } }), dice, 70, options);
    expect(dice.d10Calls).toEqual([1, 1]);
    expect(resolution).toMatchObject({ total: 37, difficulty: 'hard', outcome: 'regular', isSuccess: false });
    expect(rolls).toHaveLength(2);
    expect(rolls[0]?.formula).toBe('1d10');
  });

  it('rolls one tens die per bonus or penalty die', async () => {
    const dice = new FakeDiceRoller().queueCheck([3, 8, 1], 7);
    const { resolution } = await rollCoc7Check(makeGame(), dice, 70, { ...options, penaltyDice: 2 });
    expect(dice.d10Calls).toEqual([3, 1]);
    expect(resolution.total).toBe(87);
  });

  it('falls back to regular when the setting is unknown and honours an explicit difficulty', () => {
    expect(effectiveDifficulty(makeGame({ settings: { defaultCheckDifficulty: 'weird' } }), undefined)).toBe('regular');
    expect(effectiveDifficulty(makeGame({ settings: { defaultCheckDifficulty: 'extreme' } }), 'critical')).toBe('critical');
  });

  it('describes the check on the card', async () => {
    const dice = new FakeDiceRoller().queueCheck([4, 10], 7);
    const { resolution } = await rollCoc7Check(makeGame(), dice, 45, { ...options, bonusDice: 1 });
    expect(checkCardLines('Spot Hidden', resolution)).toEqual([
      'Spot Hidden 45 — Regular',
      'tens 40 | 00 (kept 00), unit 7, 1 bonus',
      'Total 7',
      'Extreme success'
    ]);
  });
});
