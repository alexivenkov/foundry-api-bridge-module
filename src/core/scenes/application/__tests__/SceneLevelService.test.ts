import { CoreFeatureUnavailableError, NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import { LevelCreationFailedError, OnlyLevelDeletionError } from '../../domain';
import { SceneLevelService } from '../SceneLevelService';
import { FakeSceneLocator } from './fakePorts';
import { FakeLevelStore, sceneLevel } from './settingsFakes';

function setup(activeId: string | null = 'keep'): { service: SceneLevelService; levels: FakeLevelStore } {
  const levels = new FakeLevelStore({
    keep: [sceneLevel('ground', { elevation: { bottom: 0, top: 10 } }), sceneLevel('tower', { elevation: { bottom: 10, top: 30 } })],
    hut: [sceneLevel('only')]
  });
  const scenes = new FakeSceneLocator(['keep', 'hut'], activeId);
  return { service: new SceneLevelService({ scenes, levels }), levels };
}

describe('SceneLevelService', () => {
  it('refuses every level command below Foundry 14', async () => {
    const { service, levels } = setup();
    levels.available = false;

    expect(() => service.listLevels({ sceneId: 'keep' })).toThrow(CoreFeatureUnavailableError);
    await expect(service.createLevel({ sceneId: 'keep', draft: { name: 'Cellar' } })).rejects.toThrow(
      'Scene levels require Foundry 14 or newer'
    );
    await expect(service.updateLevel({ sceneId: 'keep', levelId: 'ground', changes: {} })).rejects.toThrow(
      CoreFeatureUnavailableError
    );
    await expect(service.deleteLevel({ sceneId: 'keep', levelId: 'ground' })).rejects.toThrow(CoreFeatureUnavailableError);
    expect(levels.created).toEqual([]);
  });

  describe('listLevels', () => {
    it('lists the levels of the scene named, or of the active one', () => {
      const { service } = setup();

      expect(service.listLevels({ sceneId: 'hut' }).levels.map((level) => level.id)).toEqual(['only']);
      expect(service.listLevels({ sceneId: undefined }).sceneId).toBe('keep');
    });

    it('names a missing scene, and the lack of an active one', () => {
      expect(() => setup().service.listLevels({ sceneId: 'gone' })).toThrow(SceneNotFoundError);
      expect(() => setup(null).service.listLevels({ sceneId: undefined })).toThrow(NoActiveSceneError);
    });
  });

  describe('createLevel', () => {
    it('creates the level and answers with the scene and its initial level', async () => {
      const { service, levels } = setup();

      const created = await service.createLevel({
        sceneId: 'keep',
        draft: { name: 'Cellar', elevation: { bottom: -10, top: 0 }, visibleLevelIds: ['ground'] }
      });

      expect(levels.created).toEqual([
        { sceneId: 'keep', draft: { name: 'Cellar', elevation: { bottom: -10, top: 0 }, visibleLevelIds: ['ground'] } }
      ]);
      expect(created).toMatchObject({ sceneId: 'keep', level: { id: 'new', name: 'Cellar' }, initialLevelId: 'ground' });
    });

    it('refuses a bottom above the top the core would give the level', async () => {
      const { service, levels } = setup();

      await expect(service.createLevel({ sceneId: 'keep', draft: { name: 'Sky', elevation: { bottom: 30 } } })).rejects.toThrow(
        'Level elevation top (20) may not be below its bottom (30)'
      );
      expect(levels.created).toEqual([]);
    });

    it('lets an open top start anywhere', async () => {
      const { service } = setup();

      await expect(
        service.createLevel({ sceneId: 'keep', draft: { name: 'Sky', elevation: { bottom: 30, top: null } } })
      ).resolves.toBeDefined();
    });

    it('refuses a visible level the scene does not have', async () => {
      await expect(
        setup().service.createLevel({ sceneId: 'keep', draft: { name: 'Cellar', visibleLevelIds: ['attic'] } })
      ).rejects.toThrow('Level not found: attic');
    });

    it('fails when the core created nothing', async () => {
      const { service, levels } = setup();
      levels.createsNothing = true;

      await expect(service.createLevel({ sceneId: 'keep', draft: { name: 'Cellar' } })).rejects.toThrow(LevelCreationFailedError);
      await expect(service.createLevel({ sceneId: 'keep', draft: { name: 'Cellar' } })).rejects.toThrow('Failed to create level');
    });
  });

  describe('updateLevel', () => {
    it('updates a level of the scene', async () => {
      const { service, levels } = setup();

      const updated = await service.updateLevel({ sceneId: 'keep', levelId: 'tower', changes: { name: 'Spire' } });

      expect(levels.updated).toEqual([{ sceneId: 'keep', levelId: 'tower', changes: { name: 'Spire' } }]);
      expect(updated).toMatchObject({ sceneId: 'keep', level: { id: 'tower', name: 'Spire' } });
    });

    it('names a level the scene does not have', async () => {
      await expect(setup().service.updateLevel({ sceneId: 'keep', levelId: 'attic', changes: {} })).rejects.toThrow(
        'Level not found: attic'
      );
    });

    it('checks the elevation against the range the level has now', async () => {
      const { service, levels } = setup();

      await expect(
        service.updateLevel({ sceneId: 'keep', levelId: 'tower', changes: { elevation: { top: 5 } } })
      ).rejects.toThrow('Level elevation top (5) may not be below its bottom (10)');
      expect(levels.updated).toEqual([]);
    });

    it('refuses a level that lists itself as visible', async () => {
      await expect(
        setup().service.updateLevel({ sceneId: 'keep', levelId: 'tower', changes: { visibleLevelIds: ['tower'] } })
      ).rejects.toThrow('A level cannot list itself among its visible levels: tower');
    });
  });

  describe('deleteLevel', () => {
    it('deletes a level of a scene that keeps another', async () => {
      const { service, levels } = setup();

      await expect(service.deleteLevel({ sceneId: 'keep', levelId: 'tower' })).resolves.toEqual({
        sceneId: 'keep',
        levelId: 'tower'
      });
      expect(levels.deleted).toEqual([{ sceneId: 'keep', levelId: 'tower' }]);
    });

    it('refuses to delete the only level', async () => {
      const { service, levels } = setup();

      await expect(service.deleteLevel({ sceneId: 'hut', levelId: 'only' })).rejects.toThrow(OnlyLevelDeletionError);
      await expect(service.deleteLevel({ sceneId: 'hut', levelId: 'only' })).rejects.toThrow(
        'Cannot delete the only level of scene hut'
      );
      expect(levels.deleted).toEqual([]);
    });

    it('names a missing level before counting', async () => {
      await expect(setup().service.deleteLevel({ sceneId: 'hut', levelId: 'attic' })).rejects.toThrow('Level not found: attic');
    });
  });
});
