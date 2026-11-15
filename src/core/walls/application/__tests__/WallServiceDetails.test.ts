import { CoreFeatureUnavailableError } from '../../../shared';
import type { WallEnvironment } from '../../domain';
import { WallService } from '../WallService';
import { FakeSceneLocator, FakeWallStore, wall } from './fakePorts';

function environment(overrides: Partial<WallEnvironment> = {}): WallEnvironment {
  return {
    features: () => ({ doorAnimation: true }),
    doorSounds: () => [{ id: 'jail', label: 'Jail' }],
    doorAnimationTypes: () => ['swing', 'slide'],
    ...overrides
  };
}

function setup(env?: WallEnvironment): { service: WallService; store: FakeWallStore } {
  const store = new FakeWallStore({
    dungeon: [
      wall({
        id: 'gate',
        door: 'door',
        threshold: {
          light: { proximity: null, distance: null },
          sight: { proximity: 'proximity', distance: 10 },
          sound: { proximity: null, distance: null },
          attenuation: false
        }
      })
    ]
  });
  const service = new WallService({ scenes: new FakeSceneLocator(['dungeon'], 'dungeon'), walls: store, environment: env });
  return { service, store };
}

describe('WallService wall details', () => {
  it('writes a proximity sense back to normal when its proximity is cleared', async () => {
    const { service, store } = setup(environment());

    await service.updateWall({ sceneId: undefined, wallId: 'gate', changes: { threshold: { sight: { proximity: null } } } });

    expect(store.updated[0]?.changes).toMatchObject({ sight: 'normal', threshold: { sight: { proximity: null } } });
  });

  it('refuses a door animation where the core has none', async () => {
    const { service, store } = setup(environment({ features: () => ({ doorAnimation: false }) }));

    await expect(
      service.updateWall({ sceneId: 'dungeon', wallId: 'gate', changes: { animation: { type: 'slide' } } })
    ).rejects.toThrow(CoreFeatureUnavailableError);
    expect(store.updated).toEqual([]);
  });

  it('refuses an unknown door sound or animation type before writing', async () => {
    const { service, store } = setup(environment());

    await expect(
      service.createWall({ sceneId: undefined, draft: { segment: [0, 0, 1, 1], doorSound: 'kazoo' } })
    ).rejects.toThrow('Unknown door sound: kazoo. Known: jail');
    await expect(
      service.updateWall({ sceneId: undefined, wallId: 'gate', changes: { animation: { type: 'spin' } } })
    ).rejects.toThrow('Unknown door animation: spin. Known: swing, slide');
    expect(store.created).toEqual([]);
    expect(store.updated).toEqual([]);
  });

  it('checks the threshold of a new wall against no threshold', async () => {
    const { service } = setup(environment());

    await expect(
      service.createWall({ sceneId: undefined, draft: { segment: [0, 0, 1, 1], threshold: { light: { proximity: 'proximity' } } } })
    ).rejects.toThrow('A light proximity needs threshold.light.distance');
  });

  it('lists the door sounds of the world, and none without an environment', () => {
    expect(setup(environment()).service.listDoorSounds()).toEqual([{ id: 'jail', label: 'Jail' }]);
    expect(setup().service.listDoorSounds()).toEqual([]);
  });

  it('checks nothing against registries without an environment', async () => {
    const { service, store } = setup();

    await service.updateWall({
      sceneId: undefined,
      wallId: 'gate',
      changes: { doorSound: 'kazoo', animation: { type: 'spin' } }
    });

    expect(store.updated).toHaveLength(1);
  });
});
