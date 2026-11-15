import type { FoundryAdventureClass } from '../../../../compendiums/infrastructure/foundryAdventureTypes';
import type {
  FoundryFolderClass,
  FoundryManagedPackIndex,
  FoundryManagedPackIndexEntry,
  FoundryPackDocumentLike
} from '../../../../compendiums/infrastructure/foundryPackManagementTypes';
import {
  fakeGlobals,
  fakePack,
  fakeWorld,
  packDocument,
  packFolder,
  worldCollection
} from '../../../../compendiums/infrastructure/__tests__/managementFixtures';
import type { CompendiumHandlerDependencies } from '../GetCompendiumInfoHandler';
import { createImportAdventureHandler } from '../ImportAdventureHandler';
import { createImportCompendiumFolderHandler } from '../ImportCompendiumFolderHandler';
import { createImportCompendiumHandler } from '../ImportCompendiumHandler';
import { createUpdateCompendiumDocumentHandler } from '../UpdateCompendiumDocumentHandler';

function index(entries: FoundryManagedPackIndexEntry[]): FoundryManagedPackIndex {
  return {
    size: entries.length,
    keys: () => entries.map(entry => entry._id),
    forEach: fn => entries.forEach(fn)
  };
}

const adventureClass: FoundryAdventureClass = {
  contentFields: { actors: { documentName: 'Actor' }, macros: { documentName: 'Macro' }, folders: { documentName: 'Folder' } },
  prototype: { prepareImport: () => undefined, import: () => undefined }
};

function setup(allowsScripts: boolean): {
  deps: CompendiumHandlerDependencies;
  macroPack: ReturnType<typeof fakePack>;
  itemDocument: FoundryPackDocumentLike;
  adventure: { prepareImport: jest.Mock; import: jest.Mock };
} {
  const macros = [
    packDocument('m1', { name: 'Light', type: 'chat', _source: { folder: 'mf1' } }),
    packDocument('m2', { name: 'Fireworks', type: 'script', _source: { folder: 'mf1' } })
  ];
  const macroFolders = [packFolder('mf1', 'Tricks')];
  const macroPack = fakePack({
    collection: 'world.macros',
    title: 'Macros',
    metadata: { label: 'Macros', type: 'Macro', system: 'dnd5e', packageType: 'world', packageName: 'my-world' },
    folders: { contents: macroFolders, get: (id: string) => macroFolders.find(folder => folder.id === id) },
    getIndex: jest.fn().mockResolvedValue(
      index([
        { _id: 'm1', name: 'Light', type: 'chat', folder: 'mf1' },
        { _id: 'm2', name: 'Fireworks', type: 'script', folder: 'mf1' }
      ])
    ),
    getDocuments: jest.fn((query?: Record<string, unknown>) => {
      const ids = query?.['_id__in'];
      return Promise.resolve(Array.isArray(ids) ? macros.filter(macro => ids.includes(macro.id)) : macros);
    })
  });
  const itemDocument = packDocument('i1', {
    uuid: 'Compendium.world.items.Item.i1',
    name: 'Bow',
    type: 'weapon',
    toObject: () => ({ _id: 'i1', name: 'Bow', flags: { 'midi-qol': { onUseMacroName: 'Stored' } } })
  });
  const itemPack = fakePack({
    collection: 'world.items',
    metadata: { label: 'Items', type: 'Item', system: 'dnd5e', packageType: 'world', packageName: 'my-world' },
    getDocument: jest.fn((id: string) => Promise.resolve(id === 'i1' ? itemDocument : null))
  });
  const adventure = {
    id: 'adv1',
    uuid: 'Compendium.world.adventures.Adventure.adv1',
    name: 'Lost Mine',
    prepareImport: jest.fn(() =>
      Promise.resolve({
        toCreate: {
          Actor: [{ _id: 'a9', name: 'Goblin' }],
          Macro: [{ _id: 'm7', name: 'Trap', type: 'script' }]
        },
        toUpdate: {},
        documentCount: 2
      })
    ),
    import: jest.fn().mockResolvedValue({ created: { Actor: [{ id: 'a9', name: 'Goblin' }] }, updated: {} })
  };
  const adventures = fakePack({
    collection: 'world.adventures',
    metadata: { label: 'Adventures', type: 'Adventure', system: 'dnd5e', packageType: 'world', packageName: 'my-world' },
    getDocument: jest.fn(() => Promise.resolve(adventure as unknown as FoundryPackDocumentLike))
  });
  const world = fakeWorld({ packs: [macroPack, itemPack, adventures] });
  world.collections.set('Macro', worldCollection());
  const folders: FoundryFolderClass = {
    createDocuments: jest.fn((data: Record<string, unknown>[]) =>
      Promise.resolve(data.map(entry => ({ id: String(entry['_id'] ?? 'root'), name: String(entry['name']) })))
    )
  };
  const deps: CompendiumHandlerDependencies = {
    gameProvider: world.provider,
    globals: fakeGlobals({ adventureClass: () => adventureClass, folderClass: () => folders }),
    generation: () => 14,
    scripts: { allowsScripts: () => allowsScripts }
  };
  return { deps, macroPack, itemDocument, adventure };
}

