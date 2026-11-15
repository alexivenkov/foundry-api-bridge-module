import { ImportFolderCreationFailedError } from '../../domain';
import { FoundryAdventureGateway } from '../FoundryAdventureGateway';
import { FoundryPackContentWriter } from '../FoundryPackContentWriter';
import { FoundryWorldBulkImporter } from '../FoundryWorldBulkImporter';
import type {
  FoundryAdventureClass,
  FoundryAdventureImportData,
  FoundryAdventurePreImport
} from '../foundryAdventureTypes';
import type {
  FoundryFolderClass,
  FoundryManagedPackIndex,
  FoundryManagedPackIndexEntry,
  FoundryPackDocumentLike
} from '../foundryPackManagementTypes';
import { moduleSettingScriptMacroImportPolicy } from '../moduleSettingScriptMacroImportPolicy';
import {
  fakeGlobals,
  fakePack,
  fakeWorld,
  packDocument,
  packFolder,
  worldCollection,
  worldFolder
} from './managementFixtures';

function index(entries: FoundryManagedPackIndexEntry[]): FoundryManagedPackIndex {
  return {
    size: entries.length,
    keys: () => entries.map(entry => entry._id),
    forEach: fn => entries.forEach(fn)
  };
}

function folderClass(): FoundryFolderClass & { createDocuments: jest.Mock } {
  return {
    createDocuments: jest.fn((data: Record<string, unknown>[]) =>
      Promise.resolve(data.map((entry, position) => ({ id: String(entry['_id'] ?? `root${String(position)}`), name: String(entry['name']) })))
    )
  };
}

function macroWorld(): {
  world: ReturnType<typeof fakeWorld>;
  pack: ReturnType<typeof fakePack>;
  collection: ReturnType<typeof worldCollection>;
} {
  const documents = [
    packDocument('m1', { name: 'Light', type: 'chat', _source: { folder: 'mf1' } }),
    packDocument('m2', { name: 'Fireworks', type: 'script', _source: { folder: 'mf1' } }),
    packDocument('m3', { name: 'Loose', type: 'chat' })
  ];
  const folders = [packFolder('mf1', 'Tricks'), packFolder('mf2', 'Known')];
  const pack = fakePack({
    collection: 'world.macros',
    title: 'Macros',
    metadata: { label: 'Macros', type: 'Macro', system: 'dnd5e', packageType: 'world', packageName: 'my-world' },
    folder: { id: 'cf1', color: '#123456' },
    folders: { contents: folders, get: (id: string) => folders.find(folder => folder.id === id) },
    getIndex: jest.fn().mockResolvedValue(
      index([
        { _id: 'm1', name: 'Light', type: 'chat', folder: 'mf1' },
        { _id: 'm2', name: 'Fireworks', type: 'script', folder: 'mf1' },
        { _id: 'm3', name: 'Loose', folder: null }
      ])
    ),
    getDocuments: jest.fn(() => Promise.resolve(documents))
  });
  const world = fakeWorld({ packs: [pack, fakePack()] });
  world.folders.push(worldFolder('mf2', 'Macro', { name: 'Known' }));
  const collection = worldCollection();
  world.collections.set('Macro', collection);
  return { world, pack, collection };
}

describe('FoundryWorldBulkImporter and script macros', () => {
  it('lists the script macros of a Macro pack from an index with types', async () => {
    const { world, pack } = macroWorld();
    const importer = new FoundryWorldBulkImporter(world.provider, fakeGlobals(), () => 14);
    expect(await importer.listScriptMacros('world.macros')).toEqual([{ id: 'm2', name: 'Fireworks' }]);
    expect(pack.getIndex).toHaveBeenCalledWith({ fields: ['type'] });
    expect(await importer.listScriptMacros('world.monsters')).toEqual([]);
  });

  it('imports the pack without the skipped documents the way importAll would', async () => {
    const { world, pack, collection } = macroWorld();
    const folders = folderClass();
    const importer = new FoundryWorldBulkImporter(world.provider, fakeGlobals({ folderClass: () => folders }), () => 14);

    const outcome = await importer.importPack('world.macros', { keepId: true, skipDocumentIds: ['m2'] });

    expect(pack.importAll).not.toHaveBeenCalled();
    expect(folders.createDocuments).toHaveBeenNthCalledWith(
      1,
      [{ name: 'Macros', type: 'Macro', folder: null, color: '#123456' }],
      { keepId: false }
    );
    expect(folders.createDocuments).toHaveBeenNthCalledWith(
      2,
      [{ _id: 'mf1', name: 'Tricks', type: 'Actor', folder: 'root0', sorting: 'a', sort: 0 }],
      { keepId: true }
    );
    expect(collection.fromCompendium).toHaveBeenCalledTimes(2);
    expect(collection.createDocuments).toHaveBeenCalledWith(
      [
        { _id: 'm1', name: 'Light', folder: 'mf1' },
        { _id: 'm3', name: 'Loose', folder: 'root0' }
      ],
      { keepId: true }
    );
    expect(outcome).toEqual({
      folder: { id: 'root0', name: 'Macros' },
      documents: [
        { id: 'm1', name: 'Light' },
        { id: 'm3', name: 'Loose' }
      ]
    });
  });

  it('reuses an existing world folder and keeps calling importAll when nothing is skipped', async () => {
    const { world, pack, collection } = macroWorld();
    const folders = folderClass();
    const importer = new FoundryWorldBulkImporter(world.provider, fakeGlobals({ folderClass: () => folders }), () => 14);

    const outcome = await importer.importPack('world.macros', { folderId: 'wf1', keepId: false, skipDocumentIds: ['m2'] });
    expect(folders.createDocuments).toHaveBeenCalledTimes(1);
    expect(collection.createDocuments.mock.calls[0]?.[0]).toEqual([
      { name: 'Light', folder: 'mf1' },
      { name: 'Loose', folder: 'wf1' }
    ]);
    expect(outcome.folder).toEqual({ id: 'wf1', name: 'Folder wf1' });

    await importer.importPack('world.macros', { keepId: false, skipDocumentIds: [] });
    expect(pack.importAll).toHaveBeenCalledWith({ keepId: false });
  });

  it('reports a top-level folder the core did not create', async () => {
    const { world } = macroWorld();
    const folders: FoundryFolderClass = { createDocuments: jest.fn().mockResolvedValue([]) };
    const importer = new FoundryWorldBulkImporter(world.provider, fakeGlobals({ folderClass: () => folders }), () => 14);
    await expect(importer.importPack('world.macros', { keepId: false, skipDocumentIds: ['m2'] })).rejects.toThrow(
      new ImportFolderCreationFailedError('world.macros')
    );
  });
});

