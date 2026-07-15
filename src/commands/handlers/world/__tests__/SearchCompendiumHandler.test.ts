import { searchCompendiumHandler } from '../SearchCompendiumHandler';

interface MockIndexEntry {
  _id: string;
  name: string;
  img?: string;
  type?: string;
  [path: string]: unknown;
}

interface MockPack {
  collection: string;
  metadata: { label: string; type: string; system?: string; packageName?: string };
  index: {
    size: number;
    contents: MockIndexEntry[];
    get(id: string): MockIndexEntry | undefined;
    forEach(fn: (entry: MockIndexEntry) => void): void;
  };
  getIndex: jest.Mock;
  search: jest.Mock;
}

function createIndex(entries: MockIndexEntry[]): MockPack['index'] {
  return {
    size: entries.length,
    contents: entries,
    get: (id: string): MockIndexEntry | undefined => entries.find(e => e._id === id),
    forEach: (fn: (entry: MockIndexEntry) => void): void => entries.forEach(fn)
  };
}

function createMockPack(entries: MockIndexEntry[], searchResult: unknown, overrides?: Partial<MockPack>): MockPack {
  const idx = createIndex(entries);
  return {
    collection: 'dnd5e.spells',
    metadata: { label: 'Spells', type: 'Item', system: 'dnd5e', packageName: 'dnd5e' },
    index: idx,
    getIndex: jest.fn().mockResolvedValue(idx),
    search: jest.fn().mockReturnValue(searchResult),
    ...overrides
  };
}

