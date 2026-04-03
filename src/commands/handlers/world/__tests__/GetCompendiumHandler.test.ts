import { getCompendiumHandler } from '../GetCompendiumHandler';

interface MockPackMetadata {
  label: string;
  type: string;
  system: string | undefined;
  packageName: string;
}

interface MockPack {
  collection: string;
  metadata: MockPackMetadata;
  index: { size: number };
  getDocuments: jest.Mock;
}

function createMockPack(overrides?: Partial<MockPack>): MockPack {
  return {
    collection: 'dnd5e.monsters',
    metadata: { label: 'Monsters', type: 'Actor', system: 'dnd5e', packageName: 'dnd5e' },
    index: { size: 2 },
    getDocuments: jest.fn().mockResolvedValue([]),
    ...overrides
  };
}

function setGame(packs: Map<string, MockPack> | undefined): void {
  const packsCollection = packs !== undefined
    ? {
        get: jest.fn((id: string) => packs.get(id)),
        forEach: jest.fn((fn: (pack: MockPack) => void) => { packs.forEach(fn); }),
        size: packs.size
      }
    : undefined;
  (globalThis as Record<string, unknown>)['game'] = { packs: packsCollection };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('getCompendiumHandler', () => {
  afterEach(clearGame);

  it('should return compendium with simple documents', async () => {
    const docs = [
      { id: 'd1', uuid: 'Actor.d1', name: 'Goblin', type: 'npc', img: 'monsters/goblin.webp' },
      { id: 'd2', uuid: 'Actor.d2', name: 'Dragon', type: 'npc', img: 'monsters/dragon.webp', system: { cr: 15 } }
    ];
    const pack = createMockPack({ getDocuments: jest.fn().mockResolvedValue(docs) });
    setGame(new Map([['dnd5e.monsters', pack]]));

    const result = await getCompendiumHandler({ packId: 'dnd5e.monsters' });

    expect(result.id).toBe('dnd5e.monsters');
    expect(result.label).toBe('Monsters');
    expect(result.type).toBe('Actor');
    expect(result.system).toBe('dnd5e');
    expect(result.documentCount).toBe(2);
    expect(result.documents).toHaveLength(2);
    expect(result.documents[0]).toEqual({ id: 'd1', uuid: 'Actor.d1', name: 'Goblin', type: 'npc', img: 'monsters/goblin.webp' });
    expect(result.documents[1]?.system).toEqual({ cr: 15 });
  });

  it('should reject when pack not found', async () => {
    setGame(new Map());

    await expect(getCompendiumHandler({ packId: 'nonexistent' }))
      .rejects.toThrow('Compendium not found: nonexistent');
  });

  it('should reject when packs is undefined', async () => {
    setGame(undefined);

    await expect(getCompendiumHandler({ packId: 'anything' }))
      .rejects.toThrow('Compendium not found: anything');
  });

  it('should handle document with items (Actor compendium)', async () => {
    const items = new Map([
      ['i1', { id: 'i1', name: 'Bite', type: 'weapon', img: 'items/bite.webp', system: { damage: '2d6' } }],
      ['i2', { id: 'i2', name: 'Claw', type: 'weapon', img: undefined, system: { damage: '1d8' } }]
    ]);
    const docs = [{ id: 'd1', uuid: 'Actor.d1', name: 'Dragon', type: 'npc', img: 'dragon.webp', items }];
    const pack = createMockPack({ getDocuments: jest.fn().mockResolvedValue(docs) });
    setGame(new Map([['pack1', pack]]));

    const result = await getCompendiumHandler({ packId: 'pack1' });

    expect(result.documents[0]?.items).toHaveLength(2);
    expect(result.documents[0]?.items?.[0]).toEqual({ id: 'i1', name: 'Bite', type: 'weapon', img: 'items/bite.webp', system: { damage: '2d6' } });
    expect(result.documents[0]?.items?.[1]?.img).toBe('');
  });

  it('should handle document with pages (JournalEntry compendium)', async () => {
    const pages = new Map([
      ['p1', { id: 'p1', name: 'Intro', type: 'text', text: { content: '<p>Hello</p>', markdown: '# Hello' } }],
      ['p2', { id: 'p2', name: 'Map', type: 'image', text: undefined }]
    ]);
    const docs = [{ id: 'd1', uuid: 'JE.d1', name: 'Lore', type: 'base', img: '', pages }];
    const pack = createMockPack({
      collection: 'world.journals',
      metadata: { label: 'Journals', type: 'JournalEntry', system: undefined, packageName: 'world' },
      getDocuments: jest.fn().mockResolvedValue(docs)
    });
    setGame(new Map([['world.journals', pack]]));

    const result = await getCompendiumHandler({ packId: 'world.journals' });

    expect(result.system).toBe('');
    expect(result.documents[0]?.pages).toHaveLength(2);
    expect(result.documents[0]?.pages?.[0]).toEqual({ id: 'p1', name: 'Intro', type: 'text', text: '<p>Hello</p>', markdown: '# Hello' });
    expect(result.documents[0]?.pages?.[1]?.text).toBeNull();
    expect(result.documents[0]?.pages?.[1]?.markdown).toBeNull();
  });

  it('should not include system field when document has no system', async () => {
    const docs = [{ id: 'd1', uuid: 'JE.d1', name: 'Note', type: 'base', img: '' }];
    const pack = createMockPack({ getDocuments: jest.fn().mockResolvedValue(docs) });
    setGame(new Map([['pack1', pack]]));

    const result = await getCompendiumHandler({ packId: 'pack1' });

    expect(result.documents[0]?.system).toBeUndefined();
  });

  it('should not include items field when document has no items', async () => {
    const docs = [{ id: 'd1', uuid: 'Item.d1', name: 'Sword', type: 'weapon', img: '' }];
    const pack = createMockPack({ getDocuments: jest.fn().mockResolvedValue(docs) });
    setGame(new Map([['pack1', pack]]));

    const result = await getCompendiumHandler({ packId: 'pack1' });

    expect(result.documents[0]?.items).toBeUndefined();
  });

  it('should not include items field when items map is empty', async () => {
    const docs = [{ id: 'd1', uuid: 'Actor.d1', name: 'Commoner', type: 'npc', img: '', items: new Map() }];
    const pack = createMockPack({ getDocuments: jest.fn().mockResolvedValue(docs) });
    setGame(new Map([['pack1', pack]]));

    const result = await getCompendiumHandler({ packId: 'pack1' });

    expect(result.documents[0]?.items).toBeUndefined();
  });

  it('should not include pages field when pages map is empty', async () => {
    const docs = [{ id: 'd1', uuid: 'JE.d1', name: 'Empty', type: 'base', img: '', pages: new Map() }];
    const pack = createMockPack({ getDocuments: jest.fn().mockResolvedValue(docs) });
    setGame(new Map([['pack1', pack]]));

    const result = await getCompendiumHandler({ packId: 'pack1' });

    expect(result.documents[0]?.pages).toBeUndefined();
  });

  it('should fallback document img to empty string when undefined', async () => {
    const docs = [{ id: 'd1', uuid: 'Item.d1', name: 'Ring', type: 'equipment' }];
    const pack = createMockPack({ getDocuments: jest.fn().mockResolvedValue(docs) });
    setGame(new Map([['pack1', pack]]));

    const result = await getCompendiumHandler({ packId: 'pack1' });

    expect(result.documents[0]?.img).toBe('');
  });

  it('should return empty documents for empty pack', async () => {
    const pack = createMockPack({ getDocuments: jest.fn().mockResolvedValue([]), index: { size: 0 } });
    setGame(new Map([['pack1', pack]]));

    const result = await getCompendiumHandler({ packId: 'pack1' });

    expect(result.documentCount).toBe(0);
    expect(result.documents).toEqual([]);
  });

  it('should propagate getDocuments error', async () => {
    const pack = createMockPack({ getDocuments: jest.fn().mockRejectedValue(new Error('Load failed')) });
    setGame(new Map([['pack1', pack]]));

    await expect(getCompendiumHandler({ packId: 'pack1' }))
      .rejects.toThrow('Load failed');
  });
});