describe('compendium handlers without the script opt-in', () => {
  it('import-compendium leaves script macros in the pack and reports them', async () => {
    const { deps, macroPack } = setup(false);
    expect(await createImportCompendiumHandler(deps)({ packId: 'world.macros' })).toEqual({
      packId: 'world.macros',
      folder: { id: 'root', name: 'Macros' },
      importedCount: 1,
      documents: [{ id: 'new0', name: 'Light' }],
      skippedScriptMacros: [{ id: 'm2', name: 'Fireworks' }]
    });
    expect(macroPack.importAll).not.toHaveBeenCalled();
  });

  it('import-compendium-folder leaves the folder\'s script macros in the pack', async () => {
    const { deps } = setup(false);
    expect(await createImportCompendiumFolderHandler(deps)({ packId: 'world.macros', packFolderId: 'mf1' })).toEqual({
      packId: 'world.macros',
      packFolderId: 'mf1',
      folder: { id: 'mf1', name: 'Tricks' },
      createdFolderCount: 1,
      importedCount: 1,
      documents: [{ id: 'new0', name: 'Light' }],
      skippedScriptMacros: [{ id: 'm2', name: 'Fireworks' }]
    });
  });

  it('import-adventure leaves the adventure\'s script macros out', async () => {
    const { deps, adventure } = setup(false);
    expect(await createImportAdventureHandler(deps)({ packId: 'world.adventures', adventureId: 'adv1' })).toEqual({
      packId: 'world.adventures',
      adventureId: 'adv1',
      name: 'Lost Mine',
      createdCount: 1,
      updatedCount: 0,
      created: [{ documentType: 'Actor', count: 1, documents: [{ id: 'a9', name: 'Goblin' }] }],
      updated: [],
      skippedScriptMacros: []
    });
    const options = adventure.import.mock.calls[0]?.[0] as { preImport: unknown[] };
    expect(options.preImport).toHaveLength(2);
  });

  it('update-compendium-document refuses a new carrier and lets an unchanged one through', async () => {
    const { deps, itemDocument } = setup(false);
    const handler = createUpdateCompendiumDocumentHandler(deps);
    await expect(
      handler({ packId: 'world.items', documentId: 'i1', changes: { 'flags.midi-qol.onUseMacroName': 'Boom' } })
    ).rejects.toThrow(
      'Script macros are disabled: flags.midi-qol.onUseMacroName makes Midi-QOL run a macro. ' +
        'Enable "Allow Script Macros" in module settings to write it via API.'
    );
    expect(itemDocument.update).not.toHaveBeenCalled();
    await handler({ packId: 'world.items', documentId: 'i1', name: 'Longbow', changes: { 'flags.midi-qol.onUseMacroName': 'Stored' } });
    expect(itemDocument.update).toHaveBeenCalledWith({ 'flags.midi-qol.onUseMacroName': 'Stored', name: 'Longbow' });
  });
});

describe('compendium handlers with the script opt-in', () => {
  it('import-compendium imports everything through importAll without the new field', async () => {
    const { deps, macroPack } = setup(true);
    macroPack.importAll.mockResolvedValue([
      { id: 'w1', name: 'Light' },
      { id: 'w2', name: 'Fireworks' }
    ]);
    const result = await createImportCompendiumHandler(deps)({ packId: 'world.macros' });
    expect(result).not.toHaveProperty('skippedScriptMacros');
    expect(result.importedCount).toBe(2);
    expect(macroPack.importAll).toHaveBeenCalledWith({ keepId: false });
  });

  it('update-compendium-document writes a carrier', async () => {
    const { deps, itemDocument } = setup(true);
    await createUpdateCompendiumDocumentHandler(deps)({
      packId: 'world.items',
      documentId: 'i1',
      changes: { 'flags.midi-qol.onUseMacroName': 'Boom' }
    });
    expect(itemDocument.update).toHaveBeenCalledWith({ 'flags.midi-qol.onUseMacroName': 'Boom' });
  });
});