const adventureClass: FoundryAdventureClass = {
  contentFields: { actors: { documentName: 'Actor' }, macros: { documentName: 'Macro' }, folders: { documentName: 'Folder' } },
  prototype: { prepareImport: () => undefined, import: () => undefined }
};

function adventureData(): FoundryAdventureImportData {
  return {
    toCreate: {
      Actor: [{ _id: 'a1', name: 'Goblin' }],
      Macro: [
        { _id: 'm1', name: 'Light', type: 'chat' },
        { _id: 'm2', name: 'Fireworks', type: 'script' }
      ]
    },
    toUpdate: { Macro: [{ _id: 'm3', name: 'Boom', type: 'script' }] },
    documentCount: 4
  };
}

function adventureSetup(): { gateway: FoundryAdventureGateway; adventure: { prepareImport: jest.Mock; import: jest.Mock } } {
  const adventure = {
    id: 'adv1',
    uuid: 'Compendium.world.adventures.Adventure.adv1',
    name: 'Lost Mine',
    prepareImport: jest.fn(() => Promise.resolve(adventureData())),
    import: jest.fn().mockResolvedValue({ created: { Actor: [{ id: 'a1', name: 'Goblin' }] }, updated: {} })
  };
  const pack = fakePack({
    collection: 'world.adventures',
    getDocument: jest.fn(() => Promise.resolve(adventure as unknown as FoundryPackDocumentLike))
  });
  const gateway = new FoundryAdventureGateway(fakeWorld({ packs: [pack] }).provider, fakeGlobals({ adventureClass: () => adventureClass }));
  return { gateway, adventure };
}

describe('FoundryAdventureGateway and script macros', () => {
  it('names the script macros of the plan', async () => {
    const { gateway } = adventureSetup();
    expect((await gateway.planImport('world.adventures', 'adv1')).scriptMacros).toEqual([
      { id: 'm2', name: 'Fireworks' },
      { id: 'm3', name: 'Boom' }
    ]);
  });

  it('removes them from the import data before the overwrite guard and reports them', async () => {
    const { gateway, adventure } = adventureSetup();
    const outcome = await gateway.importAdventure('world.adventures', 'adv1', { allowOverwrite: false, skipScriptMacros: true });
    const options = adventure.import.mock.calls[0]?.[0] as { preImport: FoundryAdventurePreImport[] };
    expect(options.preImport).toHaveLength(2);
    const [skip, guard] = options.preImport;

    const data = adventureData();
    await skip?.(data);
    expect(data).toEqual({
      toCreate: { Actor: [{ _id: 'a1', name: 'Goblin' }], Macro: [{ _id: 'm1', name: 'Light', type: 'chat' }] },
      toUpdate: {},
      documentCount: 2
    });
    expect(() => guard?.(data)).not.toThrow();
    expect(outcome?.skippedScriptMacros).toEqual([
      { id: 'm2', name: 'Fireworks' },
      { id: 'm3', name: 'Boom' }
    ]);
  });

  it('leaves the import alone when not asked to skip', async () => {
    const { gateway, adventure } = adventureSetup();
    const outcome = await gateway.importAdventure('world.adventures', 'adv1', { allowOverwrite: true });
    expect(adventure.import).toHaveBeenCalledWith({ dialog: false, importFields: [], preImport: [] });
    expect(outcome).not.toHaveProperty('skippedScriptMacros');
  });
});

describe('FoundryPackContentWriter.readDocumentSource', () => {
  it('reads the stored data of a pack document', async () => {
    const stored = { _id: 'd1', name: 'Doc d1', flags: { dae: {} } };
    const pack = fakePack({
      getDocument: jest.fn((id: string) =>
        Promise.resolve(id === 'd1' ? packDocument('d1', { toObject: () => stored }) : id === 'd2' ? packDocument('d2') : null)
      )
    });
    const writer = new FoundryPackContentWriter(fakeWorld({ packs: [pack] }).provider);
    expect(await writer.readDocumentSource('world.monsters', 'd1')).toBe(stored);
    expect(await writer.readDocumentSource('world.monsters', 'd2')).toEqual({ folder: null });
    expect(await writer.readDocumentSource('world.monsters', 'gone')).toBeNull();
    expect(await writer.readDocumentSource('nope', 'd1')).toBeNull();
  });
});

describe('moduleSettingScriptMacroImportPolicy', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('reads the module setting on every check', () => {
    const get = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    (globalThis as Record<string, unknown>)['game'] = { settings: { get } };
    expect(moduleSettingScriptMacroImportPolicy.allowsScripts()).toBe(false);
    expect(moduleSettingScriptMacroImportPolicy.allowsScripts()).toBe(true);
    expect(get).toHaveBeenCalledWith('foundry-api-bridge', 'allowScriptMacros');
  });
});
