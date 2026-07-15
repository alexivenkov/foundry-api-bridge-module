import type {
  Pf2eCompendiumActorSnapshot,
  Pf2eCompendiumItemSnapshot
} from '../snapshot';

export function makeActorSnapshot(
  overrides: Partial<Pf2eCompendiumActorSnapshot> = {}
): Pf2eCompendiumActorSnapshot {
  return {
    id: 'm1',
    name: 'Zombie Shambler',
    type: 'npc',
    level: 1,
    traits: ['undead', 'mindless', 'zombie'],
    rarity: 'common',
    size: 'med',
    hp: { current: 20, max: 20 },
    ac: 13,
    packId: 'pf2e.pathfinder-monster-core',
    uuid: 'Compendium.pf2e.pathfinder-monster-core.Actor.m1',
    ...overrides
  };
}

export function makeItemSnapshot(
  overrides: Partial<Pf2eCompendiumItemSnapshot> = {}
): Pf2eCompendiumItemSnapshot {
  return {
    id: 'f1',
    name: 'Sudden Charge',
    type: 'feat',
    level: 1,
    traits: ['fighter', 'flourish', 'open'],
    rarity: 'common',
    category: 'class',
    traditions: [],
    priceGold: null,
    packId: 'pf2e.feats-srd',
    uuid: 'Compendium.pf2e.feats-srd.Item.f1',
    ...overrides
  };
}
