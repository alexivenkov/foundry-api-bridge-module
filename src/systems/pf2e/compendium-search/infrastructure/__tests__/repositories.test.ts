import { Pf2eCompendiumActorMapper } from '../Pf2eCompendiumActorMapper';
import { Pf2eCompendiumActorRepository } from '../Pf2eCompendiumActorRepository';
import { Pf2eCompendiumItemMapper } from '../Pf2eCompendiumItemMapper';
import { Pf2eCompendiumItemRepository } from '../Pf2eCompendiumItemRepository';
import {
  Pf2eCompendiumPackNotFoundError,
  Pf2eCompendiumPackTypeError
} from '../compendiumErrors';
import type {
  Pf2eCompendiumDocument,
  Pf2eCompendiumGameProvider,
  Pf2eCompendiumPack
} from '../foundryCompendiumPackTypes';

function makeDoc(id: string, type = 'npc'): Pf2eCompendiumDocument {
  return {
    id,
    uuid: `Compendium.p.${id}`,
    name: id,
    type,
    system: { details: { level: { value: 2 } } }
  };
}

function makePack(
  collection: string,
  type: string,
  docs: Pf2eCompendiumDocument[]
): Pf2eCompendiumPack {
  return { collection, metadata: { type }, getDocuments: jest.fn(async () => docs) };
}

function providerFor(
  packs: Pf2eCompendiumPack[] | undefined
): Pf2eCompendiumGameProvider {
  return {
    getGame: () => ({
      packs:
        packs !== undefined
          ? {
              get: (id: string) => packs.find(p => p.collection === id),
              forEach: (fn: (p: Pf2eCompendiumPack) => void) => {
                packs.forEach(fn);
              }
            }
          : undefined
    })
  };
}

describe('Pf2eCompendiumActorRepository', () => {
  it('discovers Actor packs, maps snapshots, and enriches with packId/uuid', async () => {
    const bestiary = makePack('pf2e.monsters', 'Actor', [makeDoc('m1')]);
    const equipment = makePack('pf2e.equipment', 'Item', [makeDoc('i1', 'weapon')]);
    const repo = new Pf2eCompendiumActorRepository(
      providerFor([bestiary, equipment]),
      new Pf2eCompendiumActorMapper()
    );

    const snapshots = await repo.findAll();

    expect(snapshots.map(s => s.id)).toEqual(['m1']);
    expect(snapshots[0]?.packId).toBe('pf2e.monsters');
    expect(snapshots[0]?.level).toBe(2);
    expect(equipment.getDocuments).not.toHaveBeenCalled();
  });

  it('resolves explicit packIds loudly', async () => {
    const bestiary = makePack('pf2e.monsters', 'Actor', [makeDoc('m1')]);
    const equipment = makePack('pf2e.equipment', 'Item', []);

    const scoped = new Pf2eCompendiumActorRepository(
      providerFor([bestiary, equipment]),
      new Pf2eCompendiumActorMapper(),
      ['pf2e.monsters']
    );
    expect((await scoped.findAll()).map(s => s.id)).toEqual(['m1']);

    const ghost = new Pf2eCompendiumActorRepository(
      providerFor([]),
      new Pf2eCompendiumActorMapper(),
      ['ghost']
    );
    await expect(ghost.findAll()).rejects.toThrow(Pf2eCompendiumPackNotFoundError);
    await expect(ghost.findAll()).rejects.toThrow('Pack not found: ghost');

    const wrongType = new Pf2eCompendiumActorRepository(
      providerFor([equipment]),
      new Pf2eCompendiumActorMapper(),
      ['pf2e.equipment']
    );
    await expect(wrongType.findAll()).rejects.toThrow(Pf2eCompendiumPackTypeError);
    await expect(wrongType.findAll()).rejects.toThrow(
      'Compendium pack is not an Actor pack: pf2e.equipment'
    );
  });

  it('handles undefined packs collection and empty explicit list', async () => {
    const mapper = new Pf2eCompendiumActorMapper();
    expect(
      await new Pf2eCompendiumActorRepository(providerFor(undefined), mapper).findAll()
    ).toEqual([]);
    const pack = makePack('pf2e.monsters', 'Actor', [makeDoc('m1')]);
    expect(
      await new Pf2eCompendiumActorRepository(providerFor([pack]), mapper, []).findAll()
    ).toEqual([]);
  });
});

describe('Pf2eCompendiumItemRepository', () => {
  it('discovers Item packs and requires the Item type for explicit ids', async () => {
    const feats = makePack('pf2e.feats', 'Item', [makeDoc('f1', 'feat')]);
    const bestiary = makePack('pf2e.monsters', 'Actor', []);

    const repo = new Pf2eCompendiumItemRepository(
      providerFor([feats, bestiary]),
      new Pf2eCompendiumItemMapper()
    );
    expect((await repo.findAll()).map(s => s.id)).toEqual(['f1']);

    const wrongType = new Pf2eCompendiumItemRepository(
      providerFor([bestiary]),
      new Pf2eCompendiumItemMapper(),
      ['pf2e.monsters']
    );
    await expect(wrongType.findAll()).rejects.toThrow(
      'Compendium pack is not an Item pack: pf2e.monsters'
    );
  });
});
