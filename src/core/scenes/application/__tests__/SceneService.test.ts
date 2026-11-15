import { SceneNotFoundError } from '../../../shared';
import { SceneCloneCancelledError } from '../../domain';
import { SceneService } from '../SceneService';
import { FakeSceneLocator, FakeSceneStore } from './fakePorts';

function setup(): { service: SceneService; store: FakeSceneStore } {
  const store = new FakeSceneStore();
  const scenes = new FakeSceneLocator(['dungeon', 'tavern'], 'tavern');
  return { service: new SceneService({ scenes, store, navigator: store }), store };
}

describe('SceneService', () => {
  describe('deleteScene', () => {
    it('deletes an existing scene and reports which one', async () => {
      const { service, store } = setup();

      const deleted = await service.deleteScene({ sceneId: 'dungeon' });

      expect(store.deleted).toEqual(['dungeon']);
      expect(deleted.id).toBe('dungeon');
    });

    it('rejects an unknown scene without deleting anything', async () => {
      const { service, store } = setup();

      await expect(service.deleteScene({ sceneId: 'missing' })).rejects.toThrow(SceneNotFoundError);
      expect(store.deleted).toEqual([]);
    });

    it('passes on a failure of the core', async () => {
      const { service, store } = setup();
      store.failure = new Error('Permission denied');

      await expect(service.deleteScene({ sceneId: 'dungeon' })).rejects.toThrow('Permission denied');
    });
  });

  describe('cloneScene', () => {
    it('copies the source with the overrides', async () => {
      const { service, store } = setup();

      const copy = await service.cloneScene({ sourceId: 'dungeon', overrides: { name: 'Dungeon II', folderId: null } });

      expect(store.cloned).toEqual([{ sourceId: 'dungeon', overrides: { name: 'Dungeon II', folderId: null } }]);
      expect(copy).toMatchObject({ id: 'copy', name: 'Dungeon II' });
    });

    it('fails when the core created no copy', async () => {
      const { service, store } = setup();
      store.clonesNothing = true;

      const cloning = service.cloneScene({ sourceId: 'dungeon', overrides: {} });

      await expect(cloning).rejects.toThrow(SceneCloneCancelledError);
      await expect(cloning).rejects.toThrow('Scene clone was cancelled by Foundry (a module hook may have vetoed it)');
    });

    it('rejects an unknown source without cloning anything', async () => {
      const { service, store } = setup();

      await expect(service.cloneScene({ sourceId: 'missing', overrides: {} })).rejects.toThrow(SceneNotFoundError);
      expect(store.cloned).toEqual([]);
    });
  });

  describe('activateScene', () => {
    it('activates the scene and reports its identity', async () => {
      const { service, store } = setup();

      const activated = await service.activateScene({ sceneId: 'dungeon' });

      expect(store.activated).toEqual(['dungeon']);
      expect(store.viewed).toEqual([]);
      expect(activated).toEqual({ id: 'dungeon', name: 'Scene dungeon' });
    });

    it('rejects an unknown scene', async () => {
      const { service, store } = setup();

      await expect(service.activateScene({ sceneId: 'missing' })).rejects.toThrow('Scene not found: missing');
      expect(store.activated).toEqual([]);
    });

    it('passes on a failure of the core', async () => {
      const { service, store } = setup();
      store.failure = new Error('Permission denied');

      await expect(service.activateScene({ sceneId: 'dungeon' })).rejects.toThrow('Permission denied');
    });
  });
});
