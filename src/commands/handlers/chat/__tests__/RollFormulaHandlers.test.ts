import { createSimulateRollHandler } from '../SimulateRollHandler';
import { createValidateRollFormulaHandler } from '../ValidateRollFormulaHandler';
import { diceWorld } from './fakeDiceWorld';

afterEach(() => {
  delete (global as Record<string, unknown>)['game'];
});

describe('validateRollFormulaHandler', () => {
  it('reports the verdict and what the actor roll data leaves unset', async () => {
    const world = diceWorld();
    const handler = createValidateRollFormulaHandler({ globals: () => world.globals });

    await expect(handler({ formula: ' 1d20 + @prof + @nope ', actorId: 'a1' })).resolves.toEqual({
      formula: '1d20 + @prof + @nope',
      valid: true,
      reason: null,
      unresolvedReferences: ['@nope']
    });
    expect(world.Roll.validate).toHaveBeenCalledWith('1d20 + 2 + 0');
  });

  it('reports a formula the core turns down', async () => {
    const world = diceWorld();
    world.Roll.validate.mockReturnValue(false);
    const handler = createValidateRollFormulaHandler({ globals: () => world.globals });

    await expect(handler({ formula: '1d20 +' })).resolves.toEqual({
      formula: '1d20 +',
      valid: false,
      reason: 'Foundry cannot parse or evaluate the formula',
      unresolvedReferences: []
    });
  });

  it('rejects a formula that is not a string', () => {
    const handler = createValidateRollFormulaHandler({ globals: () => diceWorld().globals });

    expect(() => handler({ formula: 5 } as never)).toThrow('formula');
  });

  it('names an actor that does not exist', () => {
    const handler = createValidateRollFormulaHandler({ globals: () => diceWorld().globals });

    expect(() => handler({ formula: '1d20 + @prof', actorId: 'gone' })).toThrow('Actor not found: gone');
  });
});

describe('simulateRollHandler', () => {
  it('simulates with the token actor roll data and summarizes the totals', async () => {
    const world = diceWorld();
    const handler = createSimulateRollHandler({ globals: () => world.globals });

    await expect(handler({ formula: '1d6 + @prof', iterations: 3, tokenId: 't1' })).resolves.toEqual({
      formula: '1d6 + @prof',
      iterations: 3,
      totals: [2, 4, 6],
      min: 2,
      max: 6,
      mean: 4
    });
    expect(world.Roll.simulate).toHaveBeenCalledWith('1d6 + 2', 3);
    expect(world.toMessage).not.toHaveBeenCalled();
  });

  it('refuses a reference nothing sets', async () => {
    const world = diceWorld();
    const handler = createSimulateRollHandler({ globals: () => world.globals });

    await expect(handler({ formula: '1d6 + @prof' })).rejects.toThrow('Roll formula references data that is not set: @prof');
    expect(world.Roll.simulate).not.toHaveBeenCalled();
  });

  it.each([0, 1001, 'many'])('rejects %p iterations', async (iterations) => {
    const handler = createSimulateRollHandler({ globals: () => diceWorld().globals });

    await expect(handler({ formula: '1d6', iterations } as never)).rejects.toThrow('iterations');
  });

  it('names a token that is not on the active scene', async () => {
    const handler = createSimulateRollHandler({ globals: () => diceWorld().globals });

    await expect(handler({ formula: '1d6', tokenId: 'gone' })).rejects.toThrow('Token not found: gone');
  });
});
