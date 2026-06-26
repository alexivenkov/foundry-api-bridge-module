const variantRoll = jest.fn();
const damage = jest.fn();
const critical = jest.fn();

const mockActor = {
  id: 'a1',
  name: 'Fighter',
  system: {
    actions: [
      {
        type: 'strike',
        slug: 'longsword',
        label: 'Longsword',
        ready: true,
        variants: [{ label: '+14', roll: variantRoll }],
        damage,
        critical
      }
    ]
  }
};

const mockGame = {
  system: { id: 'pf2e' },
  actors: { get: jest.fn() }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

import { pf2eListStrikesHandler } from '../Pf2eListStrikesHandler';
import { pf2eRollStrikeHandler } from '../Pf2eRollStrikeHandler';
import { pf2eRollStrikeDamageHandler } from '../Pf2eRollStrikeDamageHandler';

describe('PF2e strike handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.system.id = 'pf2e';
    mockGame.actors.get.mockReturnValue(mockActor);
    variantRoll.mockResolvedValue({
      total: 24,
      formula: '1d20 + 14',
      dice: [{ faces: 20, number: 1, results: [{ result: 18 }] }],
      degreeOfSuccess: 3
    });
    damage.mockResolvedValue({
      total: 12,
      formula: '1d8 + 6',
      dice: [{ faces: 8, number: 1, results: [{ result: 6 }] }]
    });
    critical.mockResolvedValue({
      total: 24,
      formula: '2d8 + 12',
      dice: [{ faces: 8, number: 2, results: [{ result: 6 }, { result: 6 }] }]
    });
  });

  it('lists strikes', async () => {
    const result = await pf2eListStrikesHandler({ actorId: 'a1' });
    expect(result.strikes[0]).toEqual({
      slug: 'longsword',
      label: 'Longsword',
      ready: true,
      variants: ['+14']
    });
  });

  it('rolls a strike attack with degree flags', async () => {
    const result = await pf2eRollStrikeHandler({ actorId: 'a1', slug: 'longsword' });
    expect(variantRoll).toHaveBeenCalledWith({ createMessage: false });
    expect(result.total).toBe(24);
    expect(result.isCritical).toBe(true);
  });

  it('rolls critical strike damage', async () => {
    const result = await pf2eRollStrikeDamageHandler({ actorId: 'a1', slug: 'longsword', critical: true });
    expect(critical).toHaveBeenCalled();
    expect(result.total).toBe(24);
  });

  it('rejects a strike command in a dnd5e world', async () => {
    mockGame.system.id = 'dnd5e';
    await expect(pf2eRollStrikeHandler({ actorId: 'a1', slug: 'longsword' })).rejects.toThrow(
      "Operation 'pf2e/roll-strike' is not supported by game system 'dnd5e'"
    );
  });
});
