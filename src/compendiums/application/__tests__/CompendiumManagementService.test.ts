import {
  PackAlreadyExistsError,
  PackCreationFailedError,
  PackLockedError,
  PackNotDeletableError,
  PackNotFoundError,
  PackTypeUnsupportedError,
  WorldFolderNotFoundError,
  WorldFolderTypeMismatchError
} from '../../domain';
import { CompendiumManagementService } from '../CompendiumManagementService';
import { FakePackManager, FakeWorldDirectory, packInfo } from './managementFakes';

function setup(...infos: ReturnType<typeof packInfo>[]): {
  service: CompendiumManagementService;
  packs: FakePackManager;
  world: FakeWorldDirectory;
} {
  const packs = new FakePackManager(...infos);
  const world = new FakeWorldDirectory().addFolder('cf1', 'Compendium').addFolder('af1', 'Actor');
  return { service: new CompendiumManagementService({ packs, world }), packs, world };
}

describe('CompendiumManagementService', () => {
  describe('getInfo', () => {
    it('returns the pack snapshot', () => {
      const { service } = setup(packInfo());
      expect(service.getInfo('world.monsters').label).toBe('Monsters');
    });

    it('refuses an unknown pack', () => {
      const { service } = setup();
      expect(() => service.getInfo('nope')).toThrow(PackNotFoundError);
    });
  });

  describe('create', () => {
    it('creates a world pack and returns its snapshot', async () => {
      const { service, packs } = setup();
      const info = await service.create({ label: 'New Pack', documentType: 'Item' });
      expect(packs.created).toEqual([{ label: 'New Pack', documentType: 'Item' }]);
      expect(info).toMatchObject({ id: 'world.new-pack', type: 'Item' });
      expect(packs.configured).toEqual([]);
    });

    it('puts the new pack into a Compendium folder', async () => {
      const { service, packs } = setup();
      const info = await service.create({ label: 'New Pack', documentType: 'Item', folderId: 'cf1' });
      expect(packs.configured).toEqual([{ packId: 'world.new-pack', change: { folderId: 'cf1' } }]);
      expect(info.folderId).toBe('cf1');
    });

    it('refuses a type the Foundry version does not support', async () => {
      const { service, packs } = setup();
      await expect(service.create({ label: 'FX', documentType: 'ActiveEffect' })).rejects.toThrow(PackTypeUnsupportedError);
      expect(packs.created).toEqual([]);
    });

    it('refuses a missing folder or a folder of another type before creating', async () => {
      const { service, packs } = setup();
      await expect(service.create({ label: 'A', documentType: 'Item', folderId: 'gone' })).rejects.toThrow(WorldFolderNotFoundError);
      await expect(service.create({ label: 'A', documentType: 'Item', folderId: 'af1' })).rejects.toThrow(WorldFolderTypeMismatchError);
      expect(packs.created).toEqual([]);
    });

    it('refuses a label whose pack id is taken', async () => {
      const { service } = setup(packInfo());
      await expect(service.create({ label: 'Monsters', documentType: 'Actor' })).rejects.toThrow(
        new PackAlreadyExistsError('world.monsters')
      );
    });

    it('reports a creation the core did not perform', async () => {
      const { service, packs } = setup();
      packs.createResult = null;
      await expect(service.create({ label: 'X', documentType: 'Item' })).rejects.toThrow(PackCreationFailedError);
    });
  });

  describe('duplicate', () => {
    it('defaults the label to "Copy of <label>"', async () => {
      const { service, packs } = setup(packInfo({ id: 'dnd5e.monsters', packageType: 'system', locked: true }));
      await service.duplicate({ packId: 'dnd5e.monsters' });
      expect(packs.duplicated).toEqual([{ packId: 'dnd5e.monsters', label: 'Copy of Monsters' }]);
    });

    it('refuses an unknown source and a taken label', async () => {
      const { service } = setup(packInfo());
      await expect(service.duplicate({ packId: 'nope' })).rejects.toThrow(PackNotFoundError);
      await expect(service.duplicate({ packId: 'world.monsters', label: 'Monsters' })).rejects.toThrow(PackAlreadyExistsError);
    });
  });

  describe('configure', () => {
    it('merges a partial ownership change onto the current one', async () => {
      const { service, packs } = setup(packInfo());
      await service.configure({ packId: 'world.monsters', ownership: { player: 'none' } });
      expect(packs.configured[0]?.change).toEqual({
        locked: undefined,
        ownership: { player: 'none', trusted: 'inherit', assistant: 'owner' },
        folderId: undefined
      });
    });

    it('passes null ownership through as a reset and null folder as the root', async () => {
      const { service, packs } = setup(packInfo({ folderId: 'cf1' }));
      const info = await service.configure({ packId: 'world.monsters', ownership: null, folderId: null, locked: true });
      expect(packs.configured[0]?.change).toEqual({ locked: true, ownership: null, folderId: null });
      expect(info).toMatchObject({ locked: true, folderId: null });
    });

    it('writes nothing when nothing changes', async () => {
      const { service, packs } = setup(packInfo());
      await service.configure({ packId: 'world.monsters' });
      expect(packs.configured).toEqual([]);
    });

    it('refuses a folder that is not a Compendium folder', async () => {
      const { service } = setup(packInfo());
      await expect(service.configure({ packId: 'world.monsters', folderId: 'af1' })).rejects.toThrow(
        WorldFolderTypeMismatchError
      );
    });
  });

  describe('delete', () => {
    it('deletes a world pack', async () => {
      const { service, packs } = setup(packInfo());
      expect(await service.delete('world.monsters')).toEqual({ packId: 'world.monsters', label: 'Monsters', documentCount: 2 });
      expect(packs.deleted).toEqual(['world.monsters']);
    });

    it('refuses system and module packs', async () => {
      const { service, packs } = setup(packInfo({ id: 'dnd5e.monsters', packageType: 'system', packageName: 'dnd5e', locked: false }));
      await expect(service.delete('dnd5e.monsters')).rejects.toThrow(PackNotDeletableError);
      expect(packs.deleted).toEqual([]);
    });

    it('refuses a locked world pack', async () => {
      const { service } = setup(packInfo({ locked: true }));
      await expect(service.delete('world.monsters')).rejects.toThrow(PackLockedError);
    });
  });
});
