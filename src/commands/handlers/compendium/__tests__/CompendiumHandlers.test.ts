import { ValidationError } from '../../../../kernel';
import type { FoundryAdventureClass } from '../../../../compendiums/infrastructure/foundryAdventureTypes';
import type { FoundryPackDocumentLike } from '../../../../compendiums/infrastructure/foundryPackManagementTypes';
import {
  fakeGlobals,
  fakePack,
  fakeWorld,
  packDocument,
  worldFolder,
  type FakeWorld
} from '../../../../compendiums/infrastructure/__tests__/managementFixtures';
import type { CompendiumHandlerDependencies } from '../GetCompendiumInfoHandler';
import { createGetCompendiumInfoHandler } from '../GetCompendiumInfoHandler';
import { createCreateCompendiumHandler } from '../CreateCompendiumHandler';
import { createDuplicateCompendiumHandler } from '../DuplicateCompendiumHandler';
import { createConfigureCompendiumHandler } from '../ConfigureCompendiumHandler';
import { createDeleteCompendiumHandler } from '../DeleteCompendiumHandler';
import { createExportToCompendiumHandler } from '../ExportToCompendiumHandler';
import { createExportFolderToCompendiumHandler } from '../ExportFolderToCompendiumHandler';
import { createUpdateCompendiumDocumentHandler } from '../UpdateCompendiumDocumentHandler';
import { createDeleteCompendiumDocumentHandler } from '../DeleteCompendiumDocumentHandler';
import { createImportCompendiumHandler } from '../ImportCompendiumHandler';
import { createImportCompendiumFolderHandler } from '../ImportCompendiumFolderHandler';
import { createGetAdventureHandler } from '../GetAdventureHandler';
import { createImportAdventureHandler } from '../ImportAdventureHandler';

const adventureClass: FoundryAdventureClass = {
  contentFields: { actors: { documentName: 'Actor' }, scenes: { documentName: 'Scene' }, folders: { documentName: 'Folder' } },
  prototype: { prepareImport: () => undefined, import: () => undefined }
};

function adventureDocument(toUpdate: Record<string, { _id: string; name: string }[]> = {}): {
  id: string;
  uuid: string;
  name: string;
  prepareImport: jest.Mock;
  import: jest.Mock;
} {
  return {
    id: 'adv1',
    uuid: 'Compendium.world.adventures.Adventure.adv1',
    name: 'Lost Mine',
    prepareImport: jest.fn().mockResolvedValue({ toCreate: { Actor: [{ _id: 'a9', name: 'Goblin' }] }, toUpdate, documentCount: 1 }),
    import: jest.fn().mockResolvedValue({ created: { Actor: [{ id: 'a9', name: 'Goblin' }] }, updated: {} })
  };
}

interface Setup {
  world: FakeWorld;
  deps: CompendiumHandlerDependencies;
  createCompendium: jest.Mock;
  adventure: ReturnType<typeof adventureDocument>;
}

function setup(adventure = adventureDocument()): Setup {
  const modulePack = fakePack({
    collection: 'dnd5e.monsters',
    locked: true,
    metadata: { label: 'Monsters (SRD)', type: 'Actor', system: 'dnd5e', packageType: 'system', packageName: 'dnd5e' }
  });
  const adventures = fakePack({
    collection: 'world.adventures',
    metadata: { label: 'Adventures', type: 'Adventure', system: 'dnd5e', packageType: 'world', packageName: 'my-world' },
    getDocument: jest.fn((id: string) =>
      Promise.resolve(id === 'adv1' ? (adventure as unknown as FoundryPackDocumentLike) : null)
    )
  });
  const world = fakeWorld({ packs: [fakePack(), modulePack, adventures] });
  const createCompendium = jest.fn((metadata: { label: string; type: string }) => {
    const pack = fakePack({
      collection: 'world.loot',
      metadata: { label: metadata.label, type: metadata.type, system: 'dnd5e', packageType: 'world', packageName: 'my-world' }
    });
    world.packs.set(pack.collection, pack);
    return Promise.resolve(pack);
  });
  const globals = fakeGlobals({
    compendiumCollectionClass: () => ({ createCompendium }),
    adventureClass: () => adventureClass,
    folderClass: () => ({ createDocuments: jest.fn().mockResolvedValue([]) })
  });
  return { world, deps: { gameProvider: world.provider, globals, generation: () => 14 }, createCompendium, adventure };
}

