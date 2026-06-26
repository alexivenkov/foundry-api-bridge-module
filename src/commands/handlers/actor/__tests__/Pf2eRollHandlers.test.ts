const rollFn = jest.fn();

const statistic = { check: { roll: rollFn } };

const mockActor = {
  id: 'a1',
  name: 'Hero',
  skills: { acrobatics: statistic },
  saves: { fortitude: statistic },
  perception: statistic
};

const mockGame = {
  system: { id: 'pf2e' },
  actors: { get: jest.fn() }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

import { pf2eRollSkillHandler } from '../Pf2eRollSkillHandler';
import { pf2eRollSaveHandler } from '../Pf2eRollSaveHandler';
import { pf2eRollPerceptionHandler } from '../Pf2eRollPerceptionHandler';
import { dnd5eRollAbilityHandler } from '../Dnd5eRollAbilityHandler';
import { dnd5eRollSkillHandler } from '../Dnd5eRollSkillHandler';

const checkRoll = {
  total: 21,
  formula: '1d20 + 11',
  dice: [{ faces: 20, number: 1, results: [{ result: 10 }] }],
  degreeOfSuccess: 3
};

describe('PF2e roll handlers (pf2e world)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.system.id = 'pf2e';
    mockGame.actors.get.mockReturnValue(mockActor);
    rollFn.mockResolvedValue(checkRoll);
  });

  it('pf2eRollSkillHandler rolls a skill and maps degree to isCritical', async () => {
    const result = await pf2eRollSkillHandler({ actorId: 'a1', skill: 'acrobatics', showInChat: true });

    expect(rollFn).toHaveBeenCalledWith({ skipDialog: true, createMessage: true });
    expect(result.total).toBe(21);
    expect(result.isCritical).toBe(true);
  });

  it('pf2eRollSaveHandler rolls the named save', async () => {
    const result = await pf2eRollSaveHandler({ actorId: 'a1', save: 'fortitude' });

    expect(rollFn).toHaveBeenCalledWith({ skipDialog: true, createMessage: false });
    expect(result.total).toBe(21);
  });

  it('pf2eRollPerceptionHandler rolls perception', async () => {
    const result = await pf2eRollPerceptionHandler({ actorId: 'a1', showInChat: true });

    expect(rollFn).toHaveBeenCalledWith({ skipDialog: true, createMessage: true });
    expect(result.total).toBe(21);
  });

  it('pf2eRollSaveHandler rejects an invalid save slug', async () => {
    await expect(
      pf2eRollSaveHandler({ actorId: 'a1', save: 'dodge' as 'fortitude' })
    ).rejects.toThrow();
  });

  describe('system mismatch guard', () => {
    it('rejects a dnd5e command in a pf2e world', async () => {
      await expect(dnd5eRollAbilityHandler({ actorId: 'a1', ability: 'str' })).rejects.toThrow(
        "Operation 'dnd5e/roll-ability' is not supported by game system 'pf2e'"
      );
      await expect(dnd5eRollSkillHandler({ actorId: 'a1', skill: 'ath' })).rejects.toThrow(
        "Operation 'dnd5e/roll-skill' is not supported by game system 'pf2e'"
      );
    });

    it('rejects a pf2e command in a dnd5e world', async () => {
      mockGame.system.id = 'dnd5e';
      await expect(pf2eRollSkillHandler({ actorId: 'a1', skill: 'acrobatics' })).rejects.toThrow(
        "Operation 'pf2e/roll-skill' is not supported by game system 'dnd5e'"
      );
    });
  });
});
