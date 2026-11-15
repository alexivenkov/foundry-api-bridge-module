import {
  PackFolderNotFoundError,
  PackNotWorldDocumentTypeError,
  WorldFolderTypeMismatchError,
  WorldIdCollisionError
} from '../../domain';
import { CompendiumBulkImportService } from '../CompendiumBulkImportService';
import { FakeBulkImporter, FakePackManager, FakeWorldDirectory, packInfo } from './managementFakes';

const folders = [
  { id: 'pf1', name: 'Undead', parentId: null },
  { id: 'pf2', name: 'Ghouls', parentId: 'pf1' },
  { id: 'pf3', name: 'Beasts', parentId: null }
];

function setup(info = packInfo({ folders })): {
  service: CompendiumBulkImportService;
  importer: FakeBulkImporter;
  world: FakeWorldDirectory;
} {
  const packs = new FakePackManager(info, packInfo({ id: 'world.adv', type: 'Adventure' }));
  const world = new FakeWorldDirectory().addFolder('wf1', 'Actor').addFolder('wf2', 'Scene');
  const importer = new FakeBulkImporter();
  importer.placements = [
    { id: 'd1', folderId: 'pf1' },
    { id: 'd2', folderId: 'pf2' },
    { id: 'd3', folderId: 'pf3' },
    { id: 'd4', folderId: null }
  ];
  return { service: new CompendiumBulkImportService({ packs, world, importer }), importer, world };
}

describe('CompendiumBulkImportService', () => {
  describe('importPack', () => {
    it('imports the pack into an existing folder of its type', async () => {
      const { service, importer } = setup();
      const outcome = await service.importPack({ packId: 'world.monsters', folderId: 'wf1', keepId: false });
      expect(importer.packImports).toEqual([
        { packId: 'world.monsters', options: { folderId: 'wf1', folderName: undefined, keepId: false } }
      ]);
      expect(outcome.documents).toHaveLength(1);
    });

    it('refuses Adventure packs and folders of another type', async () => {
      const { service } = setup();
      await expect(service.importPack({ packId: 'world.adv', keepId: false })).rejects.toThrow(PackNotWorldDocumentTypeError);
      await expect(service.importPack({ packId: 'world.monsters', folderId: 'wf2', keepId: false })).rejects.toThrow(
        WorldFolderTypeMismatchError
      );
    });

    it('refuses keepId when a pack id is taken in the world', async () => {
      const { service, importer, world } = setup();
      world.addDocument('Actor', 'd3');
      await expect(service.importPack({ packId: 'world.monsters', keepId: true })).rejects.toThrow(
        new WorldIdCollisionError('world.monsters', 1)
      );
      expect(importer.packImports).toEqual([]);
    });
  });

  describe('importPackFolder', () => {
    it('imports the folder subtree and only its documents', async () => {
      const { service, importer } = setup();
      const outcome = await service.importPackFolder({
        packId: 'world.monsters',
        packFolderId: 'pf1',
        folderId: 'wf1',
        keepId: true
      });
      expect(importer.folderImports).toEqual([
        {
          packId: 'world.monsters',
          plan: { folderIds: ['pf1', 'pf2'], documentIds: ['d1', 'd2'], parentFolderId: 'wf1', keepId: true }
        }
      ]);
      expect(outcome.createdFolderCount).toBe(2);
    });

    it('puts the subtree at the directory root without a target folder', async () => {
      const { service, importer } = setup();
      await service.importPackFolder({ packId: 'world.monsters', packFolderId: 'pf3', keepId: false });
      expect(importer.folderImports[0]?.plan).toEqual({
        folderIds: ['pf3'],
        documentIds: ['d3'],
        parentFolderId: null,
        keepId: false
      });
    });

    it('refuses a missing pack folder and keepId collisions inside the subtree', async () => {
      const { service, world } = setup();
      await expect(service.importPackFolder({ packId: 'world.monsters', packFolderId: 'nope', keepId: false })).rejects.toThrow(
        PackFolderNotFoundError
      );
      world.addDocument('Actor', 'd2');
      await expect(service.importPackFolder({ packId: 'world.monsters', packFolderId: 'pf1', keepId: true })).rejects.toThrow(
        WorldIdCollisionError
      );
      await expect(
        service.importPackFolder({ packId: 'world.monsters', packFolderId: 'pf3', keepId: true })
      ).resolves.toBeDefined();
    });
  });
});
