import { Pf1SummaryGateway } from '../Pf1SummaryGateway';
import { byActor, makeActor, makeGame, makeItem, makeRegistry } from '@/systems/pf1/shared/__tests__/pf1TestFixtures';

describe('Pf1SummaryGateway', () => {
  it('answers the normalized sheet of a character', async () => {
    const items = [
      makeItem({ id: 'c1', name: 'Cleric', type: 'class', system: { level: 3 } }),
      makeItem({ id: 'w1', name: 'Mace', type: 'weapon', system: { actions: [{ _id: 'a1', name: 'Attack' }] } }),
      makeItem({ id: 'l1', name: 'Rope', type: 'loot', system: {} }),
      makeItem({ id: 's1', name: 'Bless', type: 'spell', system: { level: 1, spellbook: 'primary', preparation: { value: 1, max: 2 }, actions: [{ _id: 'x', name: 'Cast' }] } }),
      makeItem({ id: 'b1', name: 'Rage', type: 'buff', system: { active: true, level: 3 } }),
      makeItem({ id: 'b2', name: 'Haste', type: 'buff', system: { active: false } })
    ];
    const actor = makeActor({ items, statuses: ['shaken'] });

    const summary = await new Pf1SummaryGateway(makeGame({ actors: [actor] }), makeRegistry()).getSummary(byActor);

    expect(summary).toEqual({
      actorId: 'a1',
      name: 'Valeros',
      type: 'character',
      level: 3,
      cr: null,
      alignment: 'lg',
      abilities: {
        str: { total: 16, mod: 3, damage: 0, drain: 0 },
        dex: { total: 14, mod: 2, damage: 0, drain: 0 },
        con: { total: 12, mod: 1, damage: 0, drain: 0 },
        int: { total: 10, mod: 0, damage: 2, drain: 0 },
        wis: { total: 13, mod: 1, damage: 0, drain: 0 },
        cha: { total: 8, mod: -1, damage: 0, drain: 0 }
      },
      health: { hp: { value: 20, max: 28, temp: 0, nonlethal: 0 } },
      ac: { normal: 18, touch: 12, flatFooted: 16 },
      cmb: 6,
      cmd: 19,
      cmdFlatFooted: 17,
      bab: 3,
      initiative: 2,
      sr: 0,
      saves: { fort: 5, ref: 3, will: 2 },
      speed: { land: 30 },
      conditions: ['shaken'],
      classes: [{ id: 'c1', name: 'Cleric', level: 3 }],
      skills: [
        { id: 'acr', name: 'Acrobatics', mod: 4, rank: 1, classSkill: true, trainedOnly: false },
        { id: 'per', name: 'Perception', mod: 7, rank: 3, classSkill: true, trainedOnly: false },
        { id: 'crf', name: 'Craft', mod: 0, rank: 0, classSkill: true, trainedOnly: false },
        { id: 'crf.alchemy', name: 'Craft (Alchemy)', mod: 5, rank: 2, classSkill: true, trainedOnly: false }
      ],
      spellbooks: [{ id: 'primary', name: 'Cleric', class: 'cleric', casterLevel: 3, concentration: 5 }],
      spells: [{ id: 's1', name: 'Bless', level: 1, spellbook: 'primary', prepared: 1, preparedMax: 2 }],
      usableItems: [{ id: 'w1', name: 'Mace', type: 'weapon', actions: [{ id: 'a1', name: 'Attack' }] }],
      activeBuffs: [{ id: 'b1', name: 'Rage', level: 3 }]
    });
  });

  it('answers nulls and empty lists for an actor type without a full sheet', async () => {
    // Traps keep their CR at `system.cr`, not under `details`.
    const trap = makeActor({ name: 'Pit', type: 'trap', system: { cr: { total: 2 } } });
    const summary = await new Pf1SummaryGateway(makeGame({ tokens: [{ id: 't1', name: 'Pit', actor: trap }] }), undefined).getSummary({
      actorId: undefined,
      tokenId: 't1',
      sceneId: undefined
    });
    expect(summary).toMatchObject({
      tokenId: 't1',
      cr: 2,
      level: null,
      alignment: null,
      abilities: {},
      health: null,
      ac: { normal: null, touch: null, flatFooted: null },
      saves: {},
      speed: {},
      conditions: [],
      skills: [],
      spellbooks: []
    });
  });
});
