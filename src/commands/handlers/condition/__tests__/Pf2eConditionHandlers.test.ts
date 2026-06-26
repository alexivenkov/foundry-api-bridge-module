const increaseCondition = jest.fn();
const decreaseCondition = jest.fn();
const getCondition = jest.fn();

const mockActor = {
  id: 'a1',
  name: 'Hero',
  conditions: { active: [] as unknown[] },
  increaseCondition,
  decreaseCondition,
  getCondition
};

const mockGame = {
  system: { id: 'pf2e' },
  actors: { get: jest.fn() }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

import { pf2eSetConditionHandler } from '../Pf2eSetConditionHandler';
import { pf2eRemoveConditionHandler } from '../Pf2eRemoveConditionHandler';
import { pf2eGetConditionsHandler } from '../Pf2eGetConditionsHandler';

describe('PF2e condition handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.system.id = 'pf2e';
    mockGame.actors.get.mockReturnValue(mockActor);
    increaseCondition.mockResolvedValue(undefined);
    decreaseCondition.mockResolvedValue(undefined);
    getCondition.mockReturnValue(null);
    mockActor.conditions.active = [];
  });

  it('sets a valued condition and returns its state', async () => {
    getCondition
      .mockReturnValueOnce(null)
      .mockReturnValue({ slug: 'frightened', name: 'Frightened', value: 2, active: true });

    const result = await pf2eSetConditionHandler({ actorId: 'a1', slug: 'frightened', value: 2 });

    expect(increaseCondition).toHaveBeenCalledWith('frightened', { value: 2 });
    expect(result.condition).toEqual({ slug: 'frightened', name: 'Frightened', value: 2, active: true });
  });

  it('removes a condition', async () => {
    const result = await pf2eRemoveConditionHandler({ actorId: 'a1', slug: 'prone' });

    expect(decreaseCondition).toHaveBeenCalledWith('prone', { forceRemove: true });
    expect(result.removed).toBe(true);
  });

  it('lists active conditions', async () => {
    mockActor.conditions.active = [{ slug: 'prone', name: 'Prone', value: null, active: true }];

    const result = await pf2eGetConditionsHandler({ actorId: 'a1' });

    expect(result.conditions).toHaveLength(1);
    expect(result.actorName).toBe('Hero');
  });

  it('rejects an invalid condition value', async () => {
    await expect(
      pf2eSetConditionHandler({ actorId: 'a1', slug: 'frightened', value: -1 })
    ).rejects.toThrow();
  });

  it('rejects a pf2e condition command in a dnd5e world', async () => {
    mockGame.system.id = 'dnd5e';

    await expect(pf2eSetConditionHandler({ actorId: 'a1', slug: 'frightened', value: 2 })).rejects.toThrow(
      "Operation 'pf2e/set-condition' is not supported by game system 'dnd5e'"
    );
  });
});
