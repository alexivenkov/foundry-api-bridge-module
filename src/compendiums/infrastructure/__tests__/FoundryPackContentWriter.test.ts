import { PackDocumentNotFoundError } from '../../domain';
import { FoundryPackContentWriter } from '../FoundryPackContentWriter';
import { fakePack, fakeWorld, packDocument, packIndex, worldFolder } from './managementFixtures';

describe('FoundryPackContentWriter', () => {
  describe('exportWorldDocument', () => {
    it('imports the world document itself as a new document at the pack root', async () => {
      const world = fakeWorld();
      const pack = world.packs.get('world.monsters');
      pack?.importDocument.mockResolvedValue(packDocument('n1', { name: 'Goblin' }));
      const writer = new FoundryPackContentWriter(world.provider);

      const ref = await writer.exportWorldDocument('world.monsters', { documentId: 'a1' });

      const [document, options] = pack?.importDocument.mock.calls[0] as [{ id: string; cloned?: boolean }, unknown];
      expect(document.id).toBe('a1');
      expect(document.cloned).toBeUndefined();
      expect(options).toEqual({ keepId: false, clearFolder: true });
      expect(ref).toEqual({
        id: 'n1',
        uuid: 'Compendium.world.monsters.Actor.n1',
        name: 'Goblin',
        type: 'npc',
        img: 'icons/goblin.webp',
        folderId: null
      });
    });

    it('exports a clone carrying the new name and pack folder', async () => {
      const world = fakeWorld();
      const pack = world.packs.get('world.monsters');
      pack?.importDocument.mockResolvedValue(packDocument('n1', { _source: { folder: 'pf1' } }));
      const source = world.collections.get('Actor')?.get('a1') as unknown as { clone: jest.Mock };
      const writer = new FoundryPackContentWriter(world.provider);

      const ref = await writer.exportWorldDocument('world.monsters', { documentId: 'a1', name: 'Copy', folderId: 'pf1' });

      expect(source.clone).toHaveBeenCalledWith({ name: 'Copy', folder: 'pf1' }, { keepId: true });
      const [document, options] = pack?.importDocument.mock.calls[0] as [{ cloned?: boolean }, unknown];
      expect(document.cloned).toBe(true);
      expect(options).toEqual({ keepId: false, clearFolder: false });
      expect(ref?.folderId).toBe('pf1');
    });

    it('returns null when the core created nothing or the source is gone', async () => {
      const world = fakeWorld();
      world.packs.get('world.monsters')?.importDocument.mockResolvedValue(undefined);
      const writer = new FoundryPackContentWriter(world.provider);
      expect(await writer.exportWorldDocument('world.monsters', { documentId: 'a1' })).toBeNull();
      expect(await writer.exportWorldDocument('world.monsters', { documentId: 'gone' })).toBeNull();
    });
  });

  describe('exportWorldFolder', () => {
    it('passes the core options and counts created and overwritten documents from the index', async () => {
      const index = packIndex([{ _id: 'd1' }, { _id: 'd2' }]);
      const pack = fakePack({ index });
      const sub = worldFolder('wf2', 'Actor', { contents: [{}] });
      const folder = worldFolder('wf1', 'Actor', { contents: [{}, {}], getSubfolders: () => [sub] });
      folder.exportToCompendium.mockImplementation(() => {
        index.entries.push({ _id: 'd3' });
        return Promise.resolve(pack);
      });
      const world = fakeWorld({ packs: [pack], folders: [folder, sub] });
      const writer = new FoundryPackContentWriter(world.provider);

      const outcome = await writer.exportWorldFolder('world.monsters', 'wf1', {
        packFolderId: 'pf1',
        keepFolders: true,
        updateByName: true,
        keepId: false
      });

      expect(folder.exportToCompendium).toHaveBeenCalledWith(pack, {
        updateByName: true,
        keepId: false,
        keepFolders: true,
        folder: 'pf1'
      });
      expect(outcome).toEqual({ exportedCount: 3, createdCount: 1, updatedCount: 2, documentCount: 3 });
    });

    it('returns null when the core answers with a notification instead of the pack', async () => {
      const folder = worldFolder('wf1', 'Actor');
      folder.exportToCompendium.mockResolvedValue({ message: 'too deep' });
      const writer = new FoundryPackContentWriter(fakeWorld({ folders: [folder] }).provider);
      expect(
        await writer.exportWorldFolder('world.monsters', 'wf1', { keepFolders: false, updateByName: false, keepId: false })
      ).toBeNull();
      expect(folder.exportToCompendium.mock.calls[0]?.[1]).toEqual({ updateByName: false, keepId: false, keepFolders: false });
    });
  });

  describe('updateDocument / deleteDocument / findDocument', () => {
    it('merges the opaque changes under name and folder', async () => {
      const world = fakeWorld();
      const writer = new FoundryPackContentWriter(world.provider);
      const document = await world.packs.get('world.monsters')?.getDocument('d1') as unknown as { update: jest.Mock };

      await writer.updateDocument('world.monsters', 'd1', {
        name: 'Ghoul',
        folderId: null,
        changes: { name: 'ignored', folder: 'x', 'system.hp': 5 }
      });

      expect(document.update).toHaveBeenCalledWith({ name: 'Ghoul', folder: null, 'system.hp': 5 });
    });

    it('skips an empty update and refuses a missing document', async () => {
      const world = fakeWorld();
      const writer = new FoundryPackContentWriter(world.provider);
      const document = await world.packs.get('world.monsters')?.getDocument('d2') as unknown as { update: jest.Mock };
      await writer.updateDocument('world.monsters', 'd2', {});
      expect(document.update).not.toHaveBeenCalled();
      await expect(writer.updateDocument('world.monsters', 'gone', {})).rejects.toThrow(PackDocumentNotFoundError);
    });

    it('deletes and finds documents', async () => {
      const world = fakeWorld();
      const writer = new FoundryPackContentWriter(world.provider);
      const document = await world.packs.get('world.monsters')?.getDocument('d1') as unknown as { delete: jest.Mock };
      expect((await writer.findDocument('world.monsters', 'd1'))?.folderId).toBe('pf1');
      expect(await writer.findDocument('world.monsters', 'gone')).toBeNull();
      expect(await writer.findDocument('nope', 'd1')).toBeNull();
      await writer.deleteDocument('world.monsters', 'd1');
      expect(document.delete).toHaveBeenCalled();
    });
  });
});
