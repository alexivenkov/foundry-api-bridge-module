import { CompendiumFeatureUnavailableError } from '../../domain';
import { FoundryPackManager } from '../FoundryPackManager';
import { FoundryWorldDirectory } from '../FoundryWorldDirectory';
import { fakeGlobals, fakePack, fakeWorld } from './managementFixtures';

describe('FoundryPackManager', () => {
  it('maps a pack to its snapshot; a role missing from the stored ownership reads as inherit', () => {
    const world = fakeWorld({ packs: [fakePack({ folder: { id: 'cf1' }, locked: true })] });
    const manager = new FoundryPackManager(world.provider, fakeGlobals());
    expect(manager.readPackInfo('world.monsters')).toEqual({
      id: 'world.monsters',
      label: 'Monsters',
      type: 'Actor',
      system: 'dnd5e',
      packageType: 'world',
      packageName: 'my-world',
      locked: true,
      ownership: { player: 'observer', trusted: 'inherit', assistant: 'owner' },
      folderId: 'cf1',
      documentCount: 2,
      folders: [
        { id: 'pf1', name: 'Undead', parentId: null },
        { id: 'pf2', name: 'Ghouls', parentId: 'pf1' }
      ]
    });
    expect(manager.readPackInfo('nope')).toBeNull();
  });

  it('plans the world pack id from the slug the server derives', () => {
    const manager = new FoundryPackManager(fakeWorld().provider, fakeGlobals());
    expect(manager.plannedWorldPackId('My Pack! v2')).toBe('world.my-pack-v2');
  });

  it('creates a pack with the metadata the core UI sends', async () => {
    const world = fakeWorld();
    const createCompendium = jest.fn().mockResolvedValue({ collection: 'world.loot' });
    const manager = new FoundryPackManager(world.provider, fakeGlobals({ compendiumCollectionClass: () => ({ createCompendium }) }));
    expect(await manager.createWorldPack({ label: 'Loot', documentType: 'Item' })).toBe('world.loot');
    expect(createCompendium).toHaveBeenCalledWith({ label: 'Loot', type: 'Item' });
  });

  it('reads a non-pack result as nothing created and refuses without the class', async () => {
    const createCompendium = jest.fn().mockResolvedValue({ message: 'permission denied' });
    const manager = new FoundryPackManager(fakeWorld().provider, fakeGlobals({ compendiumCollectionClass: () => ({ createCompendium }) }));
    expect(await manager.createWorldPack({ label: 'Loot', documentType: 'Item' })).toBeNull();
    const bare = new FoundryPackManager(fakeWorld().provider, fakeGlobals());
    await expect(bare.createWorldPack({ label: 'Loot', documentType: 'Item' })).rejects.toThrow(CompendiumFeatureUnavailableError);
  });

  it('duplicates and deletes through the pack', async () => {
    const world = fakeWorld();
    const pack = world.packs.get('world.monsters');
    pack?.duplicateCompendium.mockResolvedValue({ collection: 'world.copy-of-monsters' });
    const manager = new FoundryPackManager(world.provider, fakeGlobals());
    expect(await manager.duplicatePack('world.monsters', 'Copy of Monsters')).toBe('world.copy-of-monsters');
    expect(pack?.duplicateCompendium).toHaveBeenCalledWith({ label: 'Copy of Monsters' });
    await manager.deleteWorldPack('world.monsters');
    expect(pack?.deleteCompendium).toHaveBeenCalled();
    expect(await manager.duplicatePack('nope', 'X')).toBeNull();
  });

  describe('configurePack', () => {
    function configured(change: Parameters<FoundryPackManager['configurePack']>[1]): Promise<unknown> {
      const world = fakeWorld();
      const manager = new FoundryPackManager(world.provider, fakeGlobals());
      return manager.configurePack('world.monsters', change).then(() => world.packs.get('world.monsters')?.configure.mock.calls[0]?.[0]);
    }

    it('writes every role with GAMEMASTER pinned to OWNER (a missing role would take the core initial)', async () => {
      expect(await configured({ ownership: { player: 'none', trusted: 'observer', assistant: 'owner' } })).toEqual({
        ownership: { GAMEMASTER: 'OWNER', ASSISTANT: 'OWNER', TRUSTED: 'OBSERVER', PLAYER: 'NONE' }
      });
    });

    it('resets ownership with an undefined value under the key, which configure deletes', async () => {
      const payload = (await configured({ ownership: null })) as Record<string, unknown>;
      expect('ownership' in payload).toBe(true);
      expect(payload['ownership']).toBeUndefined();
    });

    it('writes lock and folder (null clears it)', async () => {
      expect(await configured({ locked: false, folderId: null })).toEqual({ locked: false, folder: null });
      expect(await configured({ folderId: 'cf1' })).toEqual({ folder: 'cf1' });
    });
  });
});

describe('FoundryWorldDirectory', () => {
  it('finds folders, documents and taken ids', () => {
    const directory = new FoundryWorldDirectory(fakeWorld().provider);
    expect(directory.findFolder('cf1')).toEqual({ id: 'cf1', name: 'Folder cf1', type: 'Compendium' });
    expect(directory.findFolder('nope')).toBeNull();
    expect(directory.findDocument('Actor', 'a1')).toEqual({ id: 'a1', name: 'Goblin' });
    expect(directory.findDocument('Scene', 'a1')).toBeNull();
    expect(directory.existingDocumentIds('Actor', ['a1', 'a2'])).toEqual(['a1']);
    expect(directory.existingDocumentIds('Scene', ['a1'])).toEqual([]);
  });
});
