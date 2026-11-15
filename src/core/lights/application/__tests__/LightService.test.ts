import { CoreFeatureUnavailableError, NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import {
  InvalidLightDarknessRangeError,
  LightCreationFailedError,
  LightNotFoundError,
  UnknownLightAnimationError,
  UnknownLightLevelError
} from '../../domain';
import { LightService } from '../LightService';
import { ALL_LIGHT_FEATURES, FakeLightEnvironment, FakeLightStore, FakeSceneLocator, light } from './fakePorts';

function setup(options: { activeId?: string | null; environment?: FakeLightEnvironment } = {}): {
  service: LightService;
  store: FakeLightStore;
} {
  const store = new FakeLightStore({
    active: [light({ id: 'a1' })],
    cellar: [light({ id: 'c1', darkness: { min: 0.2, max: 0.6 } }), light({ id: 'gloom', negative: true })]
  });
  const service = new LightService({
    scenes: new FakeSceneLocator(['active', 'cellar'], options.activeId === undefined ? 'active' : options.activeId),
    lights: store,
    environment: options.environment ?? new FakeLightEnvironment()
  });
  return { service, store };
}

describe('LightService', () => {
  describe('listLights', () => {
    it('lists the lights of the active scene when no scene is named', () => {
      const { service } = setup();
      const result = service.listLights({ sceneId: undefined });
      expect(result.sceneId).toBe('active');
      expect(result.lights.map((entry) => entry.id)).toEqual(['a1']);
    });

    it('lists the lights of a named scene', () => {
      const { service } = setup();
      expect(service.listLights({ sceneId: 'cellar' }).lights).toHaveLength(2);
    });

    it('fails without an active scene or with an unknown scene', () => {
      expect(() => setup({ activeId: null }).service.listLights({ sceneId: undefined })).toThrow(NoActiveSceneError);
      expect(() => setup().service.listLights({ sceneId: 'nowhere' })).toThrow(new SceneNotFoundError('nowhere'));
    });
  });

  describe('createLight', () => {
    it('creates the light on the addressed scene and returns it with the scene id', async () => {
      const { service, store } = setup();
      const draft = { x: 5, y: 6, dim: 30, animation: { type: 'torch' } };

      const result = await service.createLight({ sceneId: 'cellar', draft });

      expect(store.created).toEqual([{ sceneId: 'cellar', draft }]);
      expect(result.sceneId).toBe('cellar');
      expect(result.light).toMatchObject({ id: 'created', x: 5, y: 6 });
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;
      await expect(service.createLight({ sceneId: undefined, draft: { x: 0, y: 0 } })).rejects.toThrow(
        new LightCreationFailedError()
      );
      await expect(service.createLight({ sceneId: undefined, draft: { x: 0, y: 0 } })).rejects.toThrow(
        'Failed to create light'
      );
    });

    it('checks the animation against the darkness registry for a darkness source', async () => {
      const { service, store } = setup();
      await expect(
        service.createLight({ sceneId: undefined, draft: { x: 0, y: 0, negative: true, animation: { type: 'torch' } } })
      ).rejects.toThrow(UnknownLightAnimationError);
      await service.createLight({
        sceneId: undefined,
        draft: { x: 0, y: 0, negative: true, animation: { type: 'magicalGloom' } }
      });
      expect(store.created).toHaveLength(1);
    });

    it('refuses an inverted darkness range against the defaults', async () => {
      const { service, store } = setup();
      await expect(
        service.createLight({ sceneId: undefined, draft: { x: 0, y: 0, darkness: { min: 0.8, max: 0.2 } } })
      ).rejects.toThrow(InvalidLightDarknessRangeError);
      expect(store.created).toHaveLength(0);
    });

    it('refuses what the running generation does not store, before touching the scene', async () => {
      const environment = new FakeLightEnvironment({ ...ALL_LIGHT_FEATURES, levels: false, attenuationColorations: false });
      const { service, store } = setup({ environment });
      await expect(service.createLight({ sceneId: undefined, draft: { x: 0, y: 0, levels: ['zz'] } })).rejects.toThrow(
        CoreFeatureUnavailableError
      );
      await expect(
        service.createLight({ sceneId: undefined, draft: { x: 0, y: 0, coloration: 'adaptive-attenuation' } })
      ).rejects.toThrow('The adaptive-attenuation coloration requires Foundry 14 or newer');
      expect(store.created).toHaveLength(0);
    });

    it('checks the levels against the scene', async () => {
      const { service, store } = setup();
      store.levelIds = ['lvl1'];
      await expect(service.createLight({ sceneId: undefined, draft: { x: 0, y: 0, levels: ['lvl2'] } })).rejects.toThrow(
        new UnknownLightLevelError('lvl2')
      );
      await service.createLight({ sceneId: undefined, draft: { x: 0, y: 0, levels: ['lvl1'] } });
      expect(store.created).toHaveLength(1);
    });
  });

  describe('updateLight', () => {
    it('applies the changes and returns the updated light', async () => {
      const { service, store } = setup();
      const result = await service.updateLight({ sceneId: 'cellar', lightId: 'c1', changes: { dim: 50 } });
      expect(store.updated).toEqual([{ sceneId: 'cellar', lightId: 'c1', changes: { dim: 50 } }]);
      expect(result).toMatchObject({ sceneId: 'cellar', light: { id: 'c1', dim: 50 } });
    });

    it('fails for a light that is not in the scene', async () => {
      const { service, store } = setup();
      await expect(service.updateLight({ sceneId: undefined, lightId: 'c1', changes: {} })).rejects.toThrow(
        new LightNotFoundError('c1')
      );
      expect(store.updated).toHaveLength(0);
    });

    it('fails when the light disappears during the update', async () => {
      const { service, store } = setup();
      store.losesLightOnUpdate = true;
      await expect(service.updateLight({ sceneId: undefined, lightId: 'a1', changes: { dim: 1 } })).rejects.toThrow(
        'Light not found: a1'
      );
    });

    it('merges a partial darkness range into the stored one', async () => {
      const { service } = setup();
      await expect(
        service.updateLight({ sceneId: 'cellar', lightId: 'c1', changes: { darkness: { min: 0.7 } } })
      ).rejects.toThrow('Darkness range min (0.7) may not exceed max (0.6)');
      await expect(
        service.updateLight({ sceneId: 'cellar', lightId: 'c1', changes: { darkness: { min: 0.5 } } })
      ).resolves.toBeDefined();
    });

    it('takes the stored kind of source unless the update switches it', async () => {
      const { service } = setup();
      await expect(
        service.updateLight({ sceneId: 'cellar', lightId: 'gloom', changes: { animation: { type: 'hole' } } })
      ).resolves.toBeDefined();
      await expect(
        service.updateLight({ sceneId: 'cellar', lightId: 'gloom', changes: { animation: { type: 'torch' } } })
      ).rejects.toThrow('Unknown darkness animation: torch. Known: magicalGloom, hole');
      await expect(
        service.updateLight({
          sceneId: 'cellar',
          lightId: 'gloom',
          changes: { negative: false, animation: { type: 'torch' } }
        })
      ).resolves.toBeDefined();
    });

    it('lets null stop the animation without consulting the registry', async () => {
      const environment = new FakeLightEnvironment(ALL_LIGHT_FEATURES, {});
      const { service } = setup({ environment });
      await expect(
        service.updateLight({ sceneId: undefined, lightId: 'a1', changes: { animation: { type: null } } })
      ).resolves.toBeDefined();
      await expect(
        service.updateLight({ sceneId: undefined, lightId: 'a1', changes: { animation: { type: 'custom' } } })
      ).resolves.toBeDefined();
    });
  });

  describe('deleteLight', () => {
    it('deletes an existing light', async () => {
      const { service, store } = setup();
      await expect(service.deleteLight({ sceneId: 'cellar', lightId: 'c1' })).resolves.toEqual({
        sceneId: 'cellar',
        lightId: 'c1'
      });
      expect(store.deleted).toEqual([{ sceneId: 'cellar', lightId: 'c1' }]);
    });

    it('fails for an unknown light without deleting anything', async () => {
      const { service, store } = setup();
      await expect(service.deleteLight({ sceneId: undefined, lightId: 'nope' })).rejects.toThrow(LightNotFoundError);
      expect(store.deleted).toHaveLength(0);
    });
  });
});