describe('compendium management handlers', () => {
  it('get-compendium-info returns the wire snapshot', async () => {
    const { deps } = setup();
    expect(await createGetCompendiumInfoHandler(deps)({ packId: 'dnd5e.monsters' })).toEqual({
      id: 'dnd5e.monsters',
      label: 'Monsters (SRD)',
      documentType: 'Actor',
      system: 'dnd5e',
      packageType: 'system',
      packageName: 'dnd5e',
      locked: true,
      ownership: { player: 'observer', trusted: 'inherit', assistant: 'owner' },
      folderId: null,
      documentCount: 2,
      folders: [
        { id: 'pf1', name: 'Undead', parentId: null },
        { id: 'pf2', name: 'Ghouls', parentId: 'pf1' }
      ]
    });
  });

  it('get-compendium-info refuses an unknown pack and an empty id', async () => {
    const handler = createGetCompendiumInfoHandler(setup().deps);
    await expect(handler({ packId: 'nope' })).rejects.toThrow('Pack not found: nope');
    await expect(handler({ packId: '' })).rejects.toThrow(ValidationError);
  });

  it('create-compendium creates a world pack in a Compendium folder', async () => {
    const { deps, world, createCompendium } = setup();
    const result = await createCreateCompendiumHandler(deps)({ label: 'Loot', documentType: 'Item', folderId: 'cf1' });
    expect(createCompendium).toHaveBeenCalledWith({ label: 'Loot', type: 'Item' });
    expect(world.packs.get('world.loot')?.configure).toHaveBeenCalledWith({ folder: 'cf1' });
    expect(result).toMatchObject({ id: 'world.loot', documentType: 'Item' });
  });

  it('create-compendium validates the type and refuses a taken id', async () => {
    const handler = createCreateCompendiumHandler(setup().deps);
    await expect(handler({ label: 'X', documentType: 'Folder' as never })).rejects.toThrow(ValidationError);
    await expect(handler({ label: 'Monsters', documentType: 'Actor' })).rejects.toThrow(
      'Compendium pack already exists: world.monsters'
    );
  });

  it('duplicate-compendium copies a locked system pack', async () => {
    const { deps, world } = setup();
    const source = world.packs.get('dnd5e.monsters');
    source?.duplicateCompendium.mockImplementation(({ label }: { label: string }) => {
      const copy = fakePack({ collection: 'world.copy-of-monsters-srd', metadata: { label, type: 'Actor', packageType: 'world' } });
      world.packs.set(copy.collection, copy);
      return Promise.resolve(copy);
    });
    const result = await createDuplicateCompendiumHandler(deps)({ packId: 'dnd5e.monsters' });
    expect(source?.duplicateCompendium).toHaveBeenCalledWith({ label: 'Copy of Monsters (SRD)' });
    expect(result.id).toBe('world.copy-of-monsters-srd');
  });

  it('configure-compendium writes the merged configuration', async () => {
    const { deps, world } = setup();
    await createConfigureCompendiumHandler(deps)({ packId: 'world.monsters', locked: true, ownership: { player: 'none' } });
    expect(world.packs.get('world.monsters')?.configure).toHaveBeenCalledWith({
      locked: true,
      ownership: { GAMEMASTER: 'OWNER', ASSISTANT: 'OWNER', TRUSTED: 'INHERIT', PLAYER: 'NONE' }
    });
  });

  it('delete-compendium deletes a world pack and refuses a system pack', async () => {
    const { deps, world } = setup();
    const handler = createDeleteCompendiumHandler(deps);
    await expect(handler({ packId: 'dnd5e.monsters' })).rejects.toThrow(
      'Only world compendium packs can be deleted; dnd5e.monsters belongs to the system dnd5e'
    );
    expect(await handler({ packId: 'world.monsters' })).toEqual({
      deleted: true,
      packId: 'world.monsters',
      label: 'Monsters',
      documentCount: 2
    });
    expect(world.packs.get('world.monsters')?.deleteCompendium).toHaveBeenCalled();
  });

  it('export-to-compendium copies a world actor and refuses a locked pack', async () => {
    const { deps, world } = setup();
    world.packs.get('world.monsters')?.importDocument.mockResolvedValue(packDocument('n1', { name: 'Goblin' }));
    const handler = createExportToCompendiumHandler(deps);
    const result = await handler({ packId: 'world.monsters', documentId: 'a1' });
    expect(result).toMatchObject({ packId: 'world.monsters', sourceId: 'a1', document: { id: 'n1', folderId: null } });
    await expect(handler({ packId: 'dnd5e.monsters', documentId: 'a1' })).rejects.toThrow(
      'Compendium pack is locked: dnd5e.monsters; unlock it with configure-compendium first'
    );
    await expect(handler({ packId: 'world.monsters', documentId: 'gone' })).rejects.toThrow('Actor not found: gone');
  });

  it('export-folder-to-compendium reports the counts', async () => {
    const { deps, world } = setup();
    const pack = world.packs.get('world.monsters');
    const folder = worldFolder('wf9', 'Actor', { contents: [{}] });
    folder.exportToCompendium.mockResolvedValue(pack);
    world.folders.push(folder);
    expect(await createExportFolderToCompendiumHandler(deps)({ packId: 'world.monsters', folderId: 'wf9' })).toEqual({
      packId: 'world.monsters',
      folderId: 'wf9',
      exportedCount: 1,
      createdCount: 0,
      updatedCount: 1,
      documentCount: 2
    });
  });

  it('update-compendium-document and delete-compendium-document', async () => {
    const { deps, world } = setup();
    const document = (await world.packs.get('world.monsters')?.getDocument('d1')) as unknown as { update: jest.Mock; delete: jest.Mock };
    const updated = await createUpdateCompendiumDocumentHandler(deps)({
      packId: 'world.monsters',
      documentId: 'd1',
      folderId: null
    });
    expect(document.update).toHaveBeenCalledWith({ folder: null });
    expect(updated).toMatchObject({ packId: 'world.monsters', document: { id: 'd1' } });
    await expect(
      createUpdateCompendiumDocumentHandler(deps)({ packId: 'world.monsters', documentId: 'gone' })
    ).rejects.toThrow('Document not found in pack world.monsters: gone');
    expect(await createDeleteCompendiumDocumentHandler(deps)({ packId: 'world.monsters', documentId: 'd1' })).toEqual({
      deleted: true,
      packId: 'world.monsters',
      documentId: 'd1',
      name: 'Doc d1'
    });
    expect(document.delete).toHaveBeenCalled();
  });

  it('import-compendium imports a whole pack into a world folder', async () => {
    const { deps, world } = setup();
    world.packs.get('world.monsters')?.importAll.mockResolvedValue([{ id: 'w1', name: 'Goblin' }]);
    expect(await createImportCompendiumHandler(deps)({ packId: 'world.monsters', folderId: 'wf1' })).toEqual({
      packId: 'world.monsters',
      folder: { id: 'wf1', name: 'Folder wf1' },
      importedCount: 1,
      documents: [{ id: 'w1', name: 'Goblin' }]
    });
    await expect(createImportCompendiumHandler(deps)({ packId: 'world.adventures' })).rejects.toThrow(
      'Compendium pack world.adventures holds Adventure documents, which are not world documents; use import-adventure'
    );
  });

  it('import-compendium-folder imports one pack folder', async () => {
    const { deps } = setup();
    const result = await createImportCompendiumFolderHandler(deps)({ packId: 'world.monsters', packFolderId: 'pf2' });
    expect(result).toEqual({
      packId: 'world.monsters',
      packFolderId: 'pf2',
      folder: { id: 'pf2', name: 'Ghouls' },
      createdFolderCount: 0,
      importedCount: 0,
      documents: []
    });
    await expect(
      createImportCompendiumFolderHandler(deps)({ packId: 'world.monsters', packFolderId: 'nope' })
    ).rejects.toThrow('Folder not found in pack world.monsters: nope');
  });

  it('get-adventure lists the content and what exists in the world', async () => {
    const { deps } = setup(adventureDocument({ Scene: [{ _id: 's1', name: 'Cave' }] }));
    expect(await createGetAdventureHandler(deps)({ packId: 'world.adventures', adventureId: 'adv1' })).toEqual({
      packId: 'world.adventures',
      adventureId: 'adv1',
      uuid: 'Compendium.world.adventures.Adventure.adv1',
      name: 'Lost Mine',
      img: null,
      caption: '',
      description: '',
      imported: false,
      contents: [
        { documentType: 'Actor', count: 1, existingCount: 0, documents: [{ id: 'a9', name: 'Goblin', existsInWorld: false }] },
        { documentType: 'Scene', count: 1, existingCount: 1, documents: [{ id: 's1', name: 'Cave', existsInWorld: true }] }
      ],
      totalCount: 2,
      existingCount: 1
    });
    await expect(createGetAdventureHandler(deps)({ packId: 'world.monsters', adventureId: 'adv1' })).rejects.toThrow(
      'Compendium pack is not an Adventure pack: world.monsters'
    );
  });

  it('import-adventure refuses to overwrite without overwrite: true and imports with it', async () => {
    const { deps, adventure } = setup(adventureDocument({ Scene: [{ _id: 's1', name: 'Cave' }] }));
    const handler = createImportAdventureHandler(deps);
    await expect(handler({ packId: 'world.adventures', adventureId: 'adv1' })).rejects.toThrow(
      'Importing adventure Lost Mine would overwrite 1 existing world document(s) (Scene 1); pass overwrite: true to replace them'
    );
    expect(adventure.import).not.toHaveBeenCalled();

    expect(await handler({ packId: 'world.adventures', adventureId: 'adv1', overwrite: true })).toEqual({
      packId: 'world.adventures',
      adventureId: 'adv1',
      name: 'Lost Mine',
      createdCount: 1,
      updatedCount: 0,
      created: [{ documentType: 'Actor', count: 1, documents: [{ id: 'a9', name: 'Goblin' }] }],
      updated: []
    });
    expect(adventure.import).toHaveBeenCalledWith({ dialog: false, importFields: [], preImport: [] });
  });
});
