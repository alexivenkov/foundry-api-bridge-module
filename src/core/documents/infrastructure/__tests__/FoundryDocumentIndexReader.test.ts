import type { DocumentSearchQuery } from '../../domain';
import { FoundryDocumentIndexReader } from '../FoundryDocumentIndexReader';
import type { FoundryDocumentIndex, FoundryDocumentIndexLookupOptions, FoundryWordTreeEntry } from '../foundryDocumentTypes';
import { fakeDocument, fakeGlobals } from './fakeFoundry';

const goblin = fakeDocument({ uuid: 'Actor.gob', documentName: 'Actor', name: 'Goblin Boss', source: { folder: 'fMonsters', type: 'npc' } });
const hero = fakeDocument({ uuid: 'Actor.hero', documentName: 'Actor', name: 'Hero' });
const goblinSword = fakeDocument({ uuid: 'Actor.hero.Item.gs', documentName: 'Item', name: 'Goblin Sword', parent: hero });

// World entries carry the live document (`_addLeaf(doc)`); pack entries the index entry, and on Foundry 13 the legacy
// `Compendium.<pack>.<id>` uuid (`client/helpers/document-index.mjs`).
const worldEntry: FoundryWordTreeEntry = {
  entry: Object.assign(goblin, { type: 'npc', folder: { id: 'fMonsters' } }),
  documentName: 'Actor',
  uuid: 'Actor.gob'
};
const embeddedEntry: FoundryWordTreeEntry = { entry: goblinSword, documentName: 'Item', uuid: 'Actor.hero.Item.gs' };
const packEntryV13: FoundryWordTreeEntry = {
  entry: { _id: 'pk1', name: 'Goblin', type: 'npc', folder: 'packFolder' },
  documentName: 'Actor',
  uuid: 'Compendium.dnd5e.monsters.pk1',
  pack: 'dnd5e.monsters'
};

class FakeIndex implements FoundryDocumentIndex {
  readonly calls: Array<{ query: string; options: FoundryDocumentIndexLookupOptions }> = [];
  ready: Promise<void> | null = null;

  constructor(private readonly entries: Record<string, FoundryWordTreeEntry[]>) {}

  lookup(query: string, options: FoundryDocumentIndexLookupOptions): Record<string, FoundryWordTreeEntry[]> {
    this.calls.push({ query, options });
    const types = options.documentTypes.length > 0 ? options.documentTypes : Object.keys(this.entries);
    const filter = options.filterEntries ?? ((): boolean => true);
    return Object.fromEntries(types.map((type) => [type, (this.entries[type] ?? []).filter(filter).slice(0, options.limit)]));
  }
}

const query = (overrides: Partial<DocumentSearchQuery> = {}): DocumentSearchQuery => ({
  query: 'gob',
  documentTypes: [],
  source: 'all',
  limit: 10,
  ...overrides
});

describe('FoundryDocumentIndexReader', () => {
  it('maps world, embedded and compendium matches, with the canonical compendium uuid', async () => {
    const index = new FakeIndex({ Actor: [worldEntry, packEntryV13], Item: [embeddedEntry] });
    const reader = new FoundryDocumentIndexReader(() => fakeGlobals({ documentIndex: index }));

    const hits = await reader.search(query());

    expect(hits).toEqual([
      {
        uuid: 'Actor.gob',
        id: 'gob',
        name: 'Goblin Boss',
        documentType: 'Actor',
        subtype: 'npc',
        packId: null,
        folderId: 'fMonsters',
        parentUuid: null
      },
      {
        uuid: 'Compendium.dnd5e.monsters.Actor.pk1',
        id: 'pk1',
        name: 'Goblin',
        documentType: 'Actor',
        subtype: 'npc',
        packId: 'dnd5e.monsters',
        folderId: 'packFolder',
        parentUuid: null
      },
      {
        uuid: 'Actor.hero.Item.gs',
        id: 'gs',
        name: 'Goblin Sword',
        documentType: 'Item',
        subtype: null,
        packId: null,
        folderId: null,
        parentUuid: 'Actor.hero'
      }
    ]);
  });

  it('passes the query, types and per-type limit to DocumentIndex#lookup', async () => {
    const index = new FakeIndex({ Actor: [worldEntry] });
    const reader = new FoundryDocumentIndexReader(() => fakeGlobals({ documentIndex: index }));

    await reader.search(query({ query: 'goblin boss', documentTypes: ['Actor', 'Item'], limit: 5 }));

    expect(index.calls[0]?.query).toBe('goblin boss');
    expect(index.calls[0]?.options.documentTypes).toEqual(['Actor', 'Item']);
    expect(index.calls[0]?.options.limit).toBe(5);
    expect(index.calls[0]?.options.filterEntries).toBeUndefined();
  });

  it('filters by source inside the lookup, so the limit counts only matching entries', async () => {
    const index = new FakeIndex({ Actor: [worldEntry, packEntryV13] });
    const reader = new FoundryDocumentIndexReader(() => fakeGlobals({ documentIndex: index }));

    await expect(reader.search(query({ source: 'compendiums', limit: 1 }))).resolves.toMatchObject([{ packId: 'dnd5e.monsters' }]);
    await expect(reader.search(query({ source: 'world', limit: 1 }))).resolves.toMatchObject([{ uuid: 'Actor.gob' }]);
  });

  it('waits for the index to finish building', async () => {
    const index = new FakeIndex({ Actor: [worldEntry] });
    let built = false;
    index.ready = new Promise<void>((resolve) => {
      setTimeout(() => {
        built = true;
        resolve();
      }, 0);
    });
    const lookup = jest.spyOn(index, 'lookup');
    lookup.mockImplementation((...args) => {
      expect(built).toBe(true);
      return FakeIndex.prototype.lookup.apply(index, args);
    });

    await new FoundryDocumentIndexReader(() => fakeGlobals({ documentIndex: index })).search(query());

    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it('is unavailable without game.documentIndex', () => {
    expect(new FoundryDocumentIndexReader(() => fakeGlobals()).isAvailable()).toBe(false);
    expect(new FoundryDocumentIndexReader(() => fakeGlobals({ documentIndex: new FakeIndex({}) })).isAvailable()).toBe(true);
  });

  it('skips an entry without an id', async () => {
    const broken: FoundryWordTreeEntry = { entry: { name: 'No id' }, documentName: 'Actor', uuid: 'Actor.' };
    const reader = new FoundryDocumentIndexReader(() => fakeGlobals({ documentIndex: new FakeIndex({ Actor: [broken] }) }));

    await expect(reader.search(query())).resolves.toEqual([]);
  });
});
