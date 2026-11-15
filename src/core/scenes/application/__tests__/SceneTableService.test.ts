import { CoreFeatureUnavailableError, NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import { SceneThumbnailUnavailableError, UserNotFoundError } from '../../domain';
import { SceneTableService } from '../SceneTableService';
import { FakeSceneLocator } from './fakePorts';
import {
  FakeBroadcast,
  FakeLevelStore,
  FakeNavigator,
  FakeThumbnails,
  FakeUsers,
  sceneLevel
} from './settingsFakes';

interface Setup {
  service: SceneTableService;
  navigator: FakeNavigator;
  broadcast: FakeBroadcast;
  levels: FakeLevelStore;
  thumbnails: FakeThumbnails;
}

function setup(activeId: string | null = 'keep'): Setup {
  const navigator = new FakeNavigator();
  const broadcast = new FakeBroadcast();
  const levels = new FakeLevelStore({ keep: [sceneLevel('ground'), sceneLevel('tower')] });
  const thumbnails = new FakeThumbnails();
  const users = new FakeUsers(
    [
      { id: 'gm', active: true },
      { id: 'alice', active: true },
      { id: 'bob', active: false },
      { id: 'carol', active: true }
    ],
    'gm'
  );
  const service = new SceneTableService({
    scenes: new FakeSceneLocator(['keep', 'inn'], activeId),
    navigator,
    broadcast,
    users,
    levels,
    thumbnails
  });
  return { service, navigator, broadcast, levels, thumbnails };
}

describe('SceneTableService', () => {
  describe('viewScene', () => {
    it('views the scene without a level as before, without activating it', async () => {
      const { service, navigator } = setup();

      await expect(service.viewScene({ sceneId: 'inn' })).resolves.toEqual({ id: 'inn', name: 'Scene inn' });
      expect(navigator.viewed).toEqual([{ sceneId: 'inn', levelId: undefined }]);
      expect(navigator.activated).toEqual([]);
    });

    it('views a level of the scene', async () => {
      const { service, navigator } = setup();

      await expect(service.viewScene({ sceneId: 'keep', levelId: 'tower' })).resolves.toMatchObject({ levelId: 'tower' });
      expect(navigator.viewed).toEqual([{ sceneId: 'keep', levelId: 'tower' }]);
    });

    it('refuses a level the scene does not have, and levels below Foundry 14', async () => {
      const { service, levels, navigator } = setup();

      await expect(service.viewScene({ sceneId: 'keep', levelId: 'attic' })).rejects.toThrow('Level not found: attic');
      levels.available = false;
      await expect(service.viewScene({ sceneId: 'keep', levelId: 'tower' })).rejects.toThrow(CoreFeatureUnavailableError);
      expect(navigator.viewed).toEqual([]);
    });

    it('names a missing scene and views nothing', async () => {
      const { service, navigator } = setup();

      await expect(service.viewScene({ sceneId: 'gone' })).rejects.toThrow(SceneNotFoundError);
      expect(navigator.viewed).toEqual([]);
    });
  });

  describe('pullUsers', () => {
    it('pulls every connected user but this GM when none are listed', () => {
      const { service, broadcast } = setup();

      expect(service.pullUsers({ sceneId: 'inn', userIds: undefined, levelId: undefined })).toEqual({
        sceneId: 'inn',
        pulledUserIds: ['alice', 'carol'],
        offlineUserIds: ['bob']
      });
      expect(broadcast.pulled).toEqual([{ sceneId: 'inn', userIds: ['alice', 'carol'], levelId: undefined }]);
    });

    it('pulls the listed users, once each, and reports those offline', () => {
      const { service, broadcast } = setup();

      const pulled = service.pullUsers({ sceneId: undefined, userIds: ['bob', 'alice', 'alice'], levelId: undefined });

      expect(pulled).toEqual({ sceneId: 'keep', pulledUserIds: ['alice'], offlineUserIds: ['bob'] });
      expect(broadcast.pulled).toEqual([{ sceneId: 'keep', userIds: ['alice'], levelId: undefined }]);
    });

    it('sends nothing when nobody listed is connected', () => {
      const { service, broadcast } = setup();

      expect(service.pullUsers({ sceneId: 'inn', userIds: ['bob'], levelId: undefined }).pulledUserIds).toEqual([]);
      expect(broadcast.pulled).toEqual([]);
    });

    it('names a user the world does not have', () => {
      const { service, broadcast } = setup();

      expect(() => service.pullUsers({ sceneId: 'inn', userIds: ['alice', 'zed'], levelId: undefined })).toThrow(
        new UserNotFoundError('zed')
      );
      expect(broadcast.pulled).toEqual([]);
    });

    it('pulls them to a level of the scene', () => {
      const { service, broadcast } = setup();

      expect(service.pullUsers({ sceneId: 'keep', userIds: ['carol'], levelId: 'tower' })).toMatchObject({ levelId: 'tower' });
      expect(broadcast.pulled).toEqual([{ sceneId: 'keep', userIds: ['carol'], levelId: 'tower' }]);
      expect(() => service.pullUsers({ sceneId: 'keep', userIds: ['carol'], levelId: 'attic' })).toThrow('Level not found: attic');
    });
  });

  describe('preloadScene', () => {
    it('preloads the scene named, or the active one', async () => {
      const { service, broadcast } = setup();

      await expect(service.preloadScene({ sceneId: 'inn', levelId: undefined })).resolves.toEqual({ sceneId: 'inn' });
      await service.preloadScene({ sceneId: undefined, levelId: undefined });

      expect(broadcast.preloaded).toEqual([
        { sceneId: 'inn', levelId: undefined },
        { sceneId: 'keep', levelId: undefined }
      ]);
    });

    it('preloads a level of the scene, on Foundry 14 only', async () => {
      const { service, broadcast, levels } = setup();

      await expect(service.preloadScene({ sceneId: 'keep', levelId: 'tower' })).resolves.toEqual({
        sceneId: 'keep',
        levelId: 'tower'
      });
      levels.available = false;
      await expect(service.preloadScene({ sceneId: 'keep', levelId: 'tower' })).rejects.toThrow(
        'Scene levels require Foundry 14 or newer'
      );
      expect(broadcast.preloaded).toHaveLength(1);
    });

    it('reports a missing active scene', async () => {
      await expect(setup(null).service.preloadScene({ sceneId: undefined, levelId: undefined })).rejects.toThrow(
        NoActiveSceneError
      );
    });
  });

  describe('resetFog', () => {
    it('resets any scene, viewed or not', () => {
      const { service, broadcast } = setup();

      expect(service.resetFog({ sceneId: 'inn' })).toEqual({ id: 'inn', name: 'Scene inn' });
      expect(broadcast.fogResets).toEqual(['inn']);
    });

    it('names a missing scene and sends nothing', () => {
      const { service, broadcast } = setup();

      expect(() => service.resetFog({ sceneId: 'gone' })).toThrow('Scene not found: gone');
      expect(broadcast.fogResets).toEqual([]);
    });
  });

  describe('regenerateThumbnail', () => {
    it('regenerates and answers with the stored path', async () => {
      const { service, thumbnails } = setup();

      await expect(service.regenerateThumbnail({ sceneId: 'inn' })).resolves.toEqual({
        sceneId: 'inn',
        thumb: 'worlds/w/assets/scenes/inn-thumb.webp'
      });
      expect(thumbnails.regenerated).toEqual(['inn']);
    });

    it.each([
      ['noCanvas', 'Scene thumbnails cannot be generated while the canvas is disabled'],
      ['nothingToDraw', 'Scene keep has no background image or tiles to draw a thumbnail from']
    ] as const)('refuses when the core could not draw one (%s)', async (blocker, message) => {
      const { service, thumbnails } = setup();
      thumbnails.blocker = blocker;

      await expect(service.regenerateThumbnail({ sceneId: 'keep' })).rejects.toThrow(SceneThumbnailUnavailableError);
      await expect(service.regenerateThumbnail({ sceneId: 'keep' })).rejects.toThrow(message);
      expect(thumbnails.regenerated).toEqual([]);
    });
  });
});
