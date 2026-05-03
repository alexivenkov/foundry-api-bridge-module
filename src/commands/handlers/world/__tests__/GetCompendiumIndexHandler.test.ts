import { getCompendiumIndexHandler } from '../GetCompendiumIndexHandler';

interface MockIndexEntry {
  _id: string;
  name: string;
  img?: string;
  type?: string;
  [path: string]: unknown;
}

interface MockPack {
  collection: string;
  metadata: { id?: string; label: string; type: string; system?: string; packageName?: string };
  index: {
    size: number;
    contents: MockIndexEntry[];
    get(id: string): MockIndexEntry | undefined;
    forEach(fn: (entry: MockIndexEntry) => void): void;
  };
  getIndex: jest.Mock;
}

function createIndex(entries: MockIndexEntry[]): MockPack['index'] {
  return {
    size: entries.length,
    contents: entries,
    get: (id: string): MockIndexEntry | undefined => entries.find(e => e._id === id),
    forEach: (fn: (entry: MockIndexEntry) => void): void => entries.forEach(fn)
  };
}

function createMockPack(entries: MockIndexEntry[], overrides?: Partial<MockPack>): MockPack {
  const idx = createIndex(entries);
  return {
    collection: 'dnd5e.monsters',
    metadata: { label: 'D&D 5e Monsters', type: 'Actor', system: 'dnd5e', packageName: 'dnd5e' },
    index: idx,
    getIndex: jest.fn().mockResolvedValue(idx),
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

describe('getCompendiumIndexHandler', () => {
  afterEach(clearGame);

  it('returns mapped entries for happy path with three entries', async () => {
    const pack = createMockPack([
      { _id: 'e1', name: 'Goblin', img: 'monsters/goblin.webp', type: 'npc' },
      { _id: 'e2', name: 'Orc', img: 'monsters/orc.webp', type: 'npc' },
      { _id: 'e3', name: 'Dragon', img: 'monsters/dragon.webp', type: 'npc' }
    ]);
    setGame(new Map([['dnd5e.monsters', pack]]));

    const result = await getCompendiumIndexHandler({ packId: 'dnd5e.monsters' });

    expect(result.packId).toBe('dnd5e.monsters');
    expect(result.packType).toBe('Actor');
    expect(result.packLabel).toBe('D&D 5e Monsters');
    expect(result.total).toBe(3);
    expect(result.entries).toHaveLength(3);
    expect(result.entries[0]).toEqual({
      id: 'e1',
      name: 'Goblin',
      img: 'monsters/goblin.webp',
      type: 'npc'
    });
  });

  it('throws when pack not found', async () => {
    setGame(new Map());

    await expect(getCompendiumIndexHandler({ packId: 'missing.pack' }))
      .rejects.toThrow('Pack not found: missing.pack');
  });

  it('throws when packs collection is missing', async () => {
    setGame(undefined);

    await expect(getCompendiumIndexHandler({ packId: 'any' }))
      .rejects.toThrow('Pack not found: any');
  });

  it('returns empty entries for empty pack', async () => {
    const pack = createMockPack([]);
    setGame(new Map([['empty.pack', pack]]));

    const result = await getCompendiumIndexHandler({ packId: 'empty.pack' });

    expect(result.total).toBe(0);
    expect(result.entries).toEqual([]);
  });

  it('returns img: null when entry has no img', async () => {
    const pack = createMockPack([{ _id: 'e1', name: 'NoImg', type: 'npc' }]);
    setGame(new Map([['p1', pack]]));

    const result = await getCompendiumIndexHandler({ packId: 'p1' });

    expect(result.entries[0]?.img).toBeNull();
  });

  it('returns type: null when entry has no type', async () => {
    const pack = createMockPack([{ _id: 'e1', name: 'JournalPage', img: 'page.webp' }]);
    setGame(new Map([['p1', pack]]));

    const result = await getCompendiumIndexHandler({ packId: 'p1' });

    expect(result.entries[0]?.type).toBeNull();
  });

  it('passes fields option to pack.getIndex', async () => {
    const pack = createMockPack([{ _id: 'e1', name: 'Spell', type: 'spell', img: 's.webp' }]);
    setGame(new Map([['spells.pack', pack]]));

    await getCompendiumIndexHandler({ packId: 'spells.pack', fields: ['system.level', 'system.school'] });

    expect(pack.getIndex).toHaveBeenCalledWith({ fields: ['system.level', 'system.school'] });
  });

  it('populates fields from indexed entries when fields requested', async () => {
    const pack = createMockPack([
      { _id: 'e1', name: 'Fireball', type: 'spell', img: 'fireball.webp', 'system.level': 3, 'system.school': 'evocation' }
    ]);
    setGame(new Map([['spells.pack', pack]]));

    const result = await getCompendiumIndexHandler({
      packId: 'spells.pack',
      fields: ['system.level', 'system.school']
    });

    expect(result.entries[0]?.fields).toEqual({
      'system.level': 3,
      'system.school': 'evocation'
    });
  });

  it('omits fields when no fields option provided', async () => {
    const pack = createMockPack([{ _id: 'e1', name: 'X', type: 'item', img: 'x.webp' }]);
    setGame(new Map([['p1', pack]]));

    const result = await getCompendiumIndexHandler({ packId: 'p1' });

    expect(result.entries[0]).not.toHaveProperty('fields');
  });

  it('omits fields when fields option is empty array', async () => {
    const pack = createMockPack([{ _id: 'e1', name: 'X', type: 'item', img: 'x.webp' }]);
    setGame(new Map([['p1', pack]]));

    const result = await getCompendiumIndexHandler({ packId: 'p1', fields: [] });

    expect(result.entries[0]).not.toHaveProperty('fields');
  });

  it('calls getIndex without fields when no fields requested', async () => {
    const pack = createMockPack([{ _id: 'e1', name: 'X', type: 'item', img: 'x.webp' }]);
    setGame(new Map([['p1', pack]]));

    await getCompendiumIndexHandler({ packId: 'p1' });

    expect(pack.getIndex).toHaveBeenCalledWith({});
  });

  it('falls back to forEach when index has no contents array', async () => {
    const entries: MockIndexEntry[] = [
      { _id: 'e1', name: 'A', type: 'spell', img: 'a.webp' },
      { _id: 'e2', name: 'B', type: 'spell', img: 'b.webp' }
    ];
    const idx = {
      size: entries.length,
      get: (id: string): MockIndexEntry | undefined => entries.find(e => e._id === id),
      forEach: (fn: (entry: MockIndexEntry) => void): void => entries.forEach(fn)
    } as unknown as MockPack['index'];
    const pack: MockPack = {
      collection: 'p',
      metadata: { label: 'P', type: 'Item' },
      index: idx,
      getIndex: jest.fn().mockResolvedValue(idx)
    };
    setGame(new Map([['p1', pack]]));

    const result = await getCompendiumIndexHandler({ packId: 'p1' });

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]?.name).toBe('A');
    expect(result.entries[1]?.name).toBe('B');
  });
});
