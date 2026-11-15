import { FoundryTokenAppearanceEnvironment, tokenFeaturesFor } from '../FoundryTokenAppearanceEnvironment';
import { FoundryTokenStore } from '../FoundryTokenStore';
import type { FoundryTokenDocument, FoundryTokenGame, FoundryTokenScene } from '../foundryTokenTypes';
import { appearanceWriteOptions } from '../writeOptions';
import { v13TokenSource } from './tokenAppearanceSources';

describe('tokenFeaturesFor', () => {
  it('maps each generation to the fields its BaseToken stores', () => {
    expect(tokenFeaturesFor(11)).toEqual({ ring: false, darknessSources: false, movement: false, depth: false, textureOffset: true });
    expect(tokenFeaturesFor(13)).toEqual({ ring: true, darknessSources: true, movement: true, depth: false, textureOffset: true });
    expect(tokenFeaturesFor(14)).toEqual({ ring: true, darknessSources: true, movement: true, depth: true, textureOffset: false });
    expect(tokenFeaturesFor(0)).toEqual(tokenFeaturesFor(14));
  });
});

describe('FoundryTokenAppearanceEnvironment', () => {
  const environment = new FoundryTokenAppearanceEnvironment(
    () => ({
      CONFIG: {
        Canvas: {
          lightAnimations: { torch: {}, pulse: {} },
          darknessAnimations: { magicalGloom: {} },
          visionModes: {
            basic: { vision: { defaults: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 } } },
            lightAmplification: { vision: { defaults: { color: null, attenuation: 0, contrast: -0.5, saturation: -1, brightness: -1, odd: 'x' } } }
          },
          detectionModes: { basicSight: {}, seeAll: {} }
        },
        Token: { movement: { actions: { walk: {}, fly: {} } } },
        Combat: { settings: { turnMarkerAnimations: [{ value: 'spin' }, { value: 'pulse' }] } }
      }
    }),
    () => 13
  );

  it('reads the registries of the running world', () => {
    expect(environment.lightAnimations('light')).toEqual(['torch', 'pulse']);
    expect(environment.lightAnimations('darkness')).toEqual(['magicalGloom']);
    expect(environment.visionModes()).toEqual(['basic', 'lightAmplification']);
    expect(environment.detectionModes()).toEqual(['basicSight', 'seeAll']);
    expect(environment.movementActions()).toEqual(['walk', 'fly']);
    expect(environment.turnMarkerAnimations()).toEqual(['spin', 'pulse']);
    expect(environment.features().depth).toBe(false);
  });

  it('reduces a vision mode default set to sight fields', () => {
    expect(environment.visionModeDefaults('lightAmplification')).toEqual({
      color: null,
      attenuation: 0,
      contrast: -0.5,
      saturation: -1,
      brightness: -1
    });
    expect(environment.visionModeDefaults('missing')).toEqual({});
  });

  it('answers null for registries it cannot read', () => {
    const empty = new FoundryTokenAppearanceEnvironment(() => ({}), () => 13);
    expect(empty.visionModes()).toBeNull();
    expect(empty.turnMarkerAnimations()).toBeNull();
    expect(empty.lightAnimations('light')).toBeNull();
  });
});

describe('FoundryTokenStore appearance', () => {
  function setup(): { store: FoundryTokenStore; scene: FoundryTokenScene; token: FoundryTokenDocument } {
    const token: FoundryTokenDocument = {
      id: 't1',
      name: 'Goblin',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      elevation: 0,
      rotation: 0,
      hidden: false,
      texture: { src: 'a.webp', scaleX: -1, scaleY: 1 },
      disposition: -1,
      actor: null,
      _source: v13TokenSource(),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn()
    };
    const scene: FoundryTokenScene = {
      id: 'keep',
      tokens: { get: (id) => (id === 't1' ? token : undefined), contents: [token] },
      createEmbeddedDocuments: jest.fn().mockResolvedValue([token])
    };
    const game: FoundryTokenGame = { scenes: { get: () => scene, active: scene } };
    return { store: new FoundryTokenStore({ getGame: () => game }, () => appearanceWriteOptions(13, {})), scene, token };
  }

  it('reads the appearance from the stored data, null for an unknown token', () => {
    const { store } = setup();
    expect(store.findAppearance('keep', 't1')?.shape).toBe('rectangle-1');
    expect(store.findAppearance('keep', 'ghost')).toBeNull();
  });

  it('writes appearance and placement fields next to the plain ones, merging the legacy scale into the texture', async () => {
    const { store, token } = setup();

    await store.updateToken('keep', 't1', {
      scale: 2,
      texture: { tint: '#ff8800' },
      shape: 'ellipse-1',
      locked: true,
      sort: 3,
      sight: { enabled: true, range: null }
    });

    expect(token.update).toHaveBeenCalledWith({
      texture: { tint: '#ff8800', scaleX: -2, scaleY: 2 },
      shape: 0,
      locked: true,
      sort: 3,
      sight: { enabled: true, range: null }
    });
  });

  it('creates a token with name, display modes and appearance', async () => {
    const { store, scene } = setup();

    await store.createToken('keep', {
      actorId: 'a1',
      x: 100,
      y: 200,
      name: 'Boss',
      nameDisplay: 'hover',
      disposition: 'friendly',
      lockRotation: true,
      width: 2,
      light: { dim: 20, bright: 10 }
    });

    expect(scene.createEmbeddedDocuments).toHaveBeenCalledWith('Token', [
      { actorId: 'a1', x: 100, y: 200, name: 'Boss', displayName: 30, disposition: 1, lockRotation: true, width: 2, light: { dim: 20, bright: 10 } }
    ]);
  });
});
