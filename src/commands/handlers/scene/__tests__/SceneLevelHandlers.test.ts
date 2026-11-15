import type { FoundrySceneDocument, FoundrySceneGame } from '../../../../core/scenes/infrastructure';
import { clearGeneration, gameWith, sceneDocument, setGeneration } from '../../../../core/scenes/infrastructure/__tests__/fakeDocuments';
import { levelDocument, sceneWithLevels } from '../../../../core/scenes/infrastructure/__tests__/fakeLevelDocuments';
import { createCreateSceneLevelHandler } from '../CreateSceneLevelHandler';
import { createDeleteSceneLevelHandler } from '../DeleteSceneLevelHandler';
import { createGetSceneLevelsHandler } from '../GetSceneLevelsHandler';
import { createUpdateSceneLevelHandler } from '../UpdateSceneLevelHandler';

function provider(...scenes: FoundrySceneDocument[]): { gameProvider: { getGame: () => FoundrySceneGame } } {
  const game = gameWith(...scenes);
  return { gameProvider: { getGame: () => game } };
}

describe('scene level handlers', () => {
  beforeEach(() => {
    setGeneration(14);
  });

  afterEach(clearGeneration);

  it('lists the levels of the active scene', async () => {
    const scene = sceneWithLevels([levelDocument('ground', { sort: 0 }), levelDocument('tower', { sort: 1, elevation: { bottom: 20, top: null } })], {
      initialLevelId: 'ground'
    });

    const result = await createGetSceneLevelsHandler(provider(scene))({ sceneId: null });

    expect(result.sceneId).toBe('dungeon');
    expect(result.initialLevelId).toBe('ground');
    expect(result.levels.map((level) => [level.id, level.initial])).toEqual([
      ['ground', true],
      ['tower', false]
    ]);
    expect(result.levels[1]).toMatchObject({ elevation: { bottom: 20, top: null }, fogOverlay: null, positioning: { fit: 'fill' } });
  });

  it('refuses levels below Foundry 14', async () => {
    setGeneration(13);

    await expect(createGetSceneLevelsHandler(provider(sceneDocument()))({})).rejects.toThrow(
      'Scene levels require Foundry 14 or newer'
    );
  });

  it('creates a level and answers with it and its scene', async () => {
    const created = levelDocument('new00000000000001', { name: 'Cellar', elevation: { bottom: -10, top: 0 } });
    const createEmbeddedDocuments = jest.fn().mockResolvedValue([created]);
    const scene = sceneWithLevels([levelDocument('ground')], { overrides: { createEmbeddedDocuments } });

    const result = await createCreateSceneLevelHandler(provider(scene))({
      name: 'Cellar',
      elevation: { bottom: -10, top: 0 },
      fogOverlay: 'fx/fog.webp'
    });

    expect(createEmbeddedDocuments).toHaveBeenCalledWith('Level', [
      { name: 'Cellar', elevation: { bottom: -10, top: 0 }, fog: { src: 'fx/fog.webp' } }
    ]);
    expect(result).toMatchObject({ sceneId: 'dungeon', id: 'new00000000000001', name: 'Cellar', initial: false });
  });

  it('rejects a level without a name, and one whose range is inverted', async () => {
    const scene = sceneWithLevels([levelDocument('ground')], { overrides: { createEmbeddedDocuments: jest.fn() } });
    const handler = createCreateSceneLevelHandler(provider(scene));

    await expect(handler({ name: '' })).rejects.toThrow('name');
    await expect(handler({ name: 'Sky', elevation: { bottom: 50 } })).rejects.toThrow(
      'Level elevation top (20) may not be below its bottom (50)'
    );
  });

  it('updates a level', async () => {
    const tower = levelDocument('tower', { elevation: { bottom: 20, top: 40 } });
    const scene = sceneWithLevels([levelDocument('ground'), tower]);

    const result = await createUpdateSceneLevelHandler(provider(scene))({ levelId: 'tower', positioning: { fit: 'cover' } });

    expect(tower.update).toHaveBeenCalledWith({ textures: { fit: 'cover' } });
    expect(result).toMatchObject({ sceneId: 'dungeon', id: 'tower' });
  });

  it('names a level the scene does not have', async () => {
    const scene = sceneWithLevels([levelDocument('ground')]);

    await expect(createUpdateSceneLevelHandler(provider(scene))({ levelId: 'attic', name: 'Attic' })).rejects.toThrow(
      'Level not found: attic'
    );
  });

  it('deletes a level, but not the only one', async () => {
    const tower = levelDocument('tower');
    const scene = sceneWithLevels([levelDocument('ground'), tower]);
    const hut = sceneWithLevels([levelDocument('only')], { overrides: { id: 'hut' } });
    const handler = createDeleteSceneLevelHandler(provider(scene, hut));

    await expect(handler({ sceneId: 'dungeon', levelId: 'tower' })).resolves.toEqual({
      deleted: true,
      levelId: 'tower',
      sceneId: 'dungeon'
    });
    expect(tower.delete).toHaveBeenCalledTimes(1);
    await expect(handler({ sceneId: 'hut', levelId: 'only' })).rejects.toThrow('Cannot delete the only level of scene hut');
  });
});
