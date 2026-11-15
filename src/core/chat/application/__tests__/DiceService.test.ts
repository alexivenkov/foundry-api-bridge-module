import { RollFormulaRequiredError, RollFormulaTooLongError, TooManyDiceError } from '../../domain';
import { DiceService } from '../DiceService';
import type { RollDiceCommand } from '../commands';
import { FakeDiceRoller } from './fakePorts';

function setup(): { service: DiceService; dice: FakeDiceRoller } {
  const dice = new FakeDiceRoller();
  return { service: new DiceService({ dice }), dice };
}

function roll(overrides: Partial<RollDiceCommand> = {}): RollDiceCommand {
  return { formula: '1d20', showInChat: false, flavor: undefined, ...overrides };
}

describe('DiceService', () => {
  it('rolls the trimmed formula and returns what was rolled', async () => {
    const { service, dice } = setup();

    const result = await service.roll(roll({ formula: '  1d20  ' }));

    expect(dice.events).toEqual(['prepare:1d20', 'roll']);
    expect(result).toEqual({ roll: dice.outcome, isCritical: false, isFumble: false });
  });

  it('reads a natural 20 and a natural 1 off the kept d20s', async () => {
    const { service, dice } = setup();
    dice.outcome = {
      formula: '2d20kh1',
      total: 20,
      dice: [{ faces: 20, count: 2, results: [{ value: 20, kept: true }, { value: 1, kept: false }] }]
    };

    await expect(service.roll(roll())).resolves.toMatchObject({ isCritical: true, isFumble: false });
  });

  it('refuses an empty formula before the roller sees it', async () => {
    const { service, dice } = setup();

    await expect(service.roll(roll({ formula: '   ' }))).rejects.toThrow(RollFormulaRequiredError);
    expect(dice.events).toEqual([]);
  });

  it('refuses an overlong formula before the roller sees it', async () => {
    const { service, dice } = setup();

    await expect(service.roll(roll({ formula: '1d6+'.repeat(60) + '1' }))).rejects.toThrow(RollFormulaTooLongError);
    expect(dice.events).toEqual([]);
  });

  it('refuses a formula with too many dice without rolling any', async () => {
    const { service, dice } = setup();
    dice.diceCounts = [600, 401];

    await expect(service.roll(roll({ formula: '600d20+401d6' }))).rejects.toThrow(TooManyDiceError);
    expect(dice.events).toEqual(['prepare:600d20+401d6']);
  });

  it('rolls a formula whose dice counts are expressions', async () => {
    const { service, dice } = setup();
    dice.diceCounts = [null, null];

    await service.roll(roll({ formula: '(1d4)d6' }));

    expect(dice.events).toEqual(['prepare:(1d4)d6', 'roll']);
  });

  it('keeps the roll out of the chat unless asked', async () => {
    const { service, dice } = setup();

    await service.roll(roll({ flavor: 'Attack' }));

    expect(dice.postedFlavors).toEqual([]);
  });

  it.each([['Attack'], [undefined], [null]])('posts the rolled result to the chat with flavor %p', async (flavor) => {
    const { service, dice } = setup();

    await service.roll(roll({ showInChat: true, flavor }));

    expect(dice.events).toEqual(['prepare:1d20', 'roll', 'post']);
    expect(dice.postedFlavors).toEqual([flavor]);
  });
});
