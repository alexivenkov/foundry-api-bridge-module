import { WorldDocumentClassUnavailableError } from '../../domain';
import { FoundryWorldBulkImporter } from '../FoundryWorldBulkImporter';
import type { FoundryFolderClass } from '../foundryPackManagementTypes';
import { fakeGlobals, fakePack, fakeWorld, packDocument, worldFolder } from './managementFixtures';

function folderClass(): FoundryFolderClass & { createDocuments: jest.Mock } {
  return {
    createDocuments: jest.fn((data: Record<string, unknown>[]) =>
      Promise.resolve(data.map(entry => ({ id: String(entry['_id']), name: String(entry['name']) })))
    )
  };
}

describe('FoundryWorldBulkImporter', () => {
  it('reads the folder of every pack document from the index', async () => {
    const world = fakeWorld();
    const importer = new FoundryWorldBulkImporter(world.provider, fakeGlobals(), () => 14);
    expect(await importer.readDocumentPlacements('world.monsters')).toEqual([
      { id: 'd1', folderId: 'pf1' },
      { id: 'd2', folderId: null }
    ]);
    expect(world.packs.get('world.monsters')?.getIndex).toHaveBeenCalledWith({ fields: ['folder'] });
  });

  describe('importPack', () => {
    it('imports into an existing folder', async () => {
      const world = fakeWorld();
      const pack = world.packs.get('world.monsters');
      pack?.importAll.mockResolvedValue([{ id: 'w1', name: 'Goblin' }]);
      const importer = new FoundryWorldBulkImporter(world.provider, fakeGlobals(), () => 14);

      const outcome = await importer.importPack('world.monsters', { folderId: 'wf1', keepId: true });

      expect(pack?.importAll).toHaveBeenCalledWith({ keepId: true, folderId: 'wf1' });
      expect(outcome).toEqual({ folder: { id: 'wf1', name: 'Folder wf1' }, documents: [{ id: 'w1', name: 'Goblin' }] });
    });

    it('finds the top-level folder importAll created', async () => {
      const world = fakeWorld();
      const pack = world.packs.get('world.monsters');
      pack?.importAll.mockImplementation(() => {
        world.folders.push(worldFolder('other', 'Actor', { name: 'Bestiary', _source: { folder: 'wf1' } }));
        world.folders.push(worldFolder('new', 'Actor', { name: 'Bestiary' }));
        return Promise.resolve([]);
      });
      const importer = new FoundryWorldBulkImporter(world.provider, fakeGlobals(), () => 14);

      const outcome = await importer.importPack('world.monsters', { folderName: 'Bestiary', keepId: false });

      expect(pack?.importAll).toHaveBeenCalledWith({ keepId: false, folderName: 'Bestiary' });
      expect(outcome.folder).toEqual({ id: 'new', name: 'Bestiary' });
    });

    it('defaults the folder name to the pack title', async () => {
      const world = fakeWorld();
      world.packs.get('world.monsters')?.importAll.mockImplementation(() => {
        world.folders.push(worldFolder('new', 'Actor', { name: 'Monsters' }));
        return Promise.resolve([]);
      });
      const importer = new FoundryWorldBulkImporter(world.provider, fakeGlobals(), () => 14);
      expect((await importer.importPack('world.monsters', { keepId: false })).folder).toEqual({ id: 'new', name: 'Monsters' });
    });
  });

  describe('importPackFolder', () => {
    it('creates the missing folders with their ids and the documents through fromCompendium', async () => {
      const world = fakeWorld({ folders: [worldFolder('wf1', 'Actor'), worldFolder('pf2', 'Actor', { name: 'Ghouls' })] });
      const folders = folderClass();
      const importer = new FoundryWorldBulkImporter(world.provider, fakeGlobals({ folderClass: () => folders }), () => 13);
      const pack = world.packs.get('world.monsters');

      const outcome = await importer.importPackFolder('world.monsters', {
        folderIds: ['pf1', 'pf2'],
        documentIds: ['d1'],
        parentFolderId: 'wf1',
        keepId: true
      });

      expect(folders.createDocuments).toHaveBeenCalledWith(
        [{ _id: 'pf1', name: 'Undead', type: 'Actor', folder: 'wf1', sorting: 'a', sort: 0 }],
        { keepId: true }
      );
      expect(pack?.getDocuments).toHaveBeenCalledWith({ _id__in: ['d1'] });
      const collection = world.collections.get('Actor');
      expect(collection?.fromCompendium.mock.calls[0]?.[1]).toEqual({ keepId: true });
      expect(collection?.createDocuments).toHaveBeenCalledWith([{ _id: 'd1', name: 'Doc d1', folder: 'pf1' }], { keepId: true });
      expect(outcome.createdFolderCount).toBe(1);
      expect(outcome.documents).toEqual([{ id: 'd1', name: 'Doc d1' }]);
    });

    it('creates documents in chunks of 100 and loads every document below Foundry 13', async () => {
      const many = Array.from({ length: 150 }, (_, index) => packDocument(`m${String(index)}`));
      const pack = fakePack({ getDocuments: jest.fn().mockResolvedValue([...many, packDocument('other')]) });
      const world = fakeWorld({ packs: [pack] });
      const importer = new FoundryWorldBulkImporter(world.provider, fakeGlobals({ folderClass: folderClass }), () => 12);

      const outcome = await importer.importPackFolder('world.monsters', {
        folderIds: ['pf1'],
        documentIds: many.map(document => document.id),
        parentFolderId: null,
        keepId: false
      });

      expect(pack.getDocuments).toHaveBeenCalledWith();
      const sizes = world.collections.get('Actor')?.createDocuments.mock.calls.map(call => (call[0] as unknown[]).length);
      expect(sizes).toEqual([100, 50]);
      expect(outcome.documents).toHaveLength(150);
      expect(outcome.folder).toEqual({ id: 'pf1', name: 'Undead' });
    });

    it('refuses without a Folder document class', async () => {
      const importer = new FoundryWorldBulkImporter(fakeWorld().provider, fakeGlobals(), () => 14);
      await expect(
        importer.importPackFolder('world.monsters', { folderIds: ['pf1'], documentIds: [], parentFolderId: null, keepId: false })
      ).rejects.toThrow(WorldDocumentClassUnavailableError);
    });
  });
});
