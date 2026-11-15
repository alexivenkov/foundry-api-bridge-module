import { SceneNotFoundError } from '../../../shared';
import { FoundryLightStore } from '../FoundryLightStore';
import { FoundryLightEnvironment } from '../FoundryLightEnvironment';
import { colorationFromCode, colorationToCode } from '../colorationCodes';
import { lightFeaturesFor } from '../lightFeatures';
import type { FoundryLightConfig, FoundryLightDocument, FoundryLightGame, FoundryLightScene } from '../foundryLightTypes';

// The fakes mirror what the Node probe of BaseAmbientLight showed for Foundry
// 13.351 / 14.368: `config.color` initializes to a Color whose `css` is the
// hex string, `levels` to a Set, an unset v14 name to undefined.

function config(overrides: Partial<FoundryLightConfig> = {}): FoundryLightConfig {
  return {
    negative: false,
    priority: 0,
    alpha: 0.5,
    angle: 360,
    bright: 0,
    color: null,
    coloration: 1,
    dim: 0,
    attenuation: 0.5,
    luminosity: 0.5,
    saturation: 0,
    contrast: 0,
    shadows: 0,
    animation: { type: null, speed: 5, intensity: 5, reverse: false },
    darkness: { min: 0, max: 1 },
    ...overrides
  };
}

