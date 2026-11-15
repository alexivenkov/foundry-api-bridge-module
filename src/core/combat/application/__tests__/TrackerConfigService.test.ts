import { CoreFeatureUnavailableError } from '../../../shared';
import { UnknownTurnMarkerAnimationError } from '../../domain';
import { TrackerConfigService } from '../TrackerConfigService';
import { FakeTrackerConfig } from './fakeFeaturePorts';

function setup(): { service: TrackerConfigService; store: FakeTrackerConfig } {
  const store = new FakeTrackerConfig();
  return { service: new TrackerConfigService({ config: store }), store };
}

describe('TrackerConfigService', () => {
  it('reads the configuration with the known animations', () => {
    expect(setup().service.getConfig()).toEqual({
      config: {
        resource: null,
        skipDefeated: false,
        turnMarker: { enabled: true, animation: 'spin', src: null, disposition: false }
      },
      turnMarkerAnimations: ['spin', 'spinPulse', 'pulse']
    });
  });

  it('reads no animations on a core without turn markers', () => {
    const { service, store } = setup();
    store.markers = false;
    store.config = { resource: 'hp', skipDefeated: true };

    expect(service.getConfig()).toEqual({ config: { resource: 'hp', skipDefeated: true }, turnMarkerAnimations: null });
  });

  it('writes the whole configuration with the changes merged in', async () => {
    const { service, store } = setup();

    const view = await service.updateConfig({
      changes: { resource: 'attributes.hp.value', turnMarker: { animation: 'pulse', disposition: true } }
    });

    expect(store.written).toEqual([
      {
        resource: 'attributes.hp.value',
        skipDefeated: false,
        turnMarker: { enabled: true, animation: 'pulse', src: null, disposition: true }
      }
    ]);
    expect(view.config.turnMarker?.animation).toBe('pulse');
  });

  it('writes nothing for a change that names nothing', async () => {
    const { service, store } = setup();

    await service.updateConfig({ changes: { turnMarker: {} } });

    expect(store.written).toEqual([]);
  });

  it('refuses turn marker changes below Foundry 13, but not the rest', async () => {
    const { service, store } = setup();
    store.markers = false;
    store.config = { resource: null, skipDefeated: false };

    await expect(service.updateConfig({ changes: { turnMarker: { enabled: false } } })).rejects.toThrow(
      new CoreFeatureUnavailableError('Turn markers require Foundry 13 or newer')
    );
    await service.updateConfig({ changes: { skipDefeated: true } });
    expect(store.written).toEqual([{ resource: null, skipDefeated: true }]);
  });

  it('refuses an animation the world does not know, naming the known ones', async () => {
    const { service, store } = setup();

    await expect(service.updateConfig({ changes: { turnMarker: { animation: 'wobble' } } })).rejects.toThrow(
      new UnknownTurnMarkerAnimationError('wobble', ['spin', 'spinPulse', 'pulse'])
    );
    expect(store.written).toEqual([]);
  });

  it('takes any animation when the known ones cannot be read', async () => {
    const { service, store } = setup();
    store.animations = [];

    await service.updateConfig({ changes: { turnMarker: { animation: 'module-glow' } } });

    expect(store.written[0]?.turnMarker?.animation).toBe('module-glow');
  });
});
