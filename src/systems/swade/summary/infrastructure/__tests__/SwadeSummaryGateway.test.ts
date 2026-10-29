import { SwadeSummaryGateway } from '../SwadeSummaryGateway';
import { makeActor, makeGame, makePower, makeSkill, makeWeapon } from '@/systems/swade/shared/__tests__/swadeTestFixtures';

const byActor = { actorId: 'a1', tokenId: undefined, sceneId: undefined };

describe('SwadeSummaryGateway', () => {
  it('summarizes a character: every section, penalties from the actor, weapons and powers', async () => {
    const actor = makeActor({
      name: 'Red',
      items: [makeSkill(), makeWeapon({ system: { ap: 2, range: '', shots: 0 } }), makePower()],
      statuses: ['shaken', 'stunned', 'vulnerable'],
      system: { wounds: { value: 2, max: 3, ignored: 1 }, fatigue: { value: 1, max: 2, ignored: 0 }, details: { conviction: { value: 1, active: true } } }
    });
    const summary = await new SwadeSummaryGateway(makeGame({ actors: [actor] })).getSummary(byActor);

    expect(summary).toEqual({
      actorId: 'a1',
      name: 'Red',
      type: 'character',
      wildcard: true,
      attributes: {
        agility: { die: 8, modifier: 0, wildDie: 6 },
        smarts: { die: 6, modifier: 0, wildDie: 6 },
        spirit: { die: 6, modifier: 0, wildDie: 6 },
        strength: { die: 8, modifier: 0, wildDie: 6 },
        vigor: { die: 8, modifier: 0, wildDie: 6 }
      },
      skills: [{ id: 's1', name: 'Fighting', die: 8, modifier: 0, wildDie: 6, attribute: 'agility' }],
      derived: { parry: 6, toughness: 7, armor: 2, size: 0, pace: 6, runningDie: 'd6' },
      bennies: { value: 3, max: 3 },
      wounds: { value: 2, max: 3, ignored: 1, penalty: -1 },
      fatigue: { value: 1, max: 2, penalty: -1 },
      powerPoints: { general: { value: 10, max: 15 } },
      status: {
        shaken: true,
        stunned: true,
        distracted: false,
        vulnerable: true,
        entangled: false,
        bound: false,
        incapacitated: false,
        active: ['shaken', 'stunned', 'vulnerable']
      },
      conviction: { value: 1, active: true },
      rank: 'Seasoned',
      initiative: { levelHeaded: true, improvedLevelHeaded: false, quick: false, hesitant: false },
      weapons: [
        {
          id: 'w1',
          name: 'Longsword',
          damage: '@str+d8',
          ap: 2,
          rof: 1,
          range: '',
          parry: 1,
          minStr: 'd8',
          trait: 'Fighting',
          traitMod: '',
          dmgMod: '',
          equipStatus: 4,
          shots: 0,
          currentShots: 0,
          isMelee: true,
          isHeavyWeapon: false
        }
      ],
      powers: [{ id: 'p1', name: 'Bolt', pp: 1, arcane: 'general', rank: 'Novice', range: '12', duration: 'Instant', damage: '2d6' }]
    });
    expect(actor.calcWoundPenalties).toHaveBeenCalled();
    expect(actor.calcFatiguePenalties).toHaveBeenCalled();
  });

  it('summarizes an NPC Extra as not a wild card and echoes the token', async () => {
    const goblin = makeActor({ id: 'gob', name: 'Goblin', type: 'npc', wildcard: false });
    const game = makeGame({ tokens: [{ id: 't1', name: 'Goblin', actor: goblin }] });
    const summary = await new SwadeSummaryGateway(game).getSummary({ actorId: undefined, tokenId: 't1', sceneId: undefined });
    expect(summary).toMatchObject({ actorId: 'gob', tokenId: 't1', type: 'npc', wildcard: false });
    expect(summary.attributes).toBeDefined();
  });

  it('summarizes a vehicle with its own section and without attributes, skills or bennies', async () => {
    const jeep = makeActor({ id: 'v1', name: 'Jeep', type: 'vehicle', items: [makeWeapon({ id: 'mg', name: 'MG' })] });
    const status = jeep.system.status;
    if (status) status.isOutOfControl = true;
    const summary = await new SwadeSummaryGateway(makeGame({ actors: [jeep] })).getSummary({ ...byActor, actorId: 'v1' });

    expect(summary).toMatchObject({
      type: 'vehicle',
      wildcard: false,
      vehicle: { toughness: 12, armor: 4, wounds: { value: 0, max: 3 }, handling: -1, topSpeed: { value: 60, unit: 'mph' }, outOfControl: true, wrecked: false },
      initiative: { levelHeaded: false, improvedLevelHeaded: false, quick: false, hesitant: false }
    });
    expect(summary.weapons.map((w) => w.id)).toEqual(['mg']);
    expect(summary.attributes).toBeUndefined();
    expect(summary.skills).toBeUndefined();
    expect(summary.bennies).toBeUndefined();
    expect(summary.wounds).toBeUndefined();
    expect(summary.derived).toBeUndefined();
  });

  it('summarizes a group as a minimal object', async () => {
    const party = makeActor({ id: 'g1', name: 'Party', type: 'group' });
    const summary = await new SwadeSummaryGateway(makeGame({ actors: [party] })).getSummary({ ...byActor, actorId: 'g1' });
    expect(summary).toEqual({
      actorId: 'g1',
      name: 'Party',
      type: 'group',
      wildcard: false,
      status: { shaken: false, stunned: false, distracted: false, vulnerable: false, entangled: false, bound: false, incapacitated: false, active: [] },
      weapons: [],
      powers: []
    });
  });

  it('fails on an unknown actor', async () => {
    await expect(new SwadeSummaryGateway(makeGame()).getSummary(byActor)).rejects.toThrow('Actor not found: a1');
  });
});
