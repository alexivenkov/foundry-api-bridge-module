import { LevelNotFoundError } from '../../domain';
import { FoundrySceneLevelStore } from '../FoundrySceneLevelStore';
import type { FoundryLevelDocument, FoundrySceneDocument } from '../foundrySceneTypes';
import { clearGeneration, gameWith, setGeneration } from './fakeDocuments';
import { levelDocument, sceneWithLevels } from './fakeLevelDocuments';

function storeFor(document: FoundrySceneDocument): FoundrySceneLevelStore {
  const game = gameWith(document);
  return new FoundrySceneLevelStore({ getGame: () => game });
}

describe('FoundrySceneLevelStore', () => {
  afterEach(clearGeneration);

  it.each([
    [14, true],
    [13, false],
    [0, false]
  ])('has levels on Foundry %i: %s', (generation, available) => {
    setGeneration(generation);

    expect(storeFor(sceneWithLevels([])).levelsAvailable()).toBe(available);
  });

  describe('readLevels', () => {
    it('reads the levels in stacking order, from their stored values', () => {
      const upper = levelDocument('upper', {
        sort: 2,
        elevation: { bottom: 20, top: null },
        background: { src: 'maps/u.webp', color: '#123456', tint: '#ffeedd', alphaThreshold: 0.5 },
        foreground: { src: 'fx/u.webp', tint: '#aabbcc', alphaThreshold: 0.25 },
        fog: { src: 'fx/fog.webp' },
        textures: { anchorX: 0, anchorY: 1, offsetX: 10, offsetY: -5, fit: 'cover', scaleX: 2, scaleY: 0.5, rotation: 90 },
        visibility: { levels: ['ground'] }
      });
      const ground = levelDocument('ground', { sort: 1 });
      const scene = sceneWithLevels([upper, ground], { initialLevelId: 'ground', source: { grid: { distance: 10 } } });

      const levels = storeFor(scene).readLevels('dungeon');

      expect(levels).toMatchObject({ sceneId: 'dungeon', initialLevelId: 'ground', firstLevelId: 'upper', defaultTop: 40 });
      expect(levels.levels.map((level) => level.id)).toEqual(['ground', 'upper']);
      expect(levels.levels[1]).toEqual({
        id: 'upper',
        name: 'upper',
        elevation: { bottom: 20, top: null },
        background: { src: 'maps/u.webp', color: '#123456', tint: '#ffeedd', alphaThreshold: 0.5 },
        foreground: { src: 'fx/u.webp', tint: '#aabbcc', alphaThreshold: 0.25 },
        fogOverlaySrc: 'fx/fog.webp',
        positioning: { anchorX: 0, anchorY: 1, offsetX: 10, offsetY: -5, fit: 'cover', scaleX: 2, scaleY: 0.5, rotation: 90 },
        visibleLevelIds: ['ground'],
        sort: 2
      });
    });

    it('keeps the order the client prepared when it has one', () => {
      const a = levelDocument('a', { sort: 5 });
      const b = levelDocument('b', { sort: 1 });
      const scene = sceneWithLevels([a, b]);
      if (scene.levels) {
        scene.levels.sorted = [a, b];
      }

      expect(storeFor(scene).readLevels('dungeon').levels.map((level) => level.id)).toEqual(['a', 'b']);
    });

    it('falls back to the core defaults for what a level leaves unset', () => {
      const bare: FoundryLevelDocument = { id: 'bare', update: jest.fn(), delete: jest.fn(), _source: { textures: { fit: 'stretch' } } };

      expect(storeFor(sceneWithLevels([bare])).readLevels('dungeon').levels[0]).toMatchObject({
        name: '',
        elevation: { bottom: null, top: null },
        background: { src: null, color: '#999999', tint: '#ffffff', alphaThreshold: 0.75 },
        positioning: { fit: 'fill', anchorX: 0.5 },
        visibleLevelIds: [],
        sort: 0
      });
    });

    it('reads a scene without levels as having none', () => {
      expect(storeFor(sceneWithLevels([])).readLevels('dungeon')).toMatchObject({
        levels: [],
        initialLevelId: null,
        firstLevelId: null,
        defaultTop: 20
      });
    });

    it('names a missing scene', () => {
      expect(() => storeFor(sceneWithLevels([])).readLevels('gone')).toThrow('Scene not found: gone');
    });
  });

  describe('createLevel', () => {
    it('creates an embedded Level with only the fields given, under the core names', async () => {
      const created = levelDocument('new00000000000001', { name: 'Cellar' });
      const createEmbeddedDocuments = jest.fn().mockResolvedValue([created]);
      const scene = sceneWithLevels([levelDocument('ground')], { overrides: { createEmbeddedDocuments } });

      const level = await storeFor(scene).createLevel('dungeon', {
        name: 'Cellar',
        elevation: { bottom: -10, top: 0 },
        background: { src: 'maps/c.webp', tint: '#ffeedd' },
        foreground: { alphaThreshold: 0.25 },
        fogOverlaySrc: 'fx/fog.webp',
        positioning: { fit: 'cover', rotation: 90 },
        visibleLevelIds: ['ground'],
        sort: 5
      });

      expect(createEmbeddedDocuments).toHaveBeenCalledWith('Level', [
        {
          name: 'Cellar',
          elevation: { bottom: -10, top: 0 },
          background: { src: 'maps/c.webp', tint: '#ffeedd' },
          foreground: { alphaThreshold: 0.25 },
          fog: { src: 'fx/fog.webp' },
          textures: { fit: 'cover', rotation: 90 },
          visibility: { levels: ['ground'] },
          sort: 5
        }
      ]);
      expect(level).toMatchObject({ id: 'new00000000000001', name: 'Cellar' });
    });

    it('sends a bare name for a bare draft, and keeps null as unbounded', async () => {
      const createEmbeddedDocuments = jest.fn().mockResolvedValue([levelDocument('n')]);
      const scene = sceneWithLevels([], { overrides: { createEmbeddedDocuments } });
      const store = storeFor(scene);

      await store.createLevel('dungeon', { name: 'Sky' });
      await store.createLevel('dungeon', { name: 'Sky', elevation: { bottom: 40, top: null } });

      expect(createEmbeddedDocuments.mock.calls).toEqual([
        ['Level', [{ name: 'Sky' }]],
        ['Level', [{ name: 'Sky', elevation: { bottom: 40, top: null } }]]
      ]);
    });

    it.each([[[]], [undefined]])('resolves to null when the core created nothing (%p)', async (answer) => {
      const scene = sceneWithLevels([], { overrides: { createEmbeddedDocuments: jest.fn().mockResolvedValue(answer) } });

      await expect(storeFor(scene).createLevel('dungeon', { name: 'X' })).resolves.toBeNull();
    });
  });

  describe('updateLevel', () => {
    it('updates the level itself, partially, and reads it back', async () => {
      const ground = levelDocument('ground');
      (ground.update as jest.Mock).mockImplementation(() => {
        ground._source = { ...ground._source, name: 'Hall' };
        return Promise.resolve(ground);
      });
      const scene = sceneWithLevels([ground]);

      const level = await storeFor(scene).updateLevel('dungeon', 'ground', {
        name: 'Hall',
        elevation: { top: 15 },
        background: { src: null },
        fogOverlaySrc: null,
        visibleLevelIds: []
      });

      expect(ground.update).toHaveBeenCalledWith({
        name: 'Hall',
        elevation: { top: 15 },
        background: { src: null },
        fog: { src: null },
        visibility: { levels: [] }
      });
      expect(scene.update).not.toHaveBeenCalled();
      expect(level.name).toBe('Hall');
    });

    it('names a level the scene does not have', async () => {
      await expect(storeFor(sceneWithLevels([levelDocument('ground')])).updateLevel('dungeon', 'attic', {})).rejects.toThrow(
        LevelNotFoundError
      );
    });
  });

  describe('deleteLevel', () => {
    it('deletes the level document', async () => {
      const tower = levelDocument('tower');

      await storeFor(sceneWithLevels([levelDocument('ground'), tower])).deleteLevel('dungeon', 'tower');

      expect(tower.delete).toHaveBeenCalledTimes(1);
    });

    it('names a level the scene does not have', async () => {
      await expect(storeFor(sceneWithLevels([levelDocument('ground')])).deleteLevel('dungeon', 'attic')).rejects.toThrow(
        'Level not found: attic'
      );
    });
  });
});
