import {
  FolderExportFailedError,
  PackDocumentExportFailedError,
  PackDocumentNotFoundError,
  PackFolderNotFoundError,
  PackLockedError,
  PackNotWorldDocumentTypeError,
  WorldDocumentNotFoundError,
  WorldFolderTypeMismatchError
} from '../../domain';
import { CompendiumWritingService } from '../CompendiumWritingService';
import { FakePackContentWriter, FakePackManager, FakeWorldDirectory, documentRef, packInfo } from './managementFakes';

const folders = [{ id: 'pf1', name: 'Undead', parentId: null }];

function setup(...infos: ReturnType<typeof packInfo>[]): {
  service: CompendiumWritingService;
  writer: FakePackContentWriter;
} {
  const packs = new FakePackManager(...(infos.length > 0 ? infos : [packInfo({ folders })]));
  const world = new FakeWorldDirectory().addDocument('Actor', 'a1', 'Goblin').addFolder('wf1', 'Actor').addFolder('wf2', 'Item');
  const writer = new FakePackContentWriter();
  writer.documents.set('world.monsters/d1', documentRef());
  return { service: new CompendiumWritingService({ packs, world, writer }), writer };
}

describe('CompendiumWritingService', () => {
  describe('exportDocument', () => {
    it('exports a world document into a pack folder', async () => {
      const { service, writer } = setup();
      const result = await service.exportDocument({ packId: 'world.monsters', documentId: 'a1', name: 'Copy', folderId: 'pf1' });
      expect(writer.exports).toEqual([
        { packId: 'world.monsters', request: { documentId: 'a1', name: 'Copy', folderId: 'pf1' } }
      ]);
      expect(result).toMatchObject({ packId: 'world.monsters', sourceId: 'a1', document: { id: 'new1' } });
    });

    it('refuses a locked pack without unlocking it', async () => {
      const { service, writer } = setup(packInfo({ locked: true }));
      await expect(service.exportDocument({ packId: 'world.monsters', documentId: 'a1' })).rejects.toThrow(PackLockedError);
      expect(writer.exports).toEqual([]);
    });

    it('refuses an Adventure pack, a missing world document and a missing pack folder', async () => {
      const adventure = setup(packInfo({ id: 'world.adv', type: 'Adventure' }));
      await expect(adventure.service.exportDocument({ packId: 'world.adv', documentId: 'a1' })).rejects.toThrow(
        PackNotWorldDocumentTypeError
      );
      const { service } = setup();
      await expect(service.exportDocument({ packId: 'world.monsters', documentId: 'gone' })).rejects.toThrow(
        new WorldDocumentNotFoundError('Actor', 'gone')
      );
      await expect(service.exportDocument({ packId: 'world.monsters', documentId: 'a1', folderId: 'nope' })).rejects.toThrow(
        PackFolderNotFoundError
      );
    });

    it('reports an export the core did not perform', async () => {
      const { service, writer } = setup();
      writer.exportResult = null;
      await expect(service.exportDocument({ packId: 'world.monsters', documentId: 'a1' })).rejects.toThrow(
        PackDocumentExportFailedError
      );
    });
  });

  describe('exportFolder', () => {
    const command = { packId: 'world.monsters', folderId: 'wf1', keepFolders: true, updateByName: false, keepId: false };

    it('exports a folder of the pack type', async () => {
      const { service, writer } = setup();
      expect(await service.exportFolder({ ...command, packFolderId: 'pf1' })).toEqual({
        exportedCount: 3,
        createdCount: 2,
        updatedCount: 1,
        documentCount: 5
      });
      expect(writer.folderExports[0]?.options).toEqual({
        packFolderId: 'pf1',
        keepFolders: true,
        updateByName: false,
        keepId: false
      });
    });

    it('refuses a folder of another type and a missing pack folder', async () => {
      const { service } = setup();
      await expect(service.exportFolder({ ...command, folderId: 'wf2' })).rejects.toThrow(WorldFolderTypeMismatchError);
      await expect(service.exportFolder({ ...command, packFolderId: 'nope' })).rejects.toThrow(PackFolderNotFoundError);
    });

    it('reports a folder tree the core refused', async () => {
      const { service, writer } = setup();
      writer.folderOutcome = null;
      await expect(service.exportFolder(command)).rejects.toThrow(FolderExportFailedError);
    });
  });

  describe('updateDocument', () => {
    it('updates a document of an unlocked pack', async () => {
      const { service, writer } = setup();
      const document = await service.updateDocument({
        packId: 'world.monsters',
        documentId: 'd1',
        name: 'Hobgoblin',
        folderId: null,
        changes: { 'system.hp': 5 }
      });
      expect(writer.updates).toEqual([
        { packId: 'world.monsters', documentId: 'd1', changes: { name: 'Hobgoblin', folderId: null, changes: { 'system.hp': 5 } } }
      ]);
      expect(document.name).toBe('Hobgoblin');
    });

    it('refuses a missing document and a missing pack folder', async () => {
      const { service } = setup();
      await expect(service.updateDocument({ packId: 'world.monsters', documentId: 'gone' })).rejects.toThrow(
        PackDocumentNotFoundError
      );
      await expect(service.updateDocument({ packId: 'world.monsters', documentId: 'd1', folderId: 'nope' })).rejects.toThrow(
        PackFolderNotFoundError
      );
    });
  });

  describe('deleteDocument', () => {
    it('deletes and reports the document', async () => {
      const { service, writer } = setup();
      expect(await service.deleteDocument({ packId: 'world.monsters', documentId: 'd1' })).toEqual({
        packId: 'world.monsters',
        documentId: 'd1',
        name: 'Goblin'
      });
      expect(writer.deletions).toEqual([{ packId: 'world.monsters', documentId: 'd1' }]);
    });

    it('refuses a locked pack', async () => {
      const { service } = setup(packInfo({ locked: true }));
      await expect(service.deleteDocument({ packId: 'world.monsters', documentId: 'd1' })).rejects.toThrow(PackLockedError);
    });
  });
});
