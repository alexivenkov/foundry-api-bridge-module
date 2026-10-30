import { Coc7SummaryGateway } from '../Coc7SummaryGateway';
import { byActor, makeActor, makeGame, makeSkill, makeSpell, makeStatus, makeWeapon } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

describe('Coc7SummaryGateway', () => {
  it('summarizes an investigator: characteristics, attributes, sorted skills, weapons with the bonus, spells, infos and Credit Rating', async () => {
    const spot = makeSkill({ id: 'sk-spot', name: 'Spot Hidden', value: 45, developement: true });
    const brawl = makeSkill({ id: 'sk-brawl', name: 'Fighting (Brawl)', skillName: 'Brawl', specialization: 'Fighting', value: 50, push: false, fighting: true, special: true });
    const credit = makeSkill({ id: 'sk-cr', name: 'Credit Rating', value: 30, cocid: 'i.skill.credit-rating', rarity: false });
    const smg = makeSkill({ id: 'sk-smg', name: 'Firearms (SMG)', skillName: 'SMG', value: 25, firearm: true });
    const knife = makeWeapon({ id: 'w-knife', name: 'Knife', skillMain: brawl, damage: '1d4', properties: { impl: true, addb: true } });
    const gun = makeWeapon({ id: 'w-gun', name: 'Thompson', skillMain: smg, skillAlternative: smg, damage: '1d10+2', range: '20', longRange: '40', usesPerRound: '1(2)', bullets: 20, ammo: 15, malfunction: 96, properties: { rngd: true, auto: true } });
    const actor = makeActor({
      items: [spot, brawl, credit, smg, knife, gun, makeStatus({ id: 'st-1', name: 'Nyctophobia' }), makeSpell({ id: 'sp-1', name: 'Elder Sign' })],
      system: { infos: { occupation: 'Antiquarian', age: '42', archetype: 'Scholar', organization: '' } }
    });
    actor.system.conditions!.prone.value = true;
    const summary = await new Coc7SummaryGateway(makeGame({ actors: [actor] })).getSummary(byActor);

    expect(summary).toMatchObject({ id: 'a1', name: 'Harvey Walters', type: 'character', creditRating: 30, infos: { occupation: 'Antiquarian', age: '42', archetype: 'Scholar' } });
    expect(summary.infos.organization).toBeUndefined();
    expect(summary.creature).toBeUndefined();
    expect(summary.vehicle).toBeUndefined();
    expect(summary.characteristics[0]).toEqual({ key: 'str', label: 'STR', value: 50, half: 25, fifth: 10 });
    expect(summary.characteristics.map((c) => c.key)).toEqual(['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu']);
    expect(summary.attributes).toEqual({
      hp: { value: 11, max: 11 },
      mp: { value: 12, max: 12 },
      sanity: { value: 60, max: 99, dailyLoss: 0, dailyLimit: 12, mythosHardened: false },
      luck: 55,
      mov: 8,
      db: '1d4',
      build: 1,
      armor: '0'
    });
    expect(summary.conditions).toMatchObject({ prone: true, dead: false });
    expect(summary.statuses).toEqual([{ id: 'st-1', name: 'Nyctophobia', phobia: true, mania: false }]);
    expect(summary.skills.map((skill) => skill.name)).toEqual(['Credit Rating', 'Fighting (Brawl)', 'Firearms (SMG)', 'Spot Hidden']);
    expect(summary.skills[1]).toEqual({ id: 'sk-brawl', name: 'Fighting (Brawl)', value: 50, half: 25, fifth: 10, base: '25', specialization: 'Fighting', push: false, fighting: true, firearm: false, special: true, rare: false, development: false });
    expect(summary.skills[3]).toMatchObject({ name: 'Spot Hidden', development: true });
    expect(summary.skills[3]?.specialization).toBeUndefined();
    expect(summary.weapons[0]).toEqual({
      id: 'w-knife',
      name: 'Knife',
      skill: { id: 'sk-brawl', name: 'Fighting (Brawl)', value: 50 },
      ranged: false,
      damage: { normal: '1d4+1d4' },
      range: { normal: '' },
      usesPerRound: '1',
      impaling: true,
      properties: ['impl', 'addb']
    });
    expect(summary.weapons[1]).toMatchObject({
      id: 'w-gun',
      skill: { id: 'sk-smg' },
      alternativeSkill: { id: 'sk-smg', value: 25 },
      ranged: true,
      damage: { normal: '1d10+2' },
      range: { normal: '20', long: '40' },
      usesPerRound: '1(2)',
      bullets: 20,
      ammo: 15,
      malfunction: 96,
      impaling: false,
      properties: ['rngd', 'auto']
    });
    expect(summary.spells).toEqual([{ id: 'sp-1', name: 'Elder Sign', costs: { hitPoints: '0', magicPoints: '5', sanity: '1d4', power: '0', others: '' } }]);
  });

  it('adds the creature section for NPCs and creatures', async () => {
    const ghoul = makeActor({ id: 'g1', name: 'Ghoul', type: 'creature' });
    const summary = await new Coc7SummaryGateway(makeGame({ actors: [ghoul] })).getSummary({ ...byActor, actorId: 'g1' });
    expect(summary.creature).toEqual({ sanLoss: { passed: '0', failed: '1d6' }, attacksPerRound: '3' });
    expect(summary.creditRating).toBeUndefined();
    expect(summary.infos).toEqual({ occupation: '', age: '' });
  });

  it('summarizes a vehicle from its stats and refuses containers', async () => {
    const car = makeActor({ id: 'v1', name: 'Ford', type: 'vehicle' });
    const chest = makeActor({ id: 'c1', name: 'Chest', type: 'container' });
    const gateway = new Coc7SummaryGateway(makeGame({ actors: [car, chest] }));
    const summary = await gateway.getSummary({ ...byActor, actorId: 'v1' });
    expect(summary).toMatchObject({ type: 'vehicle', characteristics: [], skills: [], vehicle: { hp: 30, mov: 60, build: 10, armor: 5, crew: '4', armed: false } });
    expect(summary.attributes).toBeUndefined();
    expect(summary.conditions.dead).toBe(false);
    await expect(gateway.getSummary({ ...byActor, actorId: 'c1' })).rejects.toThrow('Actor type is not supported: container');
  });
});