function document(overrides: Partial<FoundryLightDocument> = {}): FoundryLightDocument {
  const doc: FoundryLightDocument = {
    id: 'l1',
    name: undefined,
    x: 100,
    y: 200,
    elevation: 0,
    levels: new Set<string>(),
    rotation: 0,
    walls: true,
    vision: false,
    config: config(),
    hidden: false,
    locked: false,
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
  return doc;
}

interface SceneMocks {
  scene: FoundryLightScene;
  create: jest.Mock;
  remove: jest.Mock;
}

function scene(id: string, documents: FoundryLightDocument[] = [], levelIds: string[] = []): SceneMocks {
  const create = jest.fn();
  const remove = jest.fn().mockResolvedValue([]);
  return {
    scene: {
      id,
      lights: { get: (lightId) => documents.find((doc) => doc.id === lightId), contents: documents },
      levels: { contents: levelIds.map((levelId) => ({ id: levelId })) },
      createEmbeddedDocuments: create,
      deleteEmbeddedDocuments: remove
    },
    create,
    remove
  };
}

function storeFor(generation: number, ...scenes: FoundryLightScene[]): FoundryLightStore {
  const game: FoundryLightGame = {
    scenes: { get: (id) => scenes.find((candidate) => candidate.id === id), active: scenes[0] ?? null }
  };
  return new FoundryLightStore({ getGame: () => game }, () => generation);
}

describe('FoundryLightStore', () => {
  describe('reading', () => {
    it('maps a Foundry 14 light, color from the Color instance and levels from the Set', () => {
      const torch = document({
        id: 'torch',
        name: 'Torch',
        x: 10,
        y: 20,
        elevation: 5,
        rotation: 90,
        walls: false,
        vision: true,
        hidden: true,
        locked: true,
        levels: new Set(['aaaaaaaaaaaaaaaa']),
        config: config({
          negative: true,
          priority: 3,
          color: { css: '#ff8800' },
          coloration: 100,
          dim: 20,
          bright: 10,
          angle: 120,
          animation: { type: 'torch', speed: 3, intensity: 7, reverse: true },
          darkness: { min: 0.2, max: 0.9 }
        })
      });

      expect(storeFor(14, scene('s', [torch]).scene).listLights('s')).toEqual([
        {
          id: 'torch',
          x: 10,
          y: 20,
          elevation: 5,
          rotation: 90,
          walls: false,
          vision: true,
          hidden: true,
          dim: 20,
          bright: 10,
          angle: 120,
          color: '#ff8800',
          alpha: 0.5,
          coloration: 'natural-attenuation',
          luminosity: 0.5,
          attenuation: 0.5,
          saturation: 0,
          contrast: 0,
          shadows: 0,
          animation: { type: 'torch', speed: 3, intensity: 7, reverse: true },
          darkness: { min: 0.2, max: 0.9 },
          negative: true,
          priority: 3,
          name: 'Torch',
          locked: true,
          levels: ['aaaaaaaaaaaaaaaa']
        }
      ]);
    });

    it('reads an unset or cleared v14 name as null', () => {
      const store = storeFor(14, scene('s', [document({ id: 'a' }), document({ id: 'b', name: '' })]).scene);
      expect(store.listLights('s').map((entry) => entry.name)).toEqual([null, null]);
    });

    it('leaves the Foundry 14 fields out on 13 and the 12 fields out on 11', () => {
      const v13 = storeFor(13, scene('s', [document()]).scene).findLight('s', 'l1');
      expect(v13).toMatchObject({ elevation: 0, negative: false, priority: 0 });
      expect(v13).toMatchObject({ name: undefined, locked: undefined, levels: undefined });

      const legacy = document({ elevation: undefined, config: config({ negative: undefined, priority: undefined }) });
      const v11 = storeFor(11, scene('s', [legacy]).scene).findLight('s', 'l1');
      expect(v11).toMatchObject({ elevation: undefined, negative: undefined, priority: undefined });
    });

    it('reads a color stored as a string or a number, and an unknown technique as null', () => {
      const store = storeFor(
        13,
        scene('s', [
          document({ id: 'str', config: config({ color: '#00ff00', coloration: 99 }) }),
          document({ id: 'num', config: config({ color: 0xff8800, coloration: null }) })
        ]).scene
      );
      expect(store.findLight('s', 'str')).toMatchObject({ color: '#00ff00', coloration: null });
      expect(store.findLight('s', 'num')).toMatchObject({ color: '#ff8800', coloration: null });
    });

    it('answers null for an unknown light and fails for an unknown scene', () => {
      const store = storeFor(14, scene('s').scene);
      expect(store.findLight('s', 'nope')).toBeNull();
      expect(() => store.listLights('elsewhere')).toThrow(new SceneNotFoundError('elsewhere'));
    });

    it('lists the scene level ids, none where the core has no levels', () => {
      const { scene: withLevels } = scene('s', [], ['lvl1', 'lvl2']);
      const withoutLevels: FoundryLightScene = { ...scene('t').scene, levels: undefined };
      const store = storeFor(14, withLevels, withoutLevels);
      expect(store.listSceneLevelIds('s')).toEqual(['lvl1', 'lvl2']);
      expect(store.listSceneLevelIds('t')).toEqual([]);
    });
  });

  describe('writing', () => {
    it('creates an AmbientLight with the configuration nested under config', async () => {
      const mocks = scene('s');
      mocks.create.mockResolvedValue([document({ id: 'new' })]);

      const created = await storeFor(14, mocks.scene).createLight('s', {
        x: 1,
        y: 2,
        elevation: 3,
        hidden: true,
        dim: 30,
        color: '#ff8800',
        coloration: 'color-burn',
        animation: { type: 'torch', speed: 3 },
        darkness: { max: 0.8 },
        negative: false,
        priority: 2,
        name: 'Torch',
        locked: true,
        levels: ['a', 'a', 'b']
      });

      expect(mocks.create).toHaveBeenCalledWith('AmbientLight', [
        {
          x: 1,
          y: 2,
          elevation: 3,
          hidden: true,
          locked: true,
          name: 'Torch',
          levels: ['a', 'b'],
          config: {
            dim: 30,
            color: '#ff8800',
            negative: false,
            priority: 2,
            coloration: 4,
            animation: { type: 'torch', speed: 3 },
            darkness: { max: 0.8 }
          }
        }
      ]);
      expect(created?.id).toBe('new');
    });

    it('answers null when the core created nothing', async () => {
      const mocks = scene('s');
      mocks.create.mockResolvedValue([]);
      await expect(storeFor(14, mocks.scene).createLight('s', { x: 0, y: 0 })).resolves.toBeNull();
    });

    it('updates only what is given, writing null color / animation type and an empty name to clear them', async () => {
      const existing = document();
      const store = storeFor(14, scene('s', [existing]).scene);

      await store.updateLight('s', 'l1', { color: null, animation: { type: null }, name: null, levels: [] });
      await store.updateLight('s', 'l1', { dim: 12 });

      expect(existing.update).toHaveBeenNthCalledWith(1, {
        name: '',
        levels: [],
        config: { color: null, animation: { type: null } }
      });
      expect(existing.update).toHaveBeenNthCalledWith(2, { config: { dim: 12 } });
    });

    it('answers null when updating a light that is gone', async () => {
      await expect(storeFor(14, scene('s').scene).updateLight('s', 'gone', { dim: 1 })).resolves.toBeNull();
    });

    it('deletes through the scene', async () => {
      const mocks = scene('s', [document()]);
      await storeFor(14, mocks.scene).deleteLight('s', 'l1');
      expect(mocks.remove).toHaveBeenCalledWith('AmbientLight', ['l1']);
    });
  });
});

describe('colorationCodes', () => {
  it('maps the shader technique ids both ways', () => {
    expect(colorationToCode('legacy')).toBe(0);
    expect(colorationToCode('natural-light')).toBe(10);
    expect(colorationToCode('adaptive-attenuation')).toBe(101);
    expect(colorationFromCode(9)).toBe('invert-absorption');
    expect(colorationFromCode(100)).toBe('natural-attenuation');
    expect(colorationFromCode(11)).toBeNull();
    expect(colorationFromCode(undefined)).toBeNull();
  });
});

describe('lightFeaturesFor', () => {
  it('follows the generations', () => {
    expect(lightFeaturesFor(14)).toEqual({ elevation: true, darknessSources: true, attenuationColorations: true, levels: true });
    expect(lightFeaturesFor(13)).toEqual({ elevation: true, darknessSources: true, attenuationColorations: false, levels: false });
    expect(lightFeaturesFor(11)).toEqual({ elevation: false, darknessSources: false, attenuationColorations: false, levels: false });
    expect(lightFeaturesFor(0)).toEqual(lightFeaturesFor(14));
  });
});

describe('FoundryLightEnvironment', () => {
  it('reads the animation ids of each registry', () => {
    const environment = new FoundryLightEnvironment(
      () => ({ CONFIG: { Canvas: { lightAnimations: { torch: {}, pulse: {} }, darknessAnimations: { hole: {} } } } }),
      () => 13
    );
    expect(environment.animationTypes('light')).toEqual(['torch', 'pulse']);
    expect(environment.animationTypes('darkness')).toEqual(['hole']);
    expect(environment.features().levels).toBe(false);
  });

  it('answers null when a registry is missing', () => {
    const environment = new FoundryLightEnvironment(() => ({ CONFIG: { Canvas: {} } }), () => 14);
    expect(environment.animationTypes('darkness')).toBeNull();
    expect(new FoundryLightEnvironment(() => ({}), () => 14).animationTypes('light')).toBeNull();
  });
});
