import type { FoundrySceneDocument, FoundrySceneGame } from '../../../../core/scenes/infrastructure';
import { clearGeneration, gameWith, sceneDocument, setGeneration } from '../../../../core/scenes/infrastructure/__tests__/fakeDocuments';
import { levelDocument, sceneWithLevels } from '../../../../core/scenes/infrastructure/__tests__/fakeLevelDocuments';
import { createPreloadSceneHandler } from '../PreloadSceneHandler';
import { createPullUsersToSceneHandler } from '../PullUsersToSceneHandler';
import { createRegenerateSceneThumbnailHandler } from '../RegenerateSceneThumbnailHandler';
import { createResetFogHandler } from '../ResetFogHandler';
import { createViewSceneHandler } from '../ViewSceneHandler';

interface World {
  game: FoundrySceneGame;
  emit: jest.Mock;
  preload: jest.Mock;
}

function world(...scenes: FoundrySceneDocument[]): World {
  const emit = jest.fn();
  const preload = jest.fn().mockResolvedValue(undefined);
  const base = gameWith(...scenes);
  return {
    emit,
    preload,
    game: {
      ...base,
      scenes: { ...base.scenes, preload },
      socket: { emit },
      user: { id: 'gm' },
      users: {
        contents: [
          { id: 'gm', active: true },
          { id: 'alice', active: true },
          { id: 'bob', active: false }
        ]
      }
    }
  };
}

const provider = (game: FoundrySceneGame): { gameProvider: { getGame: () => FoundrySceneGame } } => ({
  gameProvider: { getGame: () => game }
});

describe('scene table handlers', () => {
  beforeEach(() => {
    setGeneration(13);
  });

  afterEach(clearGeneration);

  describe('pull-users-to-scene', () => {
    it('pulls the connected players of the active scene', async () => {
      const pullUsers = jest.fn();
      const { game } = world(sceneDocument({ pullUsers }));

      await expect(createPullUsersToSceneHandler(provider(game))({})).resolves.toEqual({
        sceneId: 'dungeon',
        pulledUserIds: ['alice'],
        offlineUserIds: ['bob']
      });
      expect(pullUsers).toHaveBeenCalledWith(['alice']);
    });

    it('rejects an empty user list and names an unknown user', async () => {
      const { game } = world(sceneDocument({ pullUsers: jest.fn() }));
      const handler = createPullUsersToSceneHandler(provider(game));

      await expect(handler({ userIds: [] })).rejects.toThrow('userIds');
      await expect(handler({ userIds: ['zed'] })).rejects.toThrow('User not found: zed');
    });

    it('refuses a level below Foundry 14 and names a missing scene', async () => {
      const { game } = world(sceneDocument({ pullUsers: jest.fn() }));
      const handler = createPullUsersToSceneHandler(provider(game));

      await expect(handler({ levelId: 'tower' })).rejects.toThrow('Scene levels require Foundry 14 or newer');
      await expect(handler({ sceneId: 'gone' })).rejects.toThrow('Scene not found: gone');
    });

    it('pulls them to a level on Foundry 14', async () => {
      setGeneration(14);
      const pullUsers = jest.fn();
      const { game } = world(sceneWithLevels([levelDocument('ground'), levelDocument('tower')], { overrides: { pullUsers } }));

      await expect(createPullUsersToSceneHandler(provider(game))({ userIds: ['alice'], levelId: 'tower' })).resolves.toMatchObject({
        levelId: 'tower'
      });
      expect(pullUsers).toHaveBeenCalledWith(['alice'], { level: 'tower' });
    });
  });

  describe('preload-scene', () => {
    it('makes every client load the scene', async () => {
      const { game, preload } = world(sceneDocument(), sceneDocument({ id: 'inn' }));

      await expect(createPreloadSceneHandler(provider(game))({ sceneId: 'inn' })).resolves.toEqual({
        sceneId: 'inn',
        preloading: true
      });
      expect(preload).toHaveBeenCalledWith('inn', true);
    });

    it('names a missing scene', async () => {
      const { game } = world(sceneDocument());

      await expect(createPreloadSceneHandler(provider(game))({ sceneId: 'gone' })).rejects.toThrow('Scene not found: gone');
    });
  });

  describe('reset-fog', () => {
    it('resets the fog of any scene', async () => {
      const { game, emit } = world(sceneDocument(), sceneDocument({ id: 'inn' }));

      await expect(createResetFogHandler(provider(game))({ sceneId: 'inn' })).resolves.toEqual({ sceneId: 'inn', reset: true });
      expect(emit).toHaveBeenCalledWith('resetFog', 'inn');
    });

    it('rejects a wrongly typed scene id and reports a missing active scene', async () => {
      const { game } = world();
      const handler = createResetFogHandler(provider(game));

      await expect(handler({ sceneId: 5 } as never)).rejects.toThrow('sceneId');
      await expect(handler({})).rejects.toThrow('No active scene; specify sceneId');
    });
  });

  describe('regenerate-scene-thumbnail', () => {
    it('stores a new thumbnail and answers with its path', async () => {
      const document = sceneDocument({ createThumbnail: jest.fn().mockResolvedValue({ thumb: 'data:image/webp;base64,AA' }) });
      (document.update as jest.Mock).mockImplementation(() => {
        document.thumb = 'worlds/w/assets/scenes/dungeon-thumb.webp';
        return Promise.resolve(document);
      });
      const { game } = world(document);

      await expect(createRegenerateSceneThumbnailHandler(provider(game))({})).resolves.toEqual({
        sceneId: 'dungeon',
        thumb: 'worlds/w/assets/scenes/dungeon-thumb.webp'
      });
    });

    it('refuses a scene with nothing to draw', async () => {
      const { game } = world(sceneDocument({ background: { src: null } }));

      await expect(createRegenerateSceneThumbnailHandler(provider(game))({})).rejects.toThrow(
        'Scene dungeon has no background image or tiles to draw a thumbnail from'
      );
    });
  });

  describe('view-scene with a level', () => {
    it('views the level on Foundry 14 and says so', async () => {
      setGeneration(14);
      const document = sceneWithLevels([levelDocument('ground'), levelDocument('tower')]);
      const { game } = world(document);

      await expect(createViewSceneHandler(provider(game))({ sceneId: 'dungeon', levelId: 'tower' })).resolves.toEqual({
        viewed: true,
        sceneId: 'dungeon',
        levelId: 'tower'
      });
      expect(document.view).toHaveBeenCalledWith({ level: 'tower' });
    });

    it('refuses a level below Foundry 14, and an unknown one', async () => {
      const { game } = world(sceneDocument());

      await expect(createViewSceneHandler(provider(game))({ sceneId: 'dungeon', levelId: 'tower' })).rejects.toThrow(
        'Scene levels require Foundry 14 or newer'
      );
      setGeneration(14);
      const { game: v14 } = world(sceneWithLevels([levelDocument('ground')]));
      await expect(createViewSceneHandler(provider(v14))({ sceneId: 'dungeon', levelId: 'tower' })).rejects.toThrow(
        'Level not found: tower'
      );
    });
  });
});
