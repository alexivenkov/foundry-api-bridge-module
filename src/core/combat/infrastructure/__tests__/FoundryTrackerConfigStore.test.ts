import { FoundryTrackerConfigStore } from '../FoundryTrackerConfigStore';
import type { CombatConfigurationProvider } from '../foundryTrackerConfigTypes';
import { clearFoundryGeneration, setFoundryGeneration } from './fakeDocuments';
import { worldWith } from './fakeWorld';

// The value Foundry 13 and 14 hand out before the configuration was ever
// saved: the initial value of the setting's schema (probed in Node).
const INITIAL = {
  resource: '',
  skipDefeated: false,
  turnMarker: { enabled: true, animation: 'spin', src: '', disposition: false }
};

function storeFor(stored: unknown, configuration?: CombatConfigurationProvider) {
  const world = worldWith([], { stored });
  return { store: new FoundryTrackerConfigStore({ getGame: () => world.game }, configuration), set: world.set };
}

describe('FoundryTrackerConfigStore', () => {
  afterEach(() => {
    clearFoundryGeneration();
  });

  describe('on Foundry 13 and 14', () => {
    beforeEach(() => {
      setFoundryGeneration(13);
    });

    it('reads the initial value, a blank resource and source as none', () => {
      expect(storeFor(INITIAL).store.readConfig()).toEqual({
        resource: null,
        skipDefeated: false,
        turnMarker: { enabled: true, animation: 'spin', src: null, disposition: false }
      });
    });

    it('reads a saved configuration', () => {
      const stored = {
        resource: 'attributes.hp.value',
        skipDefeated: true,
        turnMarker: { enabled: false, animation: 'pulse', src: 'icons/marker.webm', disposition: true }
      };

      expect(storeFor(stored).store.readConfig()).toEqual({
        resource: 'attributes.hp.value',
        skipDefeated: true,
        turnMarker: { enabled: false, animation: 'pulse', src: 'icons/marker.webm', disposition: true }
      });
    });

    it('writes the whole value under core.combatTrackerConfig, blank for none', async () => {
      const { store, set } = storeFor(INITIAL);

      await store.writeConfig({
        resource: null,
        skipDefeated: true,
        turnMarker: { enabled: true, animation: 'spinPulse', src: null, disposition: true }
      });

      expect(set).toHaveBeenCalledWith('core', 'combatTrackerConfig', {
        resource: '',
        skipDefeated: true,
        turnMarker: { enabled: true, animation: 'spinPulse', src: '', disposition: true }
      });
    });

    it('reads the registered turn marker animations', () => {
      const configuration = () => ({ turnMarkerAnimations: [{ value: 'spin' }, { value: 'glow' }] });

      expect(storeFor(INITIAL, configuration).store.turnMarkerAnimations()).toEqual(['spin', 'glow']);
      expect(storeFor(INITIAL, () => undefined).store.turnMarkerAnimations()).toEqual([]);
    });

    it('knows turn markers', () => {
      expect(storeFor(INITIAL).store.turnMarkersAvailable()).toBe(true);
    });
  });

  describe('before Foundry 13', () => {
    beforeEach(() => {
      setFoundryGeneration(12);
    });

    it('reads the plain object, stored as {} until first saved, without a turn marker', () => {
      expect(storeFor({}).store.readConfig()).toEqual({ resource: null, skipDefeated: false });
      expect(storeFor({ resource: 'hp.value', skipDefeated: true }).store.readConfig()).toEqual({
        resource: 'hp.value',
        skipDefeated: true
      });
    });

    it('writes the two fields and keeps whatever else the object holds', async () => {
      const { store, set } = storeFor({ resource: '', skipDefeated: false, moduleKey: 1 });

      await store.writeConfig({ resource: 'hp.value', skipDefeated: true });

      expect(set).toHaveBeenCalledWith('core', 'combatTrackerConfig', {
        resource: 'hp.value',
        skipDefeated: true,
        moduleKey: 1
      });
    });

    it('knows no turn markers', () => {
      expect(storeFor({}).store.turnMarkersAvailable()).toBe(false);
    });
  });
});
