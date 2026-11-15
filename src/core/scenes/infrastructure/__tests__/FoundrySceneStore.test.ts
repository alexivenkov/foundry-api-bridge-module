import { SceneNotFoundError } from '../../../shared';
import type { Scene, SceneDraft } from '../../domain';
import { FoundrySceneStore } from '../FoundrySceneStore';
import type { FoundrySceneDocument } from '../foundrySceneTypes';
import {
  clearGeneration,
  gameWith,
  level,
  levelledSceneDocument,
  sceneDocument,
  setGeneration
} from './fakeDocuments';

function storeFor(...scenes: FoundrySceneDocument[]): FoundrySceneStore {
  const game = gameWith(...scenes);
  return new FoundrySceneStore({ getGame: () => game });
}

function storeCreating(created: FoundrySceneDocument | null | undefined): { store: FoundrySceneStore; create: jest.Mock } {
  const create = jest.fn().mockResolvedValue(created);
  const game = gameWith();
  return { store: new FoundrySceneStore({ getGame: () => game }, () => ({ create })), create };
}

describe('FoundrySceneStore', () => {
  afterEach(clearGeneration);

  describe('createConfiguredScene', () => {
    it('sends only the name for a bare draft', async () => {
      const { store, create } = storeCreating(sceneDocument());

      await store.createConfiguredScene({ name: 'Crypt' });

      expect(create).toHaveBeenCalledTimes(1);
      expect(Object.keys((create.mock.calls[0] as [Record<string, unknown>])[0])).toEqual(['name']);
      expect(create).toHaveBeenCalledWith({ name: 'Crypt' });
    });

    it('writes the core field names and grid codes', async () => {
      const { store, create } = storeCreating(sceneDocument());

      await store.createConfiguredScene({
        name: 'Crypt',
        width: 2000,
        height: 1500,
        grid: { type: 'hexPointyEven', size: 70, distance: 2, units: 'm' },
        backgroundSrc: 'maps/crypt.webp',
        foregroundSrc: 'fx/fog.webp',
        padding: 0.1,
        navigation: false,
        navName: 'The Crypt',
        navOrder: 3,
        folderId: 'folder-1'
      });

      expect(create).toHaveBeenCalledWith({
        name: 'Crypt',
        width: 2000,
        height: 1500,
        grid: { type: 3, size: 70, distance: 2, units: 'm' },
        background: { src: 'maps/crypt.webp' },
        foreground: 'fx/fog.webp',
        padding: 0.1,
        navigation: false,
        navName: 'The Crypt',
        navOrder: 3,
        folder: 'folder-1'
      });
    });

    it.each([
      ['gridless', 0],
      ['square', 1],
      ['hexPointyOdd', 2],
      ['hexPointyEven', 3],
      ['hexFlatOdd', 4],
      ['hexFlatEven', 5]
    ] as const)('stores the %s grid as code %i', async (type, code) => {
      const { store, create } = storeCreating(sceneDocument());

      await store.createConfiguredScene({ name: 'Crypt', grid: { type } });

      expect(create).toHaveBeenCalledWith({ name: 'Crypt', grid: { type: code } });
    });

    it('leaves the grid out when none of its settings is given', async () => {
      const { store, create } = storeCreating(sceneDocument());

      await store.createConfiguredScene({ name: 'Crypt', grid: { size: undefined } });

      expect((create.mock.calls[0] as [Record<string, unknown>])[0]).not.toHaveProperty('grid');
    });

    it('clears an image or the folder with null', async () => {
      const { store, create } = storeCreating(sceneDocument());

      await store.createConfiguredScene({ name: 'Crypt', backgroundSrc: null, foregroundSrc: null, navName: null, folderId: null });

      expect(create).toHaveBeenCalledWith({
        name: 'Crypt',
        background: { src: null },
        foreground: null,
        navName: null,
        folder: null
      });
    });

    it('writes fog exploration and darkness to their flat keys before Foundry 14', async () => {
      setGeneration(13);
      const { store, create } = storeCreating(sceneDocument());

      await store.createConfiguredScene({ name: 'Crypt', fogExploration: false, darkness: 0.6 });

      expect(create).toHaveBeenCalledWith({ name: 'Crypt', fogExploration: false, darkness: 0.6 });
    });

    it('treats an unknown core version as older than Foundry 14', async () => {
      const { store, create } = storeCreating(sceneDocument());

      await store.createConfiguredScene({ name: 'Crypt', fogExploration: true, darkness: 1 });

      expect(create).toHaveBeenCalledWith({ name: 'Crypt', fogExploration: true, darkness: 1 });
    });

    it.each([
      [true, 1],
      [false, 0]
    ])('writes fog exploration %s as fog mode %i and darkness into the environment on Foundry 14', async (enabled, mode) => {
      setGeneration(14);
      const { store, create } = storeCreating(sceneDocument());

      await store.createConfiguredScene({ name: 'Crypt', fogExploration: enabled, darkness: 0.6 });

      expect(create).toHaveBeenCalledWith({
        name: 'Crypt',
        fog: { mode },
        environment: { darknessLevel: 0.6 }
      });
    });

    it('returns the scene the core created', async () => {
      const { store } = storeCreating(
        sceneDocument({ id: 'crypt', uuid: 'Scene.crypt', name: 'Crypt', folder: { id: 'f1', name: 'Maps' }, navName: 'C' })
      );

      await expect(store.createConfiguredScene({ name: 'Crypt' })).resolves.toEqual({
        scene: {
          id: 'crypt',
          uuid: 'Scene.crypt',
          name: 'Crypt',
          active: false,
          width: 4000,
          height: 3000,
          backgroundSrc: 'maps/dungeon.webp',
          navigation: true,
          navName: 'C',
          navOrder: 0,
          folderName: 'Maps',
          grid: { type: 'square', size: 100, distance: 5, units: 'ft' }
        },
        settings: expect.objectContaining({ weather: null, tokenVision: true }),
        missingImages: null
      });
    });

    it.each([undefined, null])('resolves to null when the core created nothing (%s)', async (nothing) => {
      const { store } = storeCreating(nothing);

      await expect(store.createConfiguredScene({ name: 'Vetoed' })).resolves.toBeNull();
    });

    it('reads the Scene class only when a scene is created', () => {
      const sceneClass = jest.fn();
      const game = gameWith();

      new FoundrySceneStore({ getGame: () => game }, sceneClass);

      expect(sceneClass).not.toHaveBeenCalled();
    });
  });

  describe('the images a creation leaves out', () => {
    const images = { backgroundSrc: 'maps/crypt.webp', foregroundSrc: 'fx/fog.webp' };
    const draft = { name: 'Crypt', ...images };

    async function missingAfterCreating(document: FoundrySceneDocument, from: SceneDraft = draft): Promise<unknown> {
      return (await storeCreating(document).store.createConfiguredScene(from))?.missingImages;
    }

    describe('on Foundry 14', () => {
      beforeEach(() => {
        setGeneration(14);
      });

      it('still creates the scene with the legacy keys, in one call', async () => {
        const { store, create } = storeCreating(levelledSceneDocument());

        await store.createConfiguredScene(draft);

        expect(create).toHaveBeenCalledTimes(1);
        expect(create).toHaveBeenCalledWith({
          name: 'Crypt',
          background: { src: 'maps/crypt.webp' },
          foreground: 'fx/fog.webp'
        });
      });

      it('reports both images when the core dropped them from the first level', async () => {
        const bare = levelledSceneDocument(level({ background: { src: null }, foreground: { src: null } }));

        await expect(missingAfterCreating(bare)).resolves.toEqual(images);
      });

      it('reports nothing when the core put them on the first level itself', async () => {
        const complete = levelledSceneDocument(
          level({ background: { src: 'maps/crypt.webp' }, foreground: { src: 'fx/fog.webp' } })
        );

        await expect(missingAfterCreating(complete)).resolves.toBeNull();
      });

      it('reports only the image that is not there', async () => {
        const half = levelledSceneDocument(level({ background: { src: 'maps/crypt.webp' }, foreground: { src: null } }));

        await expect(missingAfterCreating(half)).resolves.toEqual({ foregroundSrc: 'fx/fog.webp' });
      });

      it('reports an image that differs from the one asked for', async () => {
        const other = levelledSceneDocument(
          level({ background: { src: 'maps/other.webp' }, foreground: { src: 'fx/fog.webp' } })
        );

        await expect(missingAfterCreating(other)).resolves.toEqual({ backgroundSrc: 'maps/crypt.webp' });
      });

      it('reports nothing for a draft without images', async () => {
        const bare = levelledSceneDocument(level({ background: { src: null }, foreground: { src: null } }));

        await expect(missingAfterCreating(bare, { name: 'Crypt', width: 2000 })).resolves.toBeNull();
      });

      it.each([null, ''])('takes a draft asking for no image (%p) as satisfied by a level without one', async (none) => {
        const bare = levelledSceneDocument(level({ background: { src: null }, foreground: undefined }));

        await expect(missingAfterCreating(bare, { name: 'Crypt', backgroundSrc: none, foregroundSrc: none })).resolves.toBeNull();
      });

      it('reports nothing for a scene without a level, which has nowhere to take them', async () => {
        await expect(missingAfterCreating(levelledSceneDocument(null))).resolves.toBeNull();
      });
    });

    it.each([
      ['Foundry 13', 13],
      ['Foundry 12', 12]
    ])('is never anything on %s, where the scene itself stores them', async (_name, generation) => {
      setGeneration(generation);
      const scene = sceneDocument({ background: { src: null }, firstLevel: level({ background: { src: null } }) });

      await expect(missingAfterCreating(scene)).resolves.toBeNull();
    });

    it('is never anything while the core version is unknown', async () => {
      await expect(missingAfterCreating(sceneDocument({ background: null }))).resolves.toBeNull();
    });
  });

  describe('reading a scene back', () => {
    async function read(document: FoundrySceneDocument): Promise<Scene | undefined> {
      return (await storeCreating(document).store.createConfiguredScene({ name: 'X' }))?.scene;
    }

    async function created(overrides: Partial<FoundrySceneDocument>): Promise<Scene | undefined> {
      return read(sceneDocument(overrides));
    }

    it.each([
      ['an object with a source', { src: 'maps/a.jpg' }, 'maps/a.jpg'],
      ['an object with an empty source', { src: '' }, ''],
      ['an object without a source', {}, null],
      ['a plain path', 'maps/legacy.jpg', 'maps/legacy.jpg'],
      ['an empty path', '', null],
      ['null', null, null],
      ['nothing', undefined, null]
    ])('reads a background given as %s', async (_case, background, expected) => {
      await expect(created({ background })).resolves.toMatchObject({ backgroundSrc: expected });
    });

    it('reads the background of a Foundry 14 scene from its first level, not from the deprecated getter', async () => {
      setGeneration(14);
      const scene = levelledSceneDocument(level({ background: { src: 'maps/ground.webp' } }));

      await expect(read(scene)).resolves.toMatchObject({ backgroundSrc: 'maps/ground.webp' });
    });

    it.each([
      ['a first level without a background image', level({ background: { src: null } })],
      ['a first level without background data', level({ background: undefined })],
      ['no level at all', null]
    ])('reads a Foundry 14 scene with %s as having no background', async (_case, firstLevel) => {
      setGeneration(14);

      await expect(read(levelledSceneDocument(firstLevel))).resolves.toMatchObject({ backgroundSrc: null });
    });

    it('keeps reading the background field up to Foundry 13, whatever else the document carries', async () => {
      setGeneration(13);
      const scene = sceneDocument({ background: { src: 'maps/field.webp' }, firstLevel: level() });

      await expect(read(scene)).resolves.toMatchObject({ backgroundSrc: 'maps/field.webp' });
    });

    it('falls back to defaults for fields the document leaves unset', async () => {
      const sparse = {
        width: undefined,
        height: undefined,
        navigation: undefined,
        navName: undefined,
        navOrder: undefined,
        folder: undefined,
        grid: undefined
      };

      await expect(created(sparse)).resolves.toMatchObject({
        width: 0,
        height: 0,
        navigation: false,
        navName: null,
        navOrder: 0,
        folderName: null,
        grid: { type: 'square', size: 100, distance: 5, units: 'ft' }
      });
    });

    it.each([
      [0, 'gridless'],
      [2, 'hexPointyOdd'],
      [5, 'hexFlatEven'],
      [99, 'square'],
      [undefined, 'square']
    ])('reads the grid code %s as %s', async (type, expected) => {
      const grid = { type, size: 100, distance: 5, units: 'ft' };

      await expect(created({ grid })).resolves.toMatchObject({ grid: { type: expected } });
    });
  });

  describe('updateConfiguredScene', () => {
    it('sends a partial update and returns the scene as it is afterwards', async () => {
      const document = sceneDocument({ navName: 'Old' });
      (document.update as jest.Mock).mockImplementation((data: Partial<FoundrySceneDocument>) => {
        Object.assign(document, data);
        return Promise.resolve(document);
      });

      const { scene: updated } = await storeFor(document).updateConfiguredScene('dungeon', { name: 'Deep Dungeon', navName: null });

      expect(document.update).toHaveBeenCalledWith({ name: 'Deep Dungeon', navName: null });
      expect(updated).toMatchObject({ id: 'dungeon', name: 'Deep Dungeon', navName: null });
    });

    it('still sends an update that changes nothing', async () => {
      const document = sceneDocument();

      await storeFor(document).updateConfiguredScene('dungeon', {});

      expect(document.update).toHaveBeenCalledWith({});
    });

    it('writes the images to the scene itself up to Foundry 13', async () => {
      setGeneration(13);
      const document = sceneDocument();

      await storeFor(document).updateConfiguredScene('dungeon', {
        grid: { type: 'hexFlatOdd' },
        backgroundSrc: 'maps/new.jpg',
        foregroundSrc: 'fx/new.webp',
        fogExploration: true,
        darkness: 0.4,
        folderId: null
      });

      expect(document.update).toHaveBeenCalledWith({
        grid: { type: 4 },
        background: { src: 'maps/new.jpg' },
        foreground: 'fx/new.webp',
        fogExploration: true,
        darkness: 0.4,
        folder: null
      });
    });

    describe('on Foundry 14, where the images belong to the levels', () => {
      beforeEach(() => {
        setGeneration(14);
      });

      it('writes the images to the first level, through the levels of the scene', async () => {
        const document = levelledSceneDocument(level({ id: 'level-1' }));

        await storeFor(document).updateConfiguredScene('dungeon', {
          name: 'Deep Dungeon',
          backgroundSrc: 'maps/new.webp',
          foregroundSrc: 'fx/new.webp',
          fogExploration: true,
          darkness: 0.4
        });

        expect(document.update).toHaveBeenCalledTimes(1);
        expect(document.update).toHaveBeenCalledWith({
          name: 'Deep Dungeon',
          fog: { mode: 1 },
          environment: { darknessLevel: 0.4 },
          levels: [{ _id: 'level-1', background: { src: 'maps/new.webp' }, foreground: { src: 'fx/new.webp' } }]
        });
      });

      it('sends neither of the legacy keys, which the core would drop', async () => {
        const document = levelledSceneDocument();

        await storeFor(document).updateConfiguredScene('dungeon', { backgroundSrc: 'maps/new.webp', foregroundSrc: 'fx/new.webp' });

        const payload = (document.update as jest.Mock).mock.calls[0] as [Record<string, unknown>];
        expect(Object.keys(payload[0])).toEqual(['levels']);
      });

      it('touches only the image that changes', async () => {
        const document = levelledSceneDocument(level({ id: 'level-1' }));

        await storeFor(document).updateConfiguredScene('dungeon', { foregroundSrc: 'fx/new.webp' });

        expect(document.update).toHaveBeenCalledWith({ levels: [{ _id: 'level-1', foreground: { src: 'fx/new.webp' } }] });
      });

      it('clears an image with null', async () => {
        const document = levelledSceneDocument(level({ id: 'level-1' }));

        await storeFor(document).updateConfiguredScene('dungeon', { backgroundSrc: null, foregroundSrc: null });

        expect(document.update).toHaveBeenCalledWith({
          levels: [{ _id: 'level-1', background: { src: null }, foreground: { src: null } }]
        });
      });

      it('leaves the levels alone when no image changes', async () => {
        const document = levelledSceneDocument();

        await storeFor(document).updateConfiguredScene('dungeon', { navName: 'Crypt', folderId: null });

        expect(document.update).toHaveBeenCalledWith({ navName: 'Crypt', folder: null });
      });

      it('returns the scene with the background its first level has afterwards', async () => {
        const firstLevel = level({ id: 'level-1', background: { src: 'maps/old.webp' } });
        const document = levelledSceneDocument(firstLevel);
        (document.update as jest.Mock).mockImplementation(() => {
          firstLevel.background = { src: 'maps/new.webp' };
          return Promise.resolve(document);
        });

        const { scene: updated } = await storeFor(document).updateConfiguredScene('dungeon', { backgroundSrc: 'maps/new.webp' });

        expect(updated.backgroundSrc).toBe('maps/new.webp');
      });

      it('falls back to the legacy keys for a scene without a level', async () => {
        const document = levelledSceneDocument(null);

        await storeFor(document).updateConfiguredScene('dungeon', { backgroundSrc: 'maps/new.webp' });

        expect(document.update).toHaveBeenCalledWith({ background: { src: 'maps/new.webp' } });
      });
    });

    it('rejects an unknown scene', async () => {
      await expect(storeFor(sceneDocument()).updateConfiguredScene('missing', { name: 'X' })).rejects.toThrow(SceneNotFoundError);
    });
  });

  describe('deleteScene', () => {
    it('deletes the document', async () => {
      const document = sceneDocument();

      await storeFor(document).deleteScene('dungeon');

      expect(document.delete).toHaveBeenCalledTimes(1);
    });

    it('rejects an unknown scene', async () => {
      await expect(storeFor(sceneDocument()).deleteScene('missing')).rejects.toThrow('Scene not found: missing');
    });
  });

  describe('cloneScene', () => {
    it('saves a copy of the source and returns it', async () => {
      const source = sceneDocument();
      (source.clone as jest.Mock).mockResolvedValue(sceneDocument({ id: 'copy', uuid: 'Scene.copy', name: 'Dungeon (Copy)' }));

      const copy = await storeFor(source).cloneScene('dungeon', {});

      expect(source.clone).toHaveBeenCalledWith({}, { save: true });
      expect(copy).toMatchObject({ id: 'copy', uuid: 'Scene.copy', name: 'Dungeon (Copy)' });
    });

    it('passes the overrides under the core field names', async () => {
      const source = sceneDocument();
      (source.clone as jest.Mock).mockResolvedValue(sceneDocument());

      await storeFor(source).cloneScene('dungeon', { name: 'Dungeon II', folderId: null });

      expect(source.clone).toHaveBeenCalledWith({ name: 'Dungeon II', folder: null }, { save: true });
    });

    it.each([undefined, null])('resolves to null when the core created no copy (%s)', async (nothing) => {
      const source = sceneDocument();
      (source.clone as jest.Mock).mockResolvedValue(nothing);

      await expect(storeFor(source).cloneScene('dungeon', {})).resolves.toBeNull();
    });

    it('rejects an unknown source', async () => {
      await expect(storeFor(sceneDocument()).cloneScene('missing', {})).rejects.toThrow(SceneNotFoundError);
    });
  });

  describe('navigation', () => {
    it('activates a scene without viewing it', async () => {
      const document = sceneDocument();

      await storeFor(document).activateScene('dungeon');

      expect(document.activate).toHaveBeenCalledTimes(1);
      expect(document.view).not.toHaveBeenCalled();
    });

    it('views a scene without activating it', async () => {
      const document = sceneDocument();

      await storeFor(document).viewScene('dungeon');

      expect(document.view).toHaveBeenCalledTimes(1);
      expect(document.activate).not.toHaveBeenCalled();
    });

    it('rejects an unknown scene', async () => {
      const store = storeFor(sceneDocument());

      await expect(store.activateScene('missing')).rejects.toThrow(SceneNotFoundError);
      await expect(store.viewScene('missing')).rejects.toThrow(SceneNotFoundError);
    });
  });

  it('addresses a scene that is not the active one', async () => {
    const tavern = sceneDocument({ id: 'tavern' });

    await storeFor(sceneDocument(), tavern).viewScene('tavern');

    expect(tavern.view).toHaveBeenCalledTimes(1);
  });
});
