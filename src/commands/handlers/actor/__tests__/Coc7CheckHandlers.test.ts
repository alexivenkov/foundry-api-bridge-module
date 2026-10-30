import { makeActor, makeSkill, makeWeapon } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';
import { installCoc7World, queueCheck, formulaTotals, uninstallCoc7World } from './coc7HandlerTestSupport';
import { coc7RollSkillHandler } from '../Coc7RollSkillHandler';
import { coc7RollCharacteristicHandler } from '../Coc7RollCharacteristicHandler';
import { coc7RollAttributeHandler } from '../Coc7RollAttributeHandler';
import { coc7RollAttackHandler } from '../Coc7RollAttackHandler';
import { coc7RollDamageHandler } from '../Coc7RollDamageHandler';

describe('coc7 check handlers', () => {
  const brawl = makeSkill({ id: 'sk-brawl', name: 'Fighting (Brawl)', skillName: 'Brawl', value: 50, push: false });
  const spot = makeSkill({ id: 'sk-spot', name: 'Spot Hidden', value: 45 });
  const knife = makeWeapon({ id: 'w-knife', name: 'Knife', skillMain: brawl, damage: '1d4', properties: { impl: true, addb: true } });
  let actor = makeActor({ items: [brawl, spot, knife] });

  beforeEach(() => {
    spot.system.flags!.developement = false;
    actor = makeActor({ items: [brawl, spot, knife] });
    const ghoul = makeActor({ id: 'g1', name: 'Ghoul', type: 'creature' });
    ghoul.system.attribs!.armor.value = '2';
    installCoc7World({ actors: [actor], tokens: [{ id: 't1', name: 'Ghoul', actor: ghoul }] });
  });

  afterEach(() => {
    uninstallCoc7World();
  });

  it('coc7/roll-skill answers the wire check result', async () => {
    queueCheck([3], 3);
    const result = await coc7RollSkillHandler({ actorId: 'a1', skill: 'spot hidden' });
    expect(result).toEqual({
      actorId: 'a1',
      kind: 'skill',
      name: 'Spot Hidden',
      threshold: 45,
      difficulty: 'regular',
      thresholds: { regular: 45, hard: 22, extreme: 9, fumbleFrom: 96 },
      dice: { tens: [{ value: 30, kept: true }], unit: 3, bonusDice: 0, penaltyDice: 0 },
      total: 33,
      successLevel: 1,
      outcome: 'regular',
      isSuccess: true,
      isCritical: false,
      isFumble: false,
      luckRequired: { regular: 0, hard: 11, extreme: 24 },
      canPush: false,
      markedForDevelopment: true
    });
    expect(spot.system.flags?.developement).toBe(true);
  });

  it('coc7/roll-characteristic rolls Idea against INT with a penalty die', async () => {
    queueCheck([2, 9], 1);
    const result = await coc7RollCharacteristicHandler({ actorId: 'a1', characteristic: 'idea', penaltyDice: 1, difficulty: 'hard' });
    expect(result).toMatchObject({ kind: 'characteristic', name: 'Idea', threshold: 80, difficulty: 'hard', total: 91, outcome: 'failure', isSuccess: false, canPush: true });
    expect(result.dice.tens).toEqual([
      { value: 20, kept: false },
      { value: 90, kept: true }
    ]);
  });

  it('coc7/roll-attribute rolls Luck for a token and echoes the token', async () => {
    queueCheck([1], 1);
    const result = await coc7RollAttributeHandler({ tokenId: 't1', attribute: 'luck' });
    expect(result).toMatchObject({ actorId: 'g1', tokenId: 't1', kind: 'attribute', name: 'Luck', threshold: 55, total: 11, outcome: 'extreme' });
  });

  it('coc7/roll-attack answers the weapon, malfunction and impale', async () => {
    queueCheck([10], 3);
    const result = await coc7RollAttackHandler({ actorId: 'a1', itemId: 'Knife' });
    expect(result).toMatchObject({
      kind: 'weapon',
      name: 'Fighting (Brawl)',
      total: 3,
      outcome: 'extreme',
      impale: true,
      isMalfunction: false,
      weapon: { id: 'w-knife', name: 'Knife', skill: { id: 'sk-brawl', value: 50 }, ranged: false, impaling: true, damage: { normal: '1d4+1d4' } }
    });
    expect(result.weapon.malfunction).toBeUndefined();
  });

  it('coc7/roll-damage rolls the formula and previews against a target', async () => {
    formulaTotals['1d4+1d4'] = 6;
    const result = await coc7RollDamageHandler({ actorId: 'a1', itemId: 'w-knife', targetTokenId: 't1' });
    expect(result).toEqual({
      actorId: 'a1',
      weapon: { id: 'w-knife', name: 'Knife' },
      range: 'normal',
      formula: '1d4+1d4',
      damageBonus: '+1d4',
      impale: false,
      maximized: false,
      dice: [{ formula: '1d6', results: [6], total: 6 }],
      total: 6,
      versusTarget: { tokenId: 't1', name: 'Ghoul', armor: 2, wouldInflict: 4 }
    });
  });

  it('reports validation errors with the field path and refuses foreign worlds', async () => {
    await expect(coc7RollSkillHandler({ actorId: 'a1', skill: '' })).rejects.toThrow(/^skill: /);
    await expect(coc7RollCharacteristicHandler({ actorId: 'a1', characteristic: 'luck' as 'str' })).rejects.toThrow(/^characteristic: /);
    await expect(coc7RollAttackHandler({ actorId: 'a1', itemId: 'Knife', bonusDice: 1, penaltyDice: 1 })).rejects.toThrow('bonusDice and penaltyDice are exclusive');
    const world = installCoc7World({ systemId: 'dnd5e', actors: [actor] });
    expect(world.system.id).toBe('dnd5e');
    await expect(coc7RollSkillHandler({ actorId: 'a1', skill: 'Spot Hidden' })).rejects.toThrow("Operation 'coc7/roll-skill' is not supported by game system 'dnd5e'");
  });
});
