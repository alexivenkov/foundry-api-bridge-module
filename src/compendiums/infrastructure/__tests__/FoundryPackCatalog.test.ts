import { FoundryPackCatalog } from '../FoundryPackCatalog';
import { makeGame, makeIndex, makePack, makePacksCollection, providerFor } from './fixtures';

describe('FoundryPackCatalog', () => {
  it('lists all packs with metadata and index size', () => {
    const pack = makePack({
      collection: 'dnd5e.spells',
      metadata: { label: 'Spells', type: 'Item', system: 'dnd5e', packageName: 'dnd5e' },
      index: makeIndex([{ _id: 'a' }, { _id: 'b' }])
    });
    const catalog = new FoundryPackCatalog(
      providerFor(makeGame({ packs: makePacksCollection([pack]) }))
    );

    expect(catalog.listPacks()).toEqual([
      {
        id: 'dnd5e.spells',
        label: 'Spells',
        type: 'Item',
        system: 'dnd5e',
        packageName: 'dnd5e',
        documentCount: 2
      }
    ]);
  });

  it('returns empty list when packs collection is undefined', () => {
    const catalog = new FoundryPackCatalog(providerFor(makeGame()));
    expect(catalog.listPacks()).toEqual([]);
  });

  it('falls back system and packageName to empty strings', () => {
    const pack = makePack({
      metadata: { label: 'L', type: 'Macro' }
    });
    const catalog = new FoundryPackCatalog(
      providerFor(makeGame({ packs: makePacksCollection([pack]) }))
    );

    const summary = catalog.listPacks()[0];
    expect(summary?.system).toBe('');
    expect(summary?.packageName).toBe('');
  });

  it('finds a pack descriptor by id', () => {
    const pack = makePack({ collection: 'pf2e.feats' });
    const catalog = new FoundryPackCatalog(
      providerFor(makeGame({ packs: makePacksCollection([pack]) }))
    );

    expect(catalog.findPack('pf2e.feats')).toEqual({
      id: 'pf2e.feats',
      label: 'Test Pack',
      type: 'Item',
      system: 'dnd5e'
    });
  });

  it('returns null for unknown pack or undefined packs collection', () => {
    const withPacks = new FoundryPackCatalog(
      providerFor(makeGame({ packs: makePacksCollection([]) }))
    );
    expect(withPacks.findPack('nope')).toBeNull();

    const withoutPacks = new FoundryPackCatalog(providerFor(makeGame()));
    expect(withoutPacks.findPack('nope')).toBeNull();
  });
});