function setGame(packs: Map<string, MockPack> | undefined): void {
  (globalThis as Record<string, unknown>)['game'] = packs !== undefined
    ? { packs: { get: (id: string): MockPack | undefined => packs.get(id) } }
    : { packs: undefined };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('searchCompendiumHandler', () => {
  afterEach(clearGame);

  it('returns matched entries for query (array search result)', async () => {
    const all: MockIndexEntry[] = [
      { _id: 'a', name: 'Fireball', type: 'spell', img: 'a.webp' },
      { _id: 'b', name: 'Fire Bolt', type: 'spell', img: 'b.webp' },
      { _id: 'c', name: 'Magic Missile', type: 'spell', img: 'c.webp' }
    ];
    const matched: MockIndexEntry[] = [all[0]!, all[1]!];
    const pack = createMockPack(all, matched);
    setGame(new Map([['dnd5e.spells', pack]]));

    const result = await searchCompendiumHandler({ packId: 'dnd5e.spells', query: 'fire' });

    expect(pack.search).toHaveBeenCalledWith({ query: 'fire' });
    expect(result.packId).toBe('dnd5e.spells');
    expect(result.results).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.hasMore).toBe(false);
    expect(result.results[0]?.name).toBe('Fireball');
    expect(result.results[1]?.name).toBe('Fire Bolt');
  });

  it('normalizes Set<string> search result via pack.index.get', async () => {
    const all: MockIndexEntry[] = [
      { _id: 'a', name: 'Fireball', type: 'spell', img: 'a.webp' },
      { _id: 'b', name: 'Magic Missile', type: 'spell', img: 'b.webp' }
    ];
    const matched = new Set<string>(['a']);
    const pack = createMockPack(all, matched);
    setGame(new Map([['p1', pack]]));

    const result = await searchCompendiumHandler({ packId: 'p1', query: 'fireball' });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.id).toBe('a');
    expect(result.results[0]?.name).toBe('Fireball');
  });

  // Foundry's SearchFilter matches on the lowercase OPERATORS *values*
  // ('equals', 'gt', ...) — wire operators must be translated, not passed raw.
  it('passes filters with the default operator translated to foundry "equals"', async () => {
    const all: MockIndexEntry[] = [{ _id: 'a', name: 'Fireball', type: 'spell', img: 'a.webp' }];
    const pack = createMockPack(all, all);
    setGame(new Map([['p1', pack]]));

    await searchCompendiumHandler({
      packId: 'p1',
      filters: [{ field: 'system.level', value: 3 }]
    });

    expect(pack.search).toHaveBeenCalledWith({
      filters: [{ field: 'system.level', operator: 'equals', value: 3, negate: false }]
    });
  });

  it('translates custom operators to foundry values and passes negate through', async () => {
    const all: MockIndexEntry[] = [{ _id: 'a', name: 'Fireball', type: 'spell', img: 'a.webp' }];
    const pack = createMockPack(all, all);
    setGame(new Map([['p1', pack]]));

    await searchCompendiumHandler({
      packId: 'p1',
      filters: [{ field: 'system.level', operator: 'GREATER_THAN', value: 2, negate: true }]
    });

    expect(pack.search).toHaveBeenCalledWith({
      filters: [{ field: 'system.level', operator: 'gt', value: 2, negate: true }]
    });
  });

  it('combines query and filters', async () => {
    const all: MockIndexEntry[] = [{ _id: 'a', name: 'Fire', type: 'spell', img: 'a.webp' }];
    const pack = createMockPack(all, all);
    setGame(new Map([['p1', pack]]));

    await searchCompendiumHandler({
      packId: 'p1',
      query: 'fire',
      filters: [{ field: 'system.level', value: 3 }]
    });

    expect(pack.search).toHaveBeenCalledWith({
      query: 'fire',
      filters: [{ field: 'system.level', operator: 'equals', value: 3, negate: false }]
    });
  });

  it('passes exclude option', async () => {
    const all: MockIndexEntry[] = [
      { _id: 'a', name: 'A', type: 'spell', img: 'a.webp' },
      { _id: 'b', name: 'B', type: 'spell', img: 'b.webp' }
    ];
    const pack = createMockPack(all, [all[1]!]);
    setGame(new Map([['p1', pack]]));

    const result = await searchCompendiumHandler({
      packId: 'p1',
      query: 'something',
      exclude: ['a']
    });

    expect(pack.search).toHaveBeenCalledWith({ query: 'something', exclude: ['a'] });
    expect(result.results).toHaveLength(1);
  });

  it('paginates with limit and offset', async () => {
    const matched: MockIndexEntry[] = Array.from({ length: 5 }, (_, i) => ({
      _id: `e${i}`,
      name: `Spell ${i}`,
      type: 'spell',
      img: `e${i}.webp`
    }));
    const pack = createMockPack(matched, matched);
    setGame(new Map([['p1', pack]]));

    const result = await searchCompendiumHandler({ packId: 'p1', limit: 2, offset: 1 });

    expect(result.total).toBe(5);
    expect(result.results).toHaveLength(2);
    expect(result.results[0]?.id).toBe('e1');
    expect(result.results[1]?.id).toBe('e2');
    expect(result.hasMore).toBe(true);
  });

  it('hasMore is false when results fit within page', async () => {
    const matched: MockIndexEntry[] = [
      { _id: 'a', name: 'A', type: 'spell', img: 'a.webp' }
    ];
    const pack = createMockPack(matched, matched);
    setGame(new Map([['p1', pack]]));

    const result = await searchCompendiumHandler({ packId: 'p1', limit: 50, offset: 0 });

    expect(result.hasMore).toBe(false);
  });

  it('default limit is 50, default offset is 0', async () => {
    const matched: MockIndexEntry[] = Array.from({ length: 60 }, (_, i) => ({
      _id: `e${i}`,
      name: `Spell ${i}`,
      type: 'spell'
    }));
    const pack = createMockPack(matched, matched);
    setGame(new Map([['p1', pack]]));

    const result = await searchCompendiumHandler({ packId: 'p1' });

    expect(result.results).toHaveLength(50);
    expect(result.total).toBe(60);
    expect(result.hasMore).toBe(true);
  });

  it('caps limit at 500', async () => {
    const matched: MockIndexEntry[] = Array.from({ length: 1000 }, (_, i) => ({
      _id: `e${i}`,
      name: `Spell ${i}`
    }));
    const pack = createMockPack(matched, matched);
    setGame(new Map([['p1', pack]]));

    const result = await searchCompendiumHandler({ packId: 'p1', limit: 9999 });

    expect(result.results).toHaveLength(500);
    expect(result.total).toBe(1000);
    expect(result.hasMore).toBe(true);
  });

  it('treats limit < 1 as default 50', async () => {
    const matched: MockIndexEntry[] = Array.from({ length: 60 }, (_, i) => ({
      _id: `e${i}`,
      name: `Spell ${i}`
    }));
    const pack = createMockPack(matched, matched);
    setGame(new Map([['p1', pack]]));

    const result = await searchCompendiumHandler({ packId: 'p1', limit: 0 });

    expect(result.results).toHaveLength(50);
  });

  it('returns empty results when nothing matches', async () => {
    const pack = createMockPack([], []);
    setGame(new Map([['p1', pack]]));

    const result = await searchCompendiumHandler({ packId: 'p1', query: 'nothing' });

    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('throws when pack not found', async () => {
    setGame(new Map());

    await expect(searchCompendiumHandler({ packId: 'missing' }))
      .rejects.toThrow('Pack not found: missing');
  });

  it('rebuilds index when fields requested', async () => {
    const all: MockIndexEntry[] = [
      { _id: 'a', name: 'Fireball', type: 'spell', img: 'a.webp', 'system.level': 3 }
    ];
    const pack = createMockPack(all, all);
    setGame(new Map([['p1', pack]]));

    await searchCompendiumHandler({ packId: 'p1', fields: ['system.level'] });

    expect(pack.getIndex).toHaveBeenCalledWith({ fields: ['system.level'] });
  });

  it('does not call getIndex when no fields requested', async () => {
    const all: MockIndexEntry[] = [{ _id: 'a', name: 'A', type: 'spell' }];
    const pack = createMockPack(all, all);
    setGame(new Map([['p1', pack]]));

    await searchCompendiumHandler({ packId: 'p1', query: 'a' });

    expect(pack.getIndex).not.toHaveBeenCalled();
  });

  it('populates entry.fields when fields requested', async () => {
    const all: MockIndexEntry[] = [
      { _id: 'a', name: 'Fireball', type: 'spell', img: 'a.webp', 'system.level': 3 }
    ];
    const pack = createMockPack(all, all);
    setGame(new Map([['p1', pack]]));

    const result = await searchCompendiumHandler({
      packId: 'p1',
      fields: ['system.level']
    });

    expect(result.results[0]?.fields).toEqual({ 'system.level': 3 });
  });

  it('handles Set search result with missing index entries gracefully', async () => {
    const all: MockIndexEntry[] = [{ _id: 'a', name: 'A', type: 'spell', img: 'a.webp' }];
    const matched = new Set<string>(['a', 'ghost-id']);
    const pack = createMockPack(all, matched);
    setGame(new Map([['p1', pack]]));

    const result = await searchCompendiumHandler({ packId: 'p1' });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.id).toBe('a');
  });
});
