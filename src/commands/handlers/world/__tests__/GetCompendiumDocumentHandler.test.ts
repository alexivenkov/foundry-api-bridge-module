import { getCompendiumDocumentHandler } from '../GetCompendiumDocumentHandler';

interface MockDoc {
  id: string;
  uuid: string;
  name: string;
  type?: string;
  img?: string | null;
  toObject: jest.Mock;
}

interface MockPack {
  metadata: { type: string; label: string };
  getDocument: jest.Mock;
}

function createMockPack(metadataType: string, doc: MockDoc | null | undefined): MockPack {
  return {
    metadata: { type: metadataType, label: 'Test Pack' },
    getDocument: jest.fn().mockResolvedValue(doc)
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

describe('getCompendiumDocumentHandler', () => {
  afterEach(clearGame);

  it('returns full document data for happy path', async () => {
    const doc: MockDoc = {
      id: 'doc-1',
      uuid: 'Compendium.dnd5e.monsters.doc-1',
      name: 'Goblin',
      type: 'npc',
      img: 'monsters/goblin.webp',
      toObject: jest.fn().mockReturnValue({
        _id: 'doc-1',
        name: 'Goblin',
        type: 'npc',
        system: { cr: 0.25, hp: { value: 7 } }
      })
    };
    const pack = createMockPack('Actor', doc);
    setGame(new Map([['dnd5e.monsters', pack]]));

    const result = await getCompendiumDocumentHandler({
      packId: 'dnd5e.monsters',
      documentId: 'doc-1'
    });

    expect(pack.getDocument).toHaveBeenCalledWith('doc-1');
    expect(result.id).toBe('doc-1');
    expect(result.uuid).toBe('Compendium.dnd5e.monsters.doc-1');
    expect(result.name).toBe('Goblin');
    expect(result.type).toBe('npc');
    expect(result.img).toBe('monsters/goblin.webp');
    expect(result.documentType).toBe('Actor');
    expect(result.data).toEqual({
      _id: 'doc-1',
      name: 'Goblin',
      type: 'npc',
      system: { cr: 0.25, hp: { value: 7 } }
    });
  });

  it('throws when pack not found', async () => {
    setGame(new Map());

    await expect(
      getCompendiumDocumentHandler({ packId: 'missing', documentId: 'd1' })
    ).rejects.toThrow('Pack not found: missing');
  });

  it('throws when document not found', async () => {
    const pack = createMockPack('Actor', null);
    setGame(new Map([['p1', pack]]));

    await expect(
      getCompendiumDocumentHandler({ packId: 'p1', documentId: 'missing-doc' })
    ).rejects.toThrow('Document not found in pack p1: missing-doc');
  });

  it('throws when getDocument returns undefined', async () => {
    const pack = createMockPack('Actor', undefined);
    setGame(new Map([['p1', pack]]));

    await expect(
      getCompendiumDocumentHandler({ packId: 'p1', documentId: 'missing' })
    ).rejects.toThrow('Document not found in pack p1: missing');
  });

  it('returns img: null when document has null img', async () => {
    const doc: MockDoc = {
      id: 'd1',
      uuid: 'X.d1',
      name: 'No Image',
      type: 'base',
      img: null,
      toObject: jest.fn().mockReturnValue({})
    };
    const pack = createMockPack('JournalEntry', doc);
    setGame(new Map([['p1', pack]]));

    const result = await getCompendiumDocumentHandler({ packId: 'p1', documentId: 'd1' });

    expect(result.img).toBeNull();
  });

  it('returns img: null when document has undefined img', async () => {
    const doc: MockDoc = {
      id: 'd1',
      uuid: 'X.d1',
      name: 'No Image',
      type: 'base',
      toObject: jest.fn().mockReturnValue({})
    };
    const pack = createMockPack('JournalEntry', doc);
    setGame(new Map([['p1', pack]]));

    const result = await getCompendiumDocumentHandler({ packId: 'p1', documentId: 'd1' });

    expect(result.img).toBeNull();
  });

  it('preserves documentType from pack metadata for Item compendium', async () => {
    const doc: MockDoc = {
      id: 'i1',
      uuid: 'Item.i1',
      name: 'Sword',
      type: 'weapon',
      img: 'items/sword.webp',
      toObject: jest.fn().mockReturnValue({ _id: 'i1', name: 'Sword' })
    };
    const pack = createMockPack('Item', doc);
    setGame(new Map([['dnd5e.items', pack]]));

    const result = await getCompendiumDocumentHandler({
      packId: 'dnd5e.items',
      documentId: 'i1'
    });

    expect(result.documentType).toBe('Item');
    expect(result.type).toBe('weapon');
  });

  it('handles document without type field (e.g. Scene)', async () => {
    const doc: MockDoc = {
      id: 's1',
      uuid: 'Scene.s1',
      name: 'Forest',
      img: 'scenes/forest.webp',
      toObject: jest.fn().mockReturnValue({ _id: 's1', name: 'Forest' })
    };
    const pack = createMockPack('Scene', doc);
    setGame(new Map([['scenes.pack', pack]]));

    const result = await getCompendiumDocumentHandler({
      packId: 'scenes.pack',
      documentId: 's1'
    });

    expect(result.documentType).toBe('Scene');
    expect(result.type).toBe('');
  });
});
