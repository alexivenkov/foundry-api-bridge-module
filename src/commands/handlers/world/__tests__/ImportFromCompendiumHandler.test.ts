import { importFromCompendiumHandler } from '../ImportFromCompendiumHandler';

interface MockDoc {
  id: string;
  uuid: string;
  name: string;
  type?: string;
  toObject: jest.Mock;
}

interface MockPack {
  metadata: { type: string; label: string };
  getDocument: jest.Mock;
}

interface MockCreatedDoc {
  id: string;
  uuid: string;
  name: string;
}

function createMockPack(metadataType: string, doc: MockDoc | null | undefined): MockPack {
  return {
    metadata: { type: metadataType, label: 'Test Pack' },
    getDocument: jest.fn().mockResolvedValue(doc)
  };
}

function setupGame(pack: MockPack | undefined): void {
  (globalThis as Record<string, unknown>)['game'] = pack !== undefined
    ? { packs: { get: (_id: string): MockPack | undefined => pack } }
    : { packs: undefined };
}

function setupDocClass(typeName: string, created: MockCreatedDoc | null): jest.Mock {
  const create = jest.fn().mockResolvedValue(created);
  (globalThis as Record<string, unknown>)[typeName] = { create };
  return create;
}

function clearAll(): void {
  for (const key of ['game', 'Actor', 'Item', 'JournalEntry', 'Scene', 'RollTable', 'Macro', 'Cards', 'Playlist']) {
    delete (globalThis as Record<string, unknown>)[key];
  }
}

function makeDoc(payload: Record<string, unknown>, overrides: Partial<MockDoc> = {}): MockDoc {
  return {
    id: 'comp-1',
    uuid: 'Compendium.test.pack.comp-1',
    name: 'Original',
    type: 'npc',
    toObject: jest.fn().mockReturnValue(payload),
    ...overrides
  };
}

