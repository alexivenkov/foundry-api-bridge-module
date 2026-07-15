import { Pf2eCompendiumActorMapper } from '../Pf2eCompendiumActorMapper';
import type { Pf2eCompendiumDocument } from '../foundryCompendiumPackTypes';

const mapper = new Pf2eCompendiumActorMapper();

function makeDoc(system: Record<string, unknown>): Pf2eCompendiumDocument {
  return {
    id: 'm1',
    uuid: 'Compendium.pf2e.pathfinder-monster-core.Actor.m1',
    name: 'Zombie Shambler',
    type: 'npc',
    system
  };
}

describe('Pf2eCompendiumActorMapper', () => {
  it('maps the verified pf2e 7.x paths', () => {
    const snapshot = mapper.toSnapshot(
      makeDoc({
        details: { level: { value: 1 } },
        traits: { value: ['undead', 'mindless'], rarity: 'common', size: { value: 'med' } },
        attributes: { hp: { value: 20, max: 20 }, ac: { value: 13 } }
      }),
      'pf2e.pathfinder-monster-core'
    );

    expect(snapshot).toEqual({
      id: 'm1',
      name: 'Zombie Shambler',
      type: 'npc',
      level: 1,
      traits: ['undead', 'mindless'],
      rarity: 'common',
      size: 'med',
      hp: { current: 20, max: 20 },
      ac: 13,
      packId: 'pf2e.pathfinder-monster-core',
      uuid: 'Compendium.pf2e.pathfinder-monster-core.Actor.m1'
    });
  });

  it('supports negative creature levels', () => {
    const snapshot = mapper.toSnapshot(
      makeDoc({ details: { level: { value: -1 } } }),
      'p'
    );
    expect(snapshot.level).toBe(-1);
  });

  it('degrades missing or malformed fields to null/[]', () => {
    const snapshot = mapper.toSnapshot(makeDoc({}), 'p');
    expect(snapshot.level).toBeNull();
    expect(snapshot.traits).toEqual([]);
    expect(snapshot.rarity).toBeNull();
    expect(snapshot.size).toBeNull();
    expect(snapshot.hp).toBeNull();
    expect(snapshot.ac).toBeNull();
  });

  it('filters non-string traits and rejects non-finite numbers', () => {
    const snapshot = mapper.toSnapshot(
      makeDoc({
        details: { level: { value: Number.NaN } },
        traits: { value: ['undead', 7, null, 'zombie'] },
        attributes: { hp: { value: 20, max: '20' } }
      }),
      'p'
    );
    expect(snapshot.level).toBeNull();
    expect(snapshot.traits).toEqual(['undead', 'zombie']);
    expect(snapshot.hp).toBeNull();
  });
});
