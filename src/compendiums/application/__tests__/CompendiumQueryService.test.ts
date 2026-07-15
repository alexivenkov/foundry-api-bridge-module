import { PackNotFoundError } from '../../domain';
import { CompendiumQueryService } from '../CompendiumQueryService';
import {
  FakeCatalog,
  FakeDocumentReader,
  FakeIndexReader,
  FakeScanner,
  FakeSearchEngine,
  descriptor,
  entry,
  summary
} from './fakePorts';

function makeService(overrides: Partial<ConstructorParameters<typeof CompendiumQueryService>[0]> = {}): CompendiumQueryService {
  return new CompendiumQueryService({
    catalog: new FakeCatalog([descriptor()], [summary()]),
    indexReader: new FakeIndexReader(),
    indexScanner: new FakeScanner([]),
    searchEngine: new FakeSearchEngine(),
    documentReader: new FakeDocumentReader(),
    ...overrides
  });
}

describe('CompendiumQueryService', () => {
  describe('listPacks', () => {
    it('returns catalog summaries as-is', () => {
      expect(makeService().listPacks()).toEqual([summary()]);
    });
  });

  describe('getPackContents', () => {
    it('returns pack descriptor with loaded documents and their count', async () => {
      const documentReader = new FakeDocumentReader();
      documentReader.views = [
        { id: 'd1', uuid: 'u1', name: 'Doc', type: 'weapon', img: '' }
      ];
      const service = makeService({ documentReader });

      const result = await service.getPackContents({ packId: 'p1' });
      expect(result.pack).toEqual(descriptor());
      expect(result.documentCount).toBe(1);
      expect(result.documents).toHaveLength(1);
    });

    it('throws PackNotFoundError for unknown pack', async () => {
      await expect(makeService().getPackContents({ packId: 'nope' })).rejects.toThrow(
        PackNotFoundError
      );
    });

    it('passes the contents filter through to the reader', async () => {
      const documentReader = new FakeDocumentReader();
      const spy = jest.spyOn(documentReader, 'readAllDocumentViews');
      const service = makeService({ documentReader });

      await service.getPackContents({
        packId: 'p1',
        filter: { types: ['spell'], ids: ['a'] }
      });

      expect(spy).toHaveBeenCalledWith('p1', { types: ['spell'], ids: ['a'] });
    });
  });

  describe('getIndex', () => {
    it('returns descriptor, total, and mapped entries', async () => {
      const indexReader = new FakeIndexReader([entry(), entry({ id: 'e2' })]);
      const service = makeService({ indexReader });

      const result = await service.getIndex({ packId: 'p1', fields: ['system.level'] });
      expect(result.pack.id).toBe('p1');
      expect(result.total).toBe(2);
      expect(indexReader.calls).toEqual([{ packId: 'p1', fields: ['system.level'] }]);
    });

    it('throws PackNotFoundError before touching the reader', async () => {
      const indexReader = new FakeIndexReader();
      const service = makeService({ indexReader });

      await expect(service.getIndex({ packId: 'nope' })).rejects.toThrow(
        'Pack not found: nope'
      );
      expect(indexReader.calls).toHaveLength(0);
    });
  });

  describe('searchInPack', () => {
    const tenEntries = Array.from({ length: 10 }, (_v, i) => entry({ id: `e${String(i)}` }));

    it('paginates with resolved limit and offset', async () => {
      const service = makeService({ searchEngine: new FakeSearchEngine(tenEntries) });

      const result = await service.searchInPack({
        packId: 'p1',
        criteria: {},
        limit: 3,
        offset: 8
      });

      expect(result.total).toBe(10);
      expect(result.results.map(r => r.id)).toEqual(['e8', 'e9']);
      expect(result.hasMore).toBe(false);
    });

    it('applies the default limit of 50 and reports hasMore', async () => {
      const many = Array.from({ length: 60 }, (_v, i) => entry({ id: `x${String(i)}` }));
      const service = makeService({ searchEngine: new FakeSearchEngine(many) });

      const result = await service.searchInPack({ packId: 'p1', criteria: {} });
      expect(result.results).toHaveLength(50);
      expect(result.hasMore).toBe(true);
    });

    it('treats limit below 1 as default and caps at 500', async () => {
      const service = makeService({ searchEngine: new FakeSearchEngine(tenEntries) });
      const low = await service.searchInPack({ packId: 'p1', criteria: {}, limit: 0 });
      expect(low.results).toHaveLength(10);

      const capped = await service.searchInPack({ packId: 'p1', criteria: {}, limit: 9999 });
      expect(capped.results).toHaveLength(10);
    });

    it('propagates PackNotFoundError from the engine', async () => {
      const service = makeService({ searchEngine: new FakeSearchEngine() });
      await expect(
        service.searchInPack({ packId: 'missing', criteria: {} })
      ).rejects.toThrow(PackNotFoundError);
    });
  });

  describe('searchAcrossPacks', () => {
    const scanner = (): FakeScanner =>
      new FakeScanner([
        {
          descriptor: descriptor({ id: 'a.pack', label: 'A', type: 'Actor', system: 'dnd5e' }),
          entries: [
            entry({ id: 'm1', name: 'Goblin', type: 'npc' }),
            entry({ id: 'm2', name: 'Hobgoblin', type: '' })
          ]
        },
        {
          descriptor: descriptor({ id: 'i.pack', label: 'I', type: 'Item', system: 'pf2e' }),
          entries: [entry({ id: 'w1', name: 'Goblin Cutter' })]
        }
      ]);

    it('matches by name substring across packs and maps pack metadata', async () => {
      const service = makeService({ indexScanner: scanner() });

      const results = await service.searchAcrossPacks({ query: 'goblin' });
      expect(results).toEqual([
        {
          packId: 'a.pack',
          packLabel: 'A',
          packType: 'Actor',
          system: 'dnd5e',
          id: 'm1',
          name: 'Goblin',
          documentType: 'npc'
        },
        {
          packId: 'a.pack',
          packLabel: 'A',
          packType: 'Actor',
          system: 'dnd5e',
          id: 'm2',
          name: 'Hobgoblin'
        },
        {
          packId: 'i.pack',
          packLabel: 'I',
          packType: 'Item',
          system: 'pf2e',
          id: 'w1',
          name: 'Goblin Cutter'
        }
      ]);
    });

    it('returns [] for blank query without scanning any indexes', async () => {
      const fakeScanner = scanner();
      const service = makeService({ indexScanner: fakeScanner });

      expect(await service.searchAcrossPacks({ query: '   ' })).toEqual([]);
      expect(fakeScanner.readCounts.size).toBe(0);
    });

    it('filters by pack type and system without reading filtered indexes', async () => {
      const fakeScanner = scanner();
      const service = makeService({ indexScanner: fakeScanner });

      const results = await service.searchAcrossPacks({ query: 'goblin', type: 'Item' });
      expect(results.map(r => r.packId)).toEqual(['i.pack']);
      expect(fakeScanner.readCounts.has('a.pack')).toBe(false);

      const bySystem = await service.searchAcrossPacks({ query: 'goblin', system: 'dnd5e' });
      expect(bySystem.map(r => r.packId)).toEqual(['a.pack', 'a.pack']);
    });

    it('caps results at the limit and stops scanning further packs', async () => {
      const fakeScanner = scanner();
      const service = makeService({ indexScanner: fakeScanner });

      const results = await service.searchAcrossPacks({ query: 'goblin', limit: 2 });
      expect(results).toHaveLength(2);
      expect(fakeScanner.readCounts.has('i.pack')).toBe(false);
    });

    it('skips entries without an id', async () => {
      const fakeScanner = new FakeScanner([
        {
          descriptor: descriptor({ id: 'p' }),
          entries: [entry({ id: '', name: 'Goblin' }), entry({ id: 'ok', name: 'Goblin' })]
        }
      ]);
      const service = makeService({ indexScanner: fakeScanner });

      const results = await service.searchAcrossPacks({ query: 'goblin' });
      expect(results.map(r => r.id)).toEqual(['ok']);
    });
  });

  describe('getDocument', () => {
    it('returns the record with pack-level documentType', async () => {
      const documentReader = new FakeDocumentReader();
      documentReader.record = {
        id: 'd1',
        uuid: 'u1',
        name: 'Doc',
        type: 'weapon',
        img: null,
        data: { name: 'Doc' }
      };
      const service = makeService({ documentReader });

      const result = await service.getDocument({ packId: 'p1', documentId: 'd1' });
      expect(result.documentType).toBe('Item');
      expect(result.record.id).toBe('d1');
    });

    it('throws PackNotFoundError for unknown pack', async () => {
      await expect(
        makeService().getDocument({ packId: 'nope', documentId: 'd1' })
      ).rejects.toThrow(PackNotFoundError);
    });
  });
});
