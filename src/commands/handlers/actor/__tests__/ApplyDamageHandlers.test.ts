import { dnd5eApplyDamageHandler } from '../Dnd5eApplyDamageHandler';
import { dnd5eApplyHealingHandler } from '../Dnd5eApplyHealingHandler';

const hp = { value: 12, max: 20, temp: 3 };
const mockActor = {
  id: 'actor-1',
  name: 'Fighter',
  system: { attributes: { hp } },
  applyDamage: jest.fn()
};
const mockGame = {
  actors: { get: jest.fn() },
  scenes: { get: jest.fn(), active: { id: 's1', tokens: { get: jest.fn() } } },
  system: { id: 'dnd5e' }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

describe('dnd5e apply-damage / apply-healing handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hp.value = 12;
    hp.temp = 3;
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.applyDamage.mockImplementation(async (damages: Array<{ value: number; type?: string }>) => {
      const d = damages[0];
      if (!d) return;
      if (d.type === 'healing') hp.value = Math.min(hp.max, hp.value + d.value);
      else {
        const fromTemp = Math.min(hp.temp, d.value);
        hp.temp -= fromTemp;
        hp.value -= d.value - fromTemp;
      }
    });
  });

  it('applies damage and reports temp HP absorbing first', async () => {
    const result = await dnd5eApplyDamageHandler({ actorId: 'actor-1', amount: 5, type: 'fire' });

    expect(mockActor.applyDamage).toHaveBeenCalledWith([{ value: 5, type: 'fire' }]);
    expect(result).toEqual({ actorId: 'actor-1', hpBefore: 12, hpAfter: 10, tempBefore: 3, tempAfter: 0, maxHp: 20 });
  });

  it('applies healing', async () => {
    const result = await dnd5eApplyHealingHandler({ actorId: 'actor-1', amount: 6 });

    expect(mockActor.applyDamage).toHaveBeenCalledWith([{ value: 6, type: 'healing' }]);
    expect(result.hpAfter).toBe(18);
  });

  it('addresses a token', async () => {
    mockGame.scenes.active.tokens.get.mockReturnValue({ id: 'tok-2', actor: mockActor });

    const result = await dnd5eApplyDamageHandler({ tokenId: 'tok-2', amount: 1 });

    expect(result.tokenId).toBe('tok-2');
    expect(mockGame.actors.get).not.toHaveBeenCalled();
  });

  it('rejects invalid requests before touching Foundry', async () => {
    await expect(dnd5eApplyDamageHandler({ amount: 1 })).rejects.toThrow('Either actorId or tokenId is required');
    await expect(dnd5eApplyHealingHandler({ actorId: 'actor-1', amount: -2 })).rejects.toThrow(/amount/);
    expect(mockActor.applyDamage).not.toHaveBeenCalled();
  });

  it('refuses outside dnd5e', async () => {
    mockGame.system.id = 'pf2e';
    await expect(dnd5eApplyDamageHandler({ actorId: 'actor-1', amount: 1 })).rejects.toThrow(
      "Operation 'dnd5e/apply-damage' is not supported by game system 'pf2e'"
    );
    mockGame.system.id = 'dnd5e';
  });
});
