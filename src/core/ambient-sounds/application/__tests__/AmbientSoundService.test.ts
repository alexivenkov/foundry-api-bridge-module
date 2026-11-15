import { CoreFeatureUnavailableError, NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import {
  AmbientSoundCreationFailedError,
  AmbientSoundNotFoundError,
  InvalidSoundDarknessRangeError,
  UnknownSoundEffectError,
  UnknownSoundLevelError
} from '../../domain';
import { AmbientSoundService } from '../AmbientSoundService';
import {
  ALL_SOUND_FEATURES,
  FakeAmbientSoundStore,
  FakeSceneLocator,
  FakeSoundEnvironment,
  V11_SOUND_FEATURES,
  ambientSound
} from './fakePorts';

function setup(options: { activeId?: string | null; environment?: FakeSoundEnvironment } = {}): {
  service: AmbientSoundService;
  store: FakeAmbientSoundStore;
} {
  const store = new FakeAmbientSoundStore({
    active: [ambientSound({ id: 'a1' })],
    cave: [ambientSound({ id: 'drip', darkness: { min: 0.3, max: 0.6 } })]
  });
  const service = new AmbientSoundService({
    scenes: new FakeSceneLocator(['active', 'cave'], options.activeId === undefined ? 'active' : options.activeId),
    sounds: store,
    environment: options.environment ?? new FakeSoundEnvironment()
  });
  return { service, store };
}

const DRAFT = { x: 1, y: 2, radius: 10, path: 'sounds/wind.ogg' };

describe('AmbientSoundService', () => {
  it('lists the sounds of the active or a named scene', () => {
    const { service } = setup();
    expect(service.listAmbientSounds({ sceneId: undefined })).toMatchObject({ sceneId: 'active', ambientSounds: [{ id: 'a1' }] });
    expect(service.listAmbientSounds({ sceneId: 'cave' }).ambientSounds.map((entry) => entry.id)).toEqual(['drip']);
    expect(() => service.listAmbientSounds({ sceneId: 'void' })).toThrow(new SceneNotFoundError('void'));
    expect(() => setup({ activeId: null }).service.listAmbientSounds({ sceneId: undefined })).toThrow(NoActiveSceneError);
  });

  describe('createAmbientSound', () => {
    it('creates the sound and returns it with the scene id', async () => {
      const { service, store } = setup();
      const draft = { ...DRAFT, baseEffect: { type: 'reverb', intensity: 3 } };
      const result = await service.createAmbientSound({ sceneId: 'cave', draft });
      expect(store.created).toEqual([{ sceneId: 'cave', draft }]);
      expect(result).toMatchObject({ sceneId: 'cave', ambientSound: { id: 'created', path: 'sounds/wind.ogg' } });
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;
      await expect(service.createAmbientSound({ sceneId: undefined, draft: DRAFT })).rejects.toThrow(
        new AmbientSoundCreationFailedError()
      );
    });

    it('refuses an unknown effect, an inverted range and a foreign level', async () => {
      const { service, store } = setup();
      store.levelIds = ['lvl'];
      await expect(
        service.createAmbientSound({ sceneId: undefined, draft: { ...DRAFT, muffledEffect: { type: 'echo' } } })
      ).rejects.toThrow(UnknownSoundEffectError);
      await expect(
        service.createAmbientSound({ sceneId: undefined, draft: { ...DRAFT, darkness: { min: 0.9, max: 0.1 } } })
      ).rejects.toThrow(InvalidSoundDarknessRangeError);
      await expect(
        service.createAmbientSound({ sceneId: undefined, draft: { ...DRAFT, levels: ['other'] } })
      ).rejects.toThrow(UnknownSoundLevelError);
      expect(store.created).toHaveLength(0);
    });

    it('refuses effects and levels where the generation lacks them', async () => {
      const { service, store } = setup({
        environment: new FakeSoundEnvironment(V11_SOUND_FEATURES)
      });
      await expect(
        service.createAmbientSound({ sceneId: undefined, draft: { ...DRAFT, baseEffect: { type: 'reverb' } } })
      ).rejects.toThrow(CoreFeatureUnavailableError);
      await expect(service.createAmbientSound({ sceneId: undefined, draft: { ...DRAFT, locked: true } })).rejects.toThrow(
        'Ambient sound names, locks and scene levels require Foundry 14 or newer'
      );
      expect(store.created).toHaveLength(0);
    });
  });

  describe('updateAmbientSound', () => {
    it('applies the changes', async () => {
      const { service, store } = setup();
      const result = await service.updateAmbientSound({ sceneId: 'cave', ambientSoundId: 'drip', changes: { radius: 40 } });
      expect(store.updated).toEqual([{ sceneId: 'cave', ambientSoundId: 'drip', changes: { radius: 40 } }]);
      expect(result).toMatchObject({ sceneId: 'cave', ambientSound: { id: 'drip', radius: 40 } });
    });

    it('merges a partial darkness range into the stored one', async () => {
      const { service } = setup();
      await expect(
        service.updateAmbientSound({ sceneId: 'cave', ambientSoundId: 'drip', changes: { darkness: { max: 0.2 } } })
      ).rejects.toThrow('Darkness range min (0.3) may not exceed max (0.2)');
    });

    it('lets null remove an effect without consulting the registry', async () => {
      const { service } = setup({ environment: new FakeSoundEnvironment(ALL_SOUND_FEATURES, []) });
      await expect(
        service.updateAmbientSound({ sceneId: undefined, ambientSoundId: 'a1', changes: { baseEffect: { type: null } } })
      ).resolves.toBeDefined();
    });

    it('fails for an unknown sound, and when it disappears during the update', async () => {
      const { service, store } = setup();
      await expect(
        service.updateAmbientSound({ sceneId: undefined, ambientSoundId: 'drip', changes: {} })
      ).rejects.toThrow(new AmbientSoundNotFoundError('drip'));
      store.losesSoundOnUpdate = true;
      await expect(
        service.updateAmbientSound({ sceneId: undefined, ambientSoundId: 'a1', changes: { radius: 1 } })
      ).rejects.toThrow('Ambient sound not found: a1');
    });
  });

  describe('deleteAmbientSound', () => {
    it('deletes an existing sound and refuses an unknown one', async () => {
      const { service, store } = setup();
      await expect(service.deleteAmbientSound({ sceneId: 'cave', ambientSoundId: 'drip' })).resolves.toEqual({
        sceneId: 'cave',
        ambientSoundId: 'drip'
      });
      await expect(service.deleteAmbientSound({ sceneId: 'cave', ambientSoundId: 'nope' })).rejects.toThrow(
        AmbientSoundNotFoundError
      );
      expect(store.deleted).toEqual([{ sceneId: 'cave', ambientSoundId: 'drip' }]);
    });
  });
});
