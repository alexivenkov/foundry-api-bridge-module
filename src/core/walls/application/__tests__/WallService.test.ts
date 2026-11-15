import { NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import { NotADoorError, WallCreationFailedError, WallNotFoundError } from '../../domain';
import { WallService } from '../WallService';
import { FakeSceneLocator, FakeWallStore, wall } from './fakePorts';

function setup(options: { active?: string | null; store?: FakeWallStore } = {}): {
  service: WallService;
  store: FakeWallStore;
} {
  const store =
    options.store ??
    new FakeWallStore({
      dungeon: [wall({ id: 'plain' }), wall({ id: 'gate', door: 'door', doorState: 'locked' })],
      tavern: [wall({ id: 'bar' })]
    });
  const scenes = new FakeSceneLocator(['dungeon', 'tavern'], options.active === undefined ? 'dungeon' : options.active);
  return { service: new WallService({ scenes, walls: store }), store };
}

describe('WallService', () => {
  describe('scene resolution', () => {
    it('lists the walls of the active scene when no scene is named', () => {
      const result = setup().service.listWalls({ sceneId: undefined });

      expect(result.sceneId).toBe('dungeon');
      expect(result.walls.map((w) => w.id)).toEqual(['plain', 'gate']);
    });

    it('lists the walls of the named scene', () => {
      const result = setup().service.listWalls({ sceneId: 'tavern' });

      expect(result).toEqual({ sceneId: 'tavern', walls: [wall({ id: 'bar' })] });
    });

    it('rejects an unknown scene', () => {
      expect(() => setup().service.listWalls({ sceneId: 'missing' })).toThrow(SceneNotFoundError);
    });

    it('rejects a request without a scene when none is active', () => {
      expect(() => setup({ active: null }).service.listWalls({ sceneId: undefined })).toThrow(NoActiveSceneError);
    });
  });

  describe('createWall', () => {
    it('creates the wall in the resolved scene', async () => {
      const { service, store } = setup();
      const draft = { segment: [1, 2, 3, 4] as const, door: 'secret' as const };

      const created = await service.createWall({ sceneId: 'tavern', draft });

      expect(store.created).toEqual([{ sceneId: 'tavern', draft }]);
      expect(created.segment).toEqual([1, 2, 3, 4]);
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      await expect(service.createWall({ sceneId: undefined, draft: { segment: [0, 0, 1, 1] } }))
        .rejects.toThrow(WallCreationFailedError);
    });
  });

  describe('updateWall', () => {
    it('applies the changes to an existing wall', async () => {
      const { service, store } = setup();

      const updated = await service.updateWall({ sceneId: undefined, wallId: 'gate', changes: { doorState: 'open' } });

      expect(store.updated).toEqual([{ sceneId: 'dungeon', wallId: 'gate', changes: { doorState: 'open' } }]);
      expect(updated.doorState).toBe('open');
    });

    it('rejects an unknown wall without touching the store', async () => {
      const { service, store } = setup();

      await expect(service.updateWall({ sceneId: undefined, wallId: 'missing', changes: {} }))
        .rejects.toThrow(WallNotFoundError);
      expect(store.updated).toEqual([]);
    });

    it('looks the wall up in the named scene only', async () => {
      await expect(setup().service.updateWall({ sceneId: 'tavern', wallId: 'gate', changes: {} }))
        .rejects.toThrow('Wall not found: gate');
    });

    it('reports the wall as missing when it vanished during the update', async () => {
      const { service, store } = setup();
      store.losesWallOnUpdate = true;

      await expect(service.updateWall({ sceneId: undefined, wallId: 'gate', changes: {} }))
        .rejects.toThrow(WallNotFoundError);
    });
  });

  describe('deleteWall', () => {
    it('deletes an existing wall and reports where it was', async () => {
      const { service, store } = setup();

      const result = await service.deleteWall({ sceneId: undefined, wallId: 'plain' });

      expect(store.deleted).toEqual([{ sceneId: 'dungeon', wallId: 'plain' }]);
      expect(result).toEqual({ sceneId: 'dungeon', wallId: 'plain' });
    });

    it('rejects an unknown wall without deleting anything', async () => {
      const { service, store } = setup();

      await expect(service.deleteWall({ sceneId: undefined, wallId: 'missing' })).rejects.toThrow(WallNotFoundError);
      expect(store.deleted).toEqual([]);
    });
  });

  describe('setDoorState', () => {
    it('changes the state of a door and reports the state it had', async () => {
      const { service, store } = setup();

      const result = await service.setDoorState({ sceneId: undefined, wallId: 'gate', state: 'open' });

      expect(store.updated).toEqual([{ sceneId: 'dungeon', wallId: 'gate', changes: { doorState: 'open' } }]);
      expect(result.previousState).toBe('locked');
      expect(result.wall.doorState).toBe('open');
    });

    it('refuses a wall that is not a door', async () => {
      const { service, store } = setup();

      await expect(service.setDoorState({ sceneId: undefined, wallId: 'plain', state: 'open' }))
        .rejects.toThrow(NotADoorError);
      expect(store.updated).toEqual([]);
    });

    it('rejects an unknown wall', async () => {
      await expect(setup().service.setDoorState({ sceneId: undefined, wallId: 'missing', state: 'open' }))
        .rejects.toThrow('Wall not found: missing');
    });
  });
});
