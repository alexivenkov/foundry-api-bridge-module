import { CoreFeatureUnavailableError, SceneNotFoundError } from '../../../shared';
import { CanvasSceneRequiredError, SceneNotOnCanvasError, UnknownSoundEffectError } from '../../domain';
import { SoundBroadcastService } from '../SoundBroadcastService';
import {
  ALL_SOUND_FEATURES,
  FakeAudioPreloader,
  FakePositionalSoundEmitter,
  FakeSceneLocator,
  FakeSoundEnvironment,
  V11_SOUND_FEATURES,
  positionalSound
} from './fakePorts';

function setup(environment = new FakeSoundEnvironment()): {
  service: SoundBroadcastService;
  emitter: FakePositionalSoundEmitter;
  preloader: FakeAudioPreloader;
} {
  const emitter = new FakePositionalSoundEmitter();
  const preloader = new FakeAudioPreloader();
  const service = new SoundBroadcastService({
    scenes: new FakeSceneLocator(['active', 'other'], 'active'),
    emitter,
    preloader,
    environment
  });
  return { service, emitter, preloader };
}

describe('SoundBroadcastService', () => {
  describe('playAtPosition', () => {
    it('broadcasts the sound and reports the canvas scene and the GM outcome', async () => {
      const { service, emitter } = setup();
      emitter.outcome = 'deferred';
      const sound = positionalSound({ baseEffect: { type: 'reverb', intensity: 4 } });

      await expect(service.playAtPosition({ sceneId: undefined, sound })).resolves.toEqual({
        sceneId: 'active',
        sound,
        gmPlayback: 'deferred'
      });
      expect(emitter.emitted).toEqual([sound]);
    });

    it('accepts the scene guard when it names the canvas scene', async () => {
      const { service, emitter } = setup();
      await service.playAtPosition({ sceneId: 'active', sound: positionalSound() });
      expect(emitter.emitted).toHaveLength(1);
    });

    it('refuses when the guard names another scene, or an unknown one', async () => {
      const { service, emitter } = setup();
      await expect(service.playAtPosition({ sceneId: 'other', sound: positionalSound() })).rejects.toThrow(
        new SceneNotOnCanvasError('other')
      );
      await expect(service.playAtPosition({ sceneId: 'void', sound: positionalSound() })).rejects.toThrow(
        new SceneNotFoundError('void')
      );
      expect(emitter.emitted).toHaveLength(0);
    });

    it('refuses while no scene is open on the canvas', async () => {
      const { service, emitter } = setup();
      emitter.sceneOnCanvas = null;
      await expect(service.playAtPosition({ sceneId: undefined, sound: positionalSound() })).rejects.toThrow(
        new CanvasSceneRequiredError()
      );
      await expect(service.playAtPosition({ sceneId: 'active', sound: positionalSound() })).rejects.toThrow(
        "Positional sounds need a scene open on the GM's canvas"
      );
    });

    it('refuses without a canvas sound layer', async () => {
      const { service, emitter } = setup();
      emitter.available = false;
      await expect(service.playAtPosition({ sceneId: undefined, sound: positionalSound() })).rejects.toThrow(
        CoreFeatureUnavailableError
      );
    });

    it('refuses an unknown effect, and effects before Foundry 12', async () => {
      const { service, emitter } = setup();
      await expect(
        service.playAtPosition({ sceneId: undefined, sound: positionalSound({ muffledEffect: { type: 'echo', intensity: undefined } }) })
      ).rejects.toThrow(UnknownSoundEffectError);

      const legacy = setup(new FakeSoundEnvironment(V11_SOUND_FEATURES));
      await expect(
        legacy.service.playAtPosition({ sceneId: undefined, sound: positionalSound({ baseEffect: { type: 'reverb', intensity: 2 } }) })
      ).rejects.toThrow('Sound effects require Foundry 12 or newer');
      await expect(legacy.service.playAtPosition({ sceneId: undefined, sound: positionalSound() })).resolves.toBeDefined();
      expect(emitter.emitted).toHaveLength(0);
    });

    it('refuses an elevation before Foundry 13 and passes it on from 13', async () => {
      const v12 = setup(new FakeSoundEnvironment({ ...ALL_SOUND_FEATURES, positionalElevation: false }));
      await expect(
        v12.service.playAtPosition({ sceneId: undefined, sound: positionalSound({ elevation: 10 }) })
      ).rejects.toThrow('Positional sound elevation requires Foundry 13 or newer');
      expect(v12.emitter.emitted).toHaveLength(0);

      const { service, emitter } = setup();
      await service.playAtPosition({ sceneId: undefined, sound: positionalSound({ elevation: 10 }) });
      expect(emitter.emitted[0]?.elevation).toBe(10);
    });
  });

  describe('preload', () => {
    it('asks every client to preload and reports the GM outcome', async () => {
      const { service, preloader } = setup();
      preloader.outcome = 'failed';
      await expect(service.preload({ src: 'sounds/a.ogg' })).resolves.toEqual({ src: 'sounds/a.ogg', gmPreload: 'failed' });
      expect(preloader.preloaded).toEqual(['sounds/a.ogg']);
    });

    it('refuses where the core cannot preload', async () => {
      const { service, preloader } = setup();
      preloader.available = false;
      await expect(service.preload({ src: 'sounds/a.ogg' })).rejects.toThrow(
        'Audio preloading is not available in this Foundry version'
      );
    });
  });
});
