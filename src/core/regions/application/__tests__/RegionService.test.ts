import { CoreFeatureUnavailableError, NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import { ValidationError } from '../../../../kernel';
import {
  RegionCreationFailedError,
  RegionLevelNotFoundError,
  RegionNotFoundError,
  RegionPointTestUnavailableError,
  RegionShapeNotComputedError,
  RegionTokenNotFoundError
} from '../../domain';
import { RegionService } from '../RegionService';
import { FakeRegionStore, FakeSceneLocator, V13_FEATURES, region } from './fakePorts';

function setup(store = new FakeRegionStore({ s1: [region()], s2: [] })): { service: RegionService; store: FakeRegionStore } {
  return { service: new RegionService({ scenes: new FakeSceneLocator(['s1', 's2'], 's1'), regions: store }), store };
}

describe('RegionService', () => {
  it('refuses every use case before Foundry 12', async () => {
    const { service, store } = setup();
    store.featureSet = { ...V13_FEATURES, available: false };

    expect(() => service.listRegions({ sceneId: undefined })).toThrow(
      new CoreFeatureUnavailableError('Regions require Foundry 12 or newer')
    );
    await expect(service.createRegion({ sceneId: undefined, draft: { name: 'X' } })).rejects.toThrow(
      'Regions require Foundry 12 or newer'
    );
    expect(() => service.testPoint({ sceneId: undefined, regionId: 'r1', point: { x: 0, y: 0, elevation: 0 } })).toThrow(
      CoreFeatureUnavailableError
    );
  });

  describe('reading', () => {
    it('lists the regions of the active scene when no scene is named', () => {
      const { service } = setup();
      expect(service.listRegions({ sceneId: undefined })).toEqual({ sceneId: 's1', regions: [region()] });
    });

    it('answers the canonical scene errors', () => {
      const { service } = setup();
      expect(() => service.listRegions({ sceneId: 'nope' })).toThrow(new SceneNotFoundError('nope'));
      const noActive = new RegionService({ scenes: new FakeSceneLocator([], null), regions: new FakeRegionStore() });
      expect(() => noActive.listRegions({ sceneId: undefined })).toThrow(NoActiveSceneError);
    });

    it('gets one region and reports a missing one', () => {
      const { service } = setup();
      expect(service.getRegion({ sceneId: 's1', regionId: 'r1' })).toEqual({ sceneId: 's1', region: region() });
      expect(() => service.getRegion({ sceneId: 's1', regionId: 'zz' })).toThrow(new RegionNotFoundError('zz'));
    });
  });

  describe('createRegion', () => {
    it('creates on the addressed scene', async () => {
      const { service, store } = setup();
      const result = await service.createRegion({ sceneId: 's2', draft: { name: 'Trap', elevation: { bottom: 0, top: 5 } } });

      expect(result.sceneId).toBe('s2');
      expect(store.created).toEqual([{ sceneId: 's2', draft: { name: 'Trap', elevation: { bottom: 0, top: 5 } } }]);
    });

    it('reports a creation the core vetoed', async () => {
      const { service, store } = setup();
      store.createsNothing = true;
      await expect(service.createRegion({ sceneId: 's1', draft: { name: 'X' } })).rejects.toThrow(
        new RegionCreationFailedError()
      );
    });

    it('rejects an elevation range whose top is below its bottom', async () => {
      const { service, store } = setup();
      await expect(
        service.createRegion({ sceneId: 's1', draft: { name: 'X', elevation: { bottom: 10, top: 0 } } })
      ).rejects.toThrow(new ValidationError('elevation.top may not be less than elevation.bottom'));
      expect(store.created).toEqual([]);
    });

    it('refuses Foundry 14 shapes and attributes on an older core', async () => {
      const { service, store } = setup();
      store.featureSet = V13_FEATURES;

      await expect(
        service.createRegion({
          sceneId: 's1',
          draft: { name: 'X', shapes: [{ type: 'cone', x: 0, y: 0, radius: 10, angle: 60 }] }
        })
      ).rejects.toThrow('Region shape type cone requires Foundry 14 or newer');
      await expect(service.createRegion({ sceneId: 's1', draft: { name: 'X', hidden: true } })).rejects.toThrow(
        'Region hidden requires Foundry 14 or newer'
      );
      await expect(service.createRegion({ sceneId: 's1', draft: { name: 'X', visibility: 'observer' } })).rejects.toThrow(
        "Region visibility 'observer' requires Foundry 14 or newer"
      );
      expect(store.created).toEqual([]);
    });

    it('checks the attached token and the levels against the scene', async () => {
      const { service } = setup();
      await expect(service.createRegion({ sceneId: 's1', draft: { name: 'X', attachedTokenId: 'ghost' } })).rejects.toThrow(
        new RegionTokenNotFoundError('ghost')
      );
      await expect(service.createRegion({ sceneId: 's1', draft: { name: 'X', levelIds: ['l1', 'l9'] } })).rejects.toThrow(
        new RegionLevelNotFoundError('l9')
      );
      await expect(
        service.createRegion({ sceneId: 's1', draft: { name: 'X', attachedTokenId: 't1', levelIds: ['l1'] } })
      ).resolves.toMatchObject({ sceneId: 's1' });
    });
  });

  describe('updateRegion', () => {
    it('updates an existing region', async () => {
      const { service, store } = setup();
      const result = await service.updateRegion({ sceneId: 's1', regionId: 'r1', changes: { name: 'Renamed' } });

      expect(result.region.name).toBe('Renamed');
      expect(store.updated).toEqual([{ sceneId: 's1', regionId: 'r1', changes: { name: 'Renamed' } }]);
    });

    it('checks the merged elevation: a new bottom above the kept top is refused', async () => {
      const { service, store } = setup();
      await expect(
        service.updateRegion({ sceneId: 's1', regionId: 'r1', changes: { elevation: { bottom: 20 } } })
      ).rejects.toThrow('elevation.top may not be less than elevation.bottom');
      await expect(
        service.updateRegion({ sceneId: 's1', regionId: 'r1', changes: { elevation: { bottom: 20, top: null } } })
      ).resolves.toBeDefined();
      expect(store.updated).toHaveLength(1);
    });

    it('reports a missing region before and after the write', async () => {
      const { service, store } = setup();
      await expect(service.updateRegion({ sceneId: 's1', regionId: 'zz', changes: {} })).rejects.toThrow(
        new RegionNotFoundError('zz')
      );
      store.losesRegionOnUpdate = true;
      await expect(service.updateRegion({ sceneId: 's1', regionId: 'r1', changes: {} })).rejects.toThrow(
        new RegionNotFoundError('r1')
      );
    });

    it('allows detaching (null) without a token lookup', async () => {
      const { service, store } = setup();
      store.tokenIds = [];
      await expect(
        service.updateRegion({ sceneId: 's1', regionId: 'r1', changes: { attachedTokenId: null } })
      ).resolves.toBeDefined();
    });
  });

  it('deletes an existing region', async () => {
    const { service, store } = setup();
    await expect(service.deleteRegion({ sceneId: 's1', regionId: 'r1' })).resolves.toEqual({ sceneId: 's1', regionId: 'r1' });
    expect(store.deleted).toEqual([{ sceneId: 's1', regionId: 'r1' }]);
    await expect(service.deleteRegion({ sceneId: 's1', regionId: 'zz' })).rejects.toThrow(RegionNotFoundError);
  });

  describe('queries', () => {
    it('lists the tokens the core records inside', () => {
      const { service } = setup();
      expect(service.listTokensInside({ sceneId: undefined, regionId: 'r1' })).toEqual({
        sceneId: 's1',
        regionId: 'r1',
        tokens: [{ id: 't1', name: 'Goblin' }]
      });
    });

    it('tests a point and echoes it', () => {
      const { service, store } = setup();
      const point = { x: 5, y: 6, elevation: 2 };
      expect(service.testPoint({ sceneId: 's1', regionId: 'r1', point })).toEqual({
        sceneId: 's1',
        regionId: 'r1',
        point,
        inside: true
      });
      expect(store.pointTests).toEqual([{ sceneId: 's1', regionId: 'r1', point }]);
    });

    it('refuses when the core cannot answer', () => {
      const { service, store } = setup();
      const query = { sceneId: 's1', regionId: 'r1', point: { x: 0, y: 0, elevation: 0 } };
      store.pointAnswer = { kind: 'shape-not-computed' };
      expect(() => service.testPoint(query)).toThrow(RegionShapeNotComputedError);
      store.pointAnswer = { kind: 'unavailable' };
      expect(() => service.testPoint(query)).toThrow(new RegionPointTestUnavailableError());
    });

    it('reports a missing region', () => {
      const { service } = setup();
      expect(() => service.listTokensInside({ sceneId: 's1', regionId: 'zz' })).toThrow(new RegionNotFoundError('zz'));
    });
  });
});
