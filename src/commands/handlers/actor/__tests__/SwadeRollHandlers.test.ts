import { makeActor, makeSkill, makeTraitRoll, makeWeapon } from '@/systems/swade/shared/__tests__/swadeTestFixtures';

const mockGame = {
  system: { id: 'swade' },
  actors: { get: jest.fn() },
  scenes: { get: jest.fn(), active: { id: 's1', tokens: { get: jest.fn() } } },
  settings: { get: jest.fn() },
  swade: { dice: {} }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

import { swadeRollAttributeHandler } from '../SwadeRollAttributeHandler';
import { swadeRollSkillHandler } from '../SwadeRollSkillHandler';
import { swadeRollAttackHandler } from '../SwadeRollAttackHandler';
import { swadeRollDamageHandler } from '../SwadeRollDamageHandler';

describe('SWADE roll handlers (swade world)', () => {
  const skill = makeSkill({ id: 'sk-fight', name: 'Fighting' });
  const weapon = makeWeapon();
  let actor = makeActor({ items: [skill, weapon] });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.system.id = 'swade';
    actor = makeActor({ items: [skill, weapon], roll: makeTraitRoll({ dice: [{ faces: 8, results: [8, 2] }, { faces: 6, results: [1], wild: true }] }) });
    mockGame.actors.get.mockImplementation((id: string) => (id === 'a1' ? actor : undefined));
    mockGame.scenes.active.tokens.get.mockReturnValue(undefined);
  });

  it('swade/roll-attribute returns the full trait roll result', async () => {
    const result = await swadeRollAttributeHandler({ actorId: 'a1', attribute: 'vigor', modifier: 1 });

    expect(actor.rollAttribute).toHaveBeenCalledWith('vigor', expect.objectContaining({ suppressChat: true, additionalMods: [{ label: 'Modifier', value: 1 }] }));
    expect(result).toMatchObject({ actorId: 'a1', trait: 'vigor', total: 10, successes: 2, outcome: 'raise', raises: 1, isCritical: true, isFumble: false, wildDie: true, targetNumber: 4 });
    expect(result.dice).toEqual([
      { type: 'd8', results: [8, 2], total: 10, wild: false, kept: true },
      { type: 'd6', results: [1], total: 1, wild: true, kept: false }
    ]);
  });

  it('swade/roll-skill resolves by name and reports the skill as the trait', async () => {
    const result = await swadeRollSkillHandler({ actorId: 'a1', skill: 'fighting', targetNumber: 6 });
    expect(actor.rollSkill).toHaveBeenCalledWith('sk-fight', expect.anything());
    expect(result).toMatchObject({ trait: 'Fighting', targetNumber: 6, successes: 2 });
  });

  it('swade/roll-attack returns weapon, hit and the melee target parry', async () => {
    const goblin = makeActor({ id: 'gob', type: 'npc', system: { stats: { toughness: { value: 5, armor: 0 }, parry: { value: 7 }, size: 0 } } });
    mockGame.scenes.active.tokens.get.mockImplementation((id: string) => (id === 't-gob' ? { id: 't-gob', name: 'Goblin', actor: goblin } : undefined));

    const result = await swadeRollAttackHandler({ actorId: 'a1', itemId: 'w1', targetTokenId: 't-gob' });

    expect(actor.rollSkill).toHaveBeenCalledWith('sk-fight', expect.objectContaining({ item: weapon }));
    expect(result).toMatchObject({ trait: 'Fighting', targetNumber: 7, hit: true, weapon: { id: 'w1', name: 'Longsword', isMelee: true }, target: { tokenId: 't-gob', actorId: 'gob', parry: 7 } });
  });

  it('swade/roll-damage returns the damage result with neutral flags off', async () => {
    const result = await swadeRollDamageHandler({ actorId: 'a1', itemId: 'w1', raise: true });
    expect(weapon.rollDamage).toHaveBeenCalledWith(expect.objectContaining({ suppressChat: true, additionalMods: [{ label: 'Raise', value: '+1d6x' }] }));
    expect(result).toMatchObject({ actorId: 'a1', weapon: { id: 'w1', name: 'Longsword' }, total: 10, raiseDamageIncluded: true, isCritical: false, isFumble: false, ap: 0 });
  });

  it('reports validation errors through formatZodError', async () => {
    await expect(swadeRollAttributeHandler({ attribute: 'vigor' })).rejects.toThrow('Either actorId or tokenId is required');
    await expect(swadeRollAttributeHandler({ actorId: 'a1', attribute: 'luck' as 'vigor' })).rejects.toThrow('attribute');
    await expect(swadeRollSkillHandler({ actorId: 'a1', skill: 'Stealth' })).rejects.toThrow('Skill not found: Stealth');
    await expect(swadeRollAttackHandler({ actorId: 'a1', itemId: 'sk-fight' })).rejects.toThrow('Item is not a weapon: sk-fight');
  });

  describe('system mismatch guard', () => {
    it.each([
      ['swade/roll-attribute', (): Promise<unknown> => swadeRollAttributeHandler({ actorId: 'a1', attribute: 'vigor' })],
      ['swade/roll-skill', (): Promise<unknown> => swadeRollSkillHandler({ actorId: 'a1', skill: 'Fighting' })],
      ['swade/roll-attack', (): Promise<unknown> => swadeRollAttackHandler({ actorId: 'a1', itemId: 'w1' })],
      ['swade/roll-damage', (): Promise<unknown> => swadeRollDamageHandler({ actorId: 'a1', itemId: 'w1' })]
    ])('%s rejects in a dnd5e world', async (operation, invoke) => {
      mockGame.system.id = 'dnd5e';
      await expect(invoke()).rejects.toThrow(`Operation '${operation}' is not supported by game system 'dnd5e'`);
    });
  });
});
