import { CoreFeatureUnavailableError, NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import { TileCreationFailedError, TileNotFoundError } from '../../domain';
import { TileService } from '../TileService';
import { FakeSceneLocator, FakeTileStore, FOUNDRY_13_TILES, tile } from './fakePorts';

function setup(options: { active?: string | null; store?: FakeTileStore } = {}): {
  service: TileService;
  store: FakeTileStore;
} {
  const store =
    options.store ?? new FakeTileStore({ dungeon: [tile({ id: 'floor' }), tile({ id: 'roof', elevation: 20 })] });
  const scenes = new FakeSceneLocator(['dungeon', 'tavern'], options.active === undefined ? 'dungeon' : options.active);
  return { service: new TileService({ scenes, tiles: store }), store };
}

const draft = { x: 100, y: 200, width: 300, height: 150 };

describe('TileService', () => {
  describe('listTiles', () => {
    it('lists the tiles of the active scene when no scene is named', () => {
      const result = setup().service.listTiles({ sceneId: undefined });

      expect(result.sceneId).toBe('dungeon');
      expect(result.tiles.map((t) => t.id)).toEqual(['floor', 'roof']);
    });

    it('lists an empty scene by name', () => {
      expect(setup().service.listTiles({ sceneId: 'tavern' })).toEqual({ sceneId: 'tavern', tiles: [] });
    });

    it('rejects an unknown scene and a missing active scene', () => {
      expect(() => setup().service.listTiles({ sceneId: 'missing' })).toThrow(SceneNotFoundError);
      expect(() => setup({ active: null }).service.listTiles({ sceneId: undefined })).toThrow(NoActiveSceneError);
    });

    it('refuses on a core older than Foundry 12 before resolving the scene', () => {
      const store = new FakeTileStore();
      store.caps = { ...FOUNDRY_13_TILES, supported: false };

      expect(() => setup({ store, active: null }).service.listTiles({ sceneId: undefined })).toThrow(
        new CoreFeatureUnavailableError('Tile commands require Foundry 12 or newer')
      );
    });
  });

  describe('createTile', () => {
    it('creates the tile in the resolved scene and reports the scene', async () => {
      const { service, store } = setup();

      const result = await service.createTile({ sceneId: 'tavern', draft });

      expect(store.created).toEqual([{ sceneId: 'tavern', draft }]);
      expect(result.sceneId).toBe('tavern');
      expect(result.tile).toMatchObject({ id: 'created', x: 100, y: 200, width: 300, height: 150 });
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      await expect(service.createTile({ sceneId: undefined, draft })).rejects.toThrow(
        new TileCreationFailedError()
      );
    });

    it('refuses a feature the generation does not have and writes nothing', async () => {
      const { service, store } = setup();

      await expect(
        service.createTile({ sceneId: undefined, draft: { ...draft, occlusion: { modes: ['surface'] } } })
      ).rejects.toThrow(new CoreFeatureUnavailableError('The surface occlusion mode requires Foundry 14 or newer'));
      expect(store.created).toEqual([]);
    });
  });

  describe('updateTile', () => {
    it('applies the changes to an existing tile', async () => {
      const { service, store } = setup();

      const result = await service.updateTile({ sceneId: undefined, tileId: 'roof', changes: { elevation: 30 } });

      expect(store.updated).toEqual([{ sceneId: 'dungeon', tileId: 'roof', changes: { elevation: 30 } }]);
      expect(result).toEqual({ sceneId: 'dungeon', tile: tile({ id: 'roof', elevation: 30 }) });
    });

    it('rejects an unknown tile without writing', async () => {
      const { service, store } = setup();

      await expect(service.updateTile({ sceneId: undefined, tileId: 'nope', changes: {} })).rejects.toThrow(
        new TileNotFoundError('nope')
      );
      expect(store.updated).toEqual([]);
    });

    it('reports a tile that vanished during the update as not found', async () => {
      const { service, store } = setup();
      store.losesTileOnUpdate = true;

      await expect(service.updateTile({ sceneId: undefined, tileId: 'roof', changes: {} })).rejects.toThrow(
        TileNotFoundError
      );
    });

    it('refuses a name before Foundry 14', async () => {
      await expect(
        setup().service.updateTile({ sceneId: undefined, tileId: 'roof', changes: { name: 'Roof' } })
      ).rejects.toThrow(new CoreFeatureUnavailableError('Tile names require Foundry 14 or newer'));
    });
  });

  describe('deleteTile', () => {
    it('deletes an existing tile', async () => {
      const { service, store } = setup();

      await expect(service.deleteTile({ sceneId: 'dungeon', tileId: 'floor' })).resolves.toEqual({
        sceneId: 'dungeon',
        tileId: 'floor'
      });
      expect(store.deleted).toEqual([{ sceneId: 'dungeon', tileId: 'floor' }]);
    });

    it('rejects an unknown tile', async () => {
      await expect(setup().service.deleteTile({ sceneId: undefined, tileId: 'nope' })).rejects.toThrow(
        'Tile not found: nope'
      );
    });
  });
});
