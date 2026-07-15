import { CompendiumActorRepository } from '../CompendiumActorRepository';
import { CompendiumPackNotFoundError, CompendiumPackTypeError } from '../compendiumErrors';
import { FoundryActorMapper } from '../FoundryActorMapper';
import type {
  CompendiumFilteringGameProvider,
  FoundryActorCompendiumPack,
  FoundryCompendiumActorDocument
} from '../foundryCompendiumPackTypes';

function makeDoc(
  overrides: Partial<FoundryCompendiumActorDocument> = {}
): FoundryCompendiumActorDocument {
  return {
    id: 'm1',
    uuid: 'Compendium.dnd5e.monsters.Actor.m1',
    name: 'Goblin',
    type: 'npc',
    hasPlayerOwner: false,
    folder: null,
    system: {
      details: { cr: { value: 0.25 }, type: { value: 'humanoid' } },
      traits: { size: 'sm' },
      attributes: { hp: { value: 7, max: 7 }, ac: { value: 15 } }
    },
    prototypeToken: { disposition: -1 },
    ...overrides
  };
}

function makePack(
  collection: string,
  type: string,
  docs: FoundryCompendiumActorDocument[]
): FoundryActorCompendiumPack {
  return {
    collection,
    metadata: { type },
    getDocuments: jest.fn(async () => docs)
  };
}

function providerFor(
  packs: FoundryActorCompendiumPack[] | undefined
): CompendiumFilteringGameProvider {
  return {
    getGame: () => ({
      packs:
        packs !== undefined
          ? {
              get: (id: string) => packs.find(p => p.collection === id),
              forEach: (fn: (p: FoundryActorCompendiumPack) => void) => {
                packs.forEach(fn);
              }
            }
          : undefined
    })
  };
}

function makeRepo(
  packs: FoundryActorCompendiumPack[] | undefined,
  packIds?: readonly string[]
): CompendiumActorRepository {
  return new CompendiumActorRepository(providerFor(packs), new FoundryActorMapper(), packIds);
}

describe('CompendiumActorRepository', () => {
  it('maps documents through FoundryActorMapper and enriches with packId/uuid', async () => {
    const pack = makePack('dnd5e.monsters', 'Actor', [makeDoc()]);

    const snapshots = await makeRepo([pack]).findAll();

    expect(snapshots).toHaveLength(1);
    const goblin = snapshots[0];
    expect(goblin?.packId).toBe('dnd5e.monsters');
    expect(goblin?.uuid).toBe('Compendium.dnd5e.monsters.Actor.m1');
    expect(goblin?.cr).toBe(0.25);
    expect(goblin?.size).toBe('sm');
    expect(goblin?.disposition).toBe('hostile');
  });

  describe('pack discovery (packIds omitted)', () => {
    it('collects documents from every Actor pack and skips other types', async () => {
      const monsters = makePack('dnd5e.monsters', 'Actor', [makeDoc()]);
      const heroes = makePack('dnd5e.heroes', 'Actor', [
        makeDoc({ id: 'h1', uuid: 'Compendium.dnd5e.heroes.Actor.h1', name: 'Hero' })
      ]);
      const items = makePack('dnd5e.items', 'Item', [makeDoc({ id: 'i1' })]);

      const snapshots = await makeRepo([monsters, heroes, items]).findAll();

      expect(snapshots.map(s => s.packId)).toEqual(['dnd5e.monsters', 'dnd5e.heroes']);
      expect(items.getDocuments).not.toHaveBeenCalled();
    });

    it('returns empty list when there are no packs', async () => {
      expect(await makeRepo([]).findAll()).toEqual([]);
      expect(await makeRepo(undefined).findAll()).toEqual([]);
    });
  });

  describe('explicit packIds', () => {
    it('reads only the requested packs in the requested order', async () => {
      const a = makePack('a.pack', 'Actor', [makeDoc({ id: 'a1' })]);
      const b = makePack('b.pack', 'Actor', [makeDoc({ id: 'b1' })]);

      const snapshots = await makeRepo([a, b], ['b.pack']).findAll();

      expect(snapshots.map(s => s.id)).toEqual(['b1']);
      expect(a.getDocuments).not.toHaveBeenCalled();
    });

    it('throws for an unknown pack', async () => {
      await expect(makeRepo([], ['ghost.pack']).findAll()).rejects.toThrow(
        CompendiumPackNotFoundError
      );
      await expect(makeRepo([], ['ghost.pack']).findAll()).rejects.toThrow(
        'Pack not found: ghost.pack'
      );
    });

    it('throws for a pack of the wrong type', async () => {
      const items = makePack('dnd5e.items', 'Item', []);
      await expect(makeRepo([items], ['dnd5e.items']).findAll()).rejects.toThrow(
        CompendiumPackTypeError
      );
      await expect(makeRepo([items], ['dnd5e.items']).findAll()).rejects.toThrow(
        'Compendium pack is not an Actor pack: dnd5e.items'
      );
    });

    it('returns empty list for an explicitly empty packIds array', async () => {
      const pack = makePack('dnd5e.monsters', 'Actor', [makeDoc()]);
      expect(await makeRepo([pack], []).findAll()).toEqual([]);
      expect(pack.getDocuments).not.toHaveBeenCalled();
    });
  });
});