describe('importFromCompendiumHandler', () => {
  afterEach(clearAll);

  it('imports an Actor and returns world doc data', async () => {
    const compDoc = makeDoc({
      _id: 'comp-1',
      name: 'Goblin',
      type: 'npc',
      system: { hp: { value: 7 } }
    });
    const pack = createMockPack('Actor', compDoc);
    setupGame(pack);
    const create = setupDocClass('Actor', { id: 'world-1', uuid: 'Actor.world-1', name: 'Goblin' });

    const result = await importFromCompendiumHandler({
      packId: 'dnd5e.monsters',
      documentId: 'comp-1'
    });

    expect(create).toHaveBeenCalledWith(expect.not.objectContaining({ _id: 'comp-1' }));
    const passed = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(passed['name']).toBe('Goblin');
    expect(passed['type']).toBe('npc');
    expect(result).toEqual({
      imported: true,
      worldId: 'world-1',
      uuid: 'Actor.world-1',
      name: 'Goblin',
      documentType: 'Actor'
    });
  });

  it('imports an Item via Item.create', async () => {
    const compDoc = makeDoc({ _id: 'comp-2', name: 'Sword', type: 'weapon' });
    const pack = createMockPack('Item', compDoc);
    setupGame(pack);
    const create = setupDocClass('Item', { id: 'i1', uuid: 'Item.i1', name: 'Sword' });

    const result = await importFromCompendiumHandler({
      packId: 'dnd5e.items',
      documentId: 'comp-2'
    });

    expect(create).toHaveBeenCalled();
    expect(result.documentType).toBe('Item');
    expect(result.worldId).toBe('i1');
  });

  it('imports a JournalEntry', async () => {
    const compDoc = makeDoc({ _id: 'j1', name: 'Lore' });
    const pack = createMockPack('JournalEntry', compDoc);
    setupGame(pack);
    const create = setupDocClass('JournalEntry', { id: 'wj1', uuid: 'JournalEntry.wj1', name: 'Lore' });

    const result = await importFromCompendiumHandler({ packId: 'p1', documentId: 'j1' });

    expect(create).toHaveBeenCalled();
    expect(result.documentType).toBe('JournalEntry');
  });

  it('imports a Scene', async () => {
    const compDoc = makeDoc({ _id: 's1', name: 'Forest' });
    const pack = createMockPack('Scene', compDoc);
    setupGame(pack);
    const create = setupDocClass('Scene', { id: 'ws1', uuid: 'Scene.ws1', name: 'Forest' });

    const result = await importFromCompendiumHandler({ packId: 'p1', documentId: 's1' });

    expect(create).toHaveBeenCalled();
    expect(result.documentType).toBe('Scene');
  });

  it('imports a RollTable', async () => {
    const compDoc = makeDoc({ _id: 'rt1', name: 'Encounters' });
    const pack = createMockPack('RollTable', compDoc);
    setupGame(pack);
    const create = setupDocClass('RollTable', { id: 'wrt1', uuid: 'RollTable.wrt1', name: 'Encounters' });

    const result = await importFromCompendiumHandler({ packId: 'p1', documentId: 'rt1' });

    expect(create).toHaveBeenCalled();
    expect(result.documentType).toBe('RollTable');
  });

  it('imports a Macro', async () => {
    const compDoc = makeDoc({ _id: 'm1', name: 'AttackMacro' });
    const pack = createMockPack('Macro', compDoc);
    setupGame(pack);
    const create = setupDocClass('Macro', { id: 'wm1', uuid: 'Macro.wm1', name: 'AttackMacro' });

    const result = await importFromCompendiumHandler({ packId: 'p1', documentId: 'm1' });

    expect(create).toHaveBeenCalled();
    expect(result.documentType).toBe('Macro');
  });

  it('imports Cards', async () => {
    const compDoc = makeDoc({ _id: 'c1', name: 'Tarot' });
    const pack = createMockPack('Cards', compDoc);
    setupGame(pack);
    const create = setupDocClass('Cards', { id: 'wc1', uuid: 'Cards.wc1', name: 'Tarot' });

    const result = await importFromCompendiumHandler({ packId: 'p1', documentId: 'c1' });

    expect(create).toHaveBeenCalled();
    expect(result.documentType).toBe('Cards');
  });

  it('imports a Playlist', async () => {
    const compDoc = makeDoc({ _id: 'pl1', name: 'Battle Music' });
    const pack = createMockPack('Playlist', compDoc);
    setupGame(pack);
    const create = setupDocClass('Playlist', { id: 'wpl1', uuid: 'Playlist.wpl1', name: 'Battle Music' });

    const result = await importFromCompendiumHandler({ packId: 'p1', documentId: 'pl1' });

    expect(create).toHaveBeenCalled();
    expect(result.documentType).toBe('Playlist');
  });

  it('overrides name when params.name provided', async () => {
    const compDoc = makeDoc({ _id: 'd1', name: 'Original', type: 'npc' });
    const pack = createMockPack('Actor', compDoc);
    setupGame(pack);
    const create = setupDocClass('Actor', { id: 'w1', uuid: 'Actor.w1', name: 'Custom' });

    await importFromCompendiumHandler({
      packId: 'p1',
      documentId: 'd1',
      name: 'Custom'
    });

    const passed = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(passed['name']).toBe('Custom');
  });

  it('sets folder when params.folder provided', async () => {
    const compDoc = makeDoc({ _id: 'd1', name: 'X', type: 'npc' });
    const pack = createMockPack('Actor', compDoc);
    setupGame(pack);
    const create = setupDocClass('Actor', { id: 'w1', uuid: 'Actor.w1', name: 'X' });

    await importFromCompendiumHandler({
      packId: 'p1',
      documentId: 'd1',
      folder: 'folder-123'
    });

    const passed = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(passed['folder']).toBe('folder-123');
  });

  it('strips _id from data before create', async () => {
    const compDoc = makeDoc({
      _id: 'comp-id',
      name: 'X',
      type: 'npc',
      system: {}
    });
    const pack = createMockPack('Actor', compDoc);
    setupGame(pack);
    const create = setupDocClass('Actor', { id: 'w1', uuid: 'Actor.w1', name: 'X' });

    await importFromCompendiumHandler({ packId: 'p1', documentId: 'comp-id' });

    const passed = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(passed).not.toHaveProperty('_id');
  });

  it('throws when pack not found', async () => {
    setupGame(undefined);

    await expect(
      importFromCompendiumHandler({ packId: 'missing', documentId: 'd1' })
    ).rejects.toThrow('Pack not found: missing');
  });

  it('throws when document not found', async () => {
    const pack = createMockPack('Actor', null);
    setupGame(pack);

    await expect(
      importFromCompendiumHandler({ packId: 'p1', documentId: 'missing' })
    ).rejects.toThrow('Document not found in pack p1: missing');
  });

  it('throws for Adventure type', async () => {
    const compDoc = makeDoc({ _id: 'a1', name: 'Big Adventure' });
    const pack = createMockPack('Adventure', compDoc);
    setupGame(pack);

    await expect(
      importFromCompendiumHandler({ packId: 'adv.pack', documentId: 'a1' })
    ).rejects.toThrow('Adventure import not supported');
  });

  it('throws when document class is unavailable globally', async () => {
    const compDoc = makeDoc({ _id: 'd1', name: 'X', type: 'npc' });
    const pack = createMockPack('Actor', compDoc);
    setupGame(pack);
    // Note: not calling setupDocClass — Actor is undefined.

    await expect(
      importFromCompendiumHandler({ packId: 'p1', documentId: 'd1' })
    ).rejects.toThrow('Document class not available for type: Actor');
  });

  it('throws when create returns null', async () => {
    const compDoc = makeDoc({ _id: 'd1', name: 'X', type: 'npc' });
    const pack = createMockPack('Actor', compDoc);
    setupGame(pack);
    setupDocClass('Actor', null);

    await expect(
      importFromCompendiumHandler({ packId: 'p1', documentId: 'd1' })
    ).rejects.toThrow('Failed to import document');
  });
});
