import { SceneNotFoundError } from '../../../shared';
import { FoundryAmbientSoundStore } from '../FoundryAmbientSoundStore';
import { FoundrySoundEnvironment } from '../FoundrySoundEnvironment';
import { soundFeaturesFor } from '../soundFeatures';
import type {
  FoundryAmbientSoundDocument,
  FoundryAmbientSoundGame,
  FoundryAmbientSoundScene
} from '../foundryAmbientSoundTypes';

// The fakes mirror what the Node probe of BaseAmbientSound showed for Foundry
// 13.351 / 14.368: an unset effect type is undefined on the instance, a type
// cleared by the core form is '', `levels` initializes to a Set.

function document(overrides: Partial<FoundryAmbientSoundDocument> = {}): FoundryAmbientSoundDocument {
  return {
    id: 's1',
    name: undefined,
    x: 10,
    y: 20,
    elevation: 0,
    levels: new Set<string>(),
    radius: 30,
    path: 'sounds/fire.ogg',
    repeat: false,
    volume: 0.5,
    walls: true,
    easing: true,
    hidden: false,
    locked: false,
    darkness: { min: 0, max: 1 },
    effects: { base: { intensity: 5 }, muffled: { intensity: 5 } },
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

interface SceneMocks {
  scene: FoundryAmbientSoundScene;
  create: jest.Mock;
  remove: jest.Mock;
}

function scene(id: string, documents: FoundryAmbientSoundDocument[] = [], levelIds: string[] = []): SceneMocks {
  const create = jest.fn();
  const remove = jest.fn().mockResolvedValue([]);
  return {
    scene: {
      id,
      sounds: { get: (soundId) => documents.find((doc) => doc.id === soundId), contents: documents },
      levels: { contents: levelIds.map((levelId) => ({ id: levelId })) },
      createEmbeddedDocuments: create,
      deleteEmbeddedDocuments: remove
    },
    create,
    remove
  };
}

function storeFor(generation: number, ...scenes: FoundryAmbientSoundScene[]): FoundryAmbientSoundStore {
  const game: FoundryAmbientSoundGame = {
    scenes: { get: (id) => scenes.find((candidate) => candidate.id === id), active: scenes[0] ?? null }
  };
  return new FoundryAmbientSoundStore({ getGame: () => game }, () => generation);
}

describe('FoundryAmbientSoundStore', () => {
  describe('reading', () => {
    it('maps a Foundry 14 sound, with unset and cleared effect types as null', () => {
      const fire = document({
        id: 'fire',
        name: 'Fire',
        elevation: 2,
        levels: new Set(['aaaaaaaaaaaaaaaa']),
        repeat: true,
        volume: 0.8,
        walls: false,
        easing: false,
        hidden: true,
        locked: true,
        darkness: { min: 0.1, max: 0.7 },
        effects: { base: { type: 'reverb', intensity: 3 }, muffled: { type: '', intensity: 9 } }
      });

      expect(storeFor(14, scene('s', [fire, document()]).scene).listAmbientSounds('s')).toEqual([
        {
          id: 'fire',
          x: 10,
          y: 20,
          elevation: 2,
          radius: 30,
          path: 'sounds/fire.ogg',
          repeat: true,
          volume: 0.8,
          walls: false,
          easing: false,
          hidden: true,
          darkness: { min: 0.1, max: 0.7 },
          baseEffect: { type: 'reverb', intensity: 3 },
          muffledEffect: { type: null, intensity: 9 },
          name: 'Fire',
          locked: true,
          levels: ['aaaaaaaaaaaaaaaa']
        },
        expect.objectContaining({ id: 's1', baseEffect: { type: null, intensity: 5 }, name: null, levels: [] })
      ]);
    });

    it('reads a detached file as null and leaves out what the generation lacks', () => {
      const v13 = storeFor(13, scene('s', [document({ path: null })]).scene).findAmbientSound('s', 's1');
      expect(v13).toMatchObject({ path: null, elevation: 0, name: undefined, locked: undefined, levels: undefined });

      const legacy = document({ elevation: undefined, effects: undefined });
      const v11 = storeFor(11, scene('s', [legacy]).scene).findAmbientSound('s', 's1');
      expect(v11).toMatchObject({ elevation: undefined, baseEffect: undefined, muffledEffect: undefined });
    });

    it('answers null for an unknown sound, fails for an unknown scene, lists level ids', () => {
      const store = storeFor(14, scene('s', [], ['lvl']).scene);
      expect(store.findAmbientSound('s', 'nope')).toBeNull();
      expect(store.listSceneLevelIds('s')).toEqual(['lvl']);
      expect(() => store.listAmbientSounds('elsewhere')).toThrow(new SceneNotFoundError('elsewhere'));
    });
  });

  describe('writing', () => {
    it('creates an AmbientSound with nested darkness and effects', async () => {
      const mocks = scene('s');
      mocks.create.mockResolvedValue([document({ id: 'new' })]);

      const created = await storeFor(14, mocks.scene).createAmbientSound('s', {
        x: 1,
        y: 2,
        radius: 15,
        path: 'sounds/wind.ogg',
        elevation: 3,
        repeat: true,
        darkness: { min: 0.2 },
        baseEffect: { type: 'lowpass', intensity: 4 },
        muffledEffect: { type: 'reverb' },
        name: 'Wind',
        locked: false,
        levels: ['a', 'a']
      });

      expect(mocks.create).toHaveBeenCalledWith('AmbientSound', [
        {
          x: 1,
          y: 2,
          elevation: 3,
          radius: 15,
          path: 'sounds/wind.ogg',
          repeat: true,
          locked: false,
          name: 'Wind',
          levels: ['a'],
          darkness: { min: 0.2 },
          effects: { base: { type: 'lowpass', intensity: 4 }, muffled: { type: 'reverb' } }
        }
      ]);
      expect(created?.id).toBe('new');
    });

    it('answers null when the core created nothing', async () => {
      const mocks = scene('s');
      mocks.create.mockResolvedValue([]);
      await expect(
        storeFor(14, mocks.scene).createAmbientSound('s', { x: 0, y: 0, radius: 1, path: 'a.ogg' })
      ).resolves.toBeNull();
    });

    it('updates only what is given; a removed effect and a cleared name become empty strings', async () => {
      const existing = document();
      const store = storeFor(14, scene('s', [existing]).scene);

      await store.updateAmbientSound('s', 's1', { path: null, baseEffect: { type: null }, muffledEffect: { intensity: 9 }, name: null });
      await store.updateAmbientSound('s', 's1', { volume: 0.2 });

      expect(existing.update).toHaveBeenNthCalledWith(1, {
        path: null,
        name: '',
        effects: { base: { type: '' }, muffled: { intensity: 9 } }
      });
      expect(existing.update).toHaveBeenNthCalledWith(2, { volume: 0.2 });
    });

    it('answers null for a sound that is gone and deletes through the scene', async () => {
      const mocks = scene('s', [document()]);
      const store = storeFor(14, mocks.scene);
      await expect(store.updateAmbientSound('s', 'gone', { radius: 1 })).resolves.toBeNull();
      await store.deleteAmbientSound('s', 's1');
      expect(mocks.remove).toHaveBeenCalledWith('AmbientSound', ['s1']);
    });
  });
});

describe('soundFeaturesFor', () => {
  it('follows the generations', () => {
    expect(soundFeaturesFor(14)).toEqual({ elevation: true, effects: true, positionalElevation: true, levels: true });
    expect(soundFeaturesFor(13)).toEqual({ elevation: true, effects: true, positionalElevation: true, levels: false });
    expect(soundFeaturesFor(12)).toEqual({ elevation: true, effects: true, positionalElevation: false, levels: false });
    expect(soundFeaturesFor(11)).toEqual({ elevation: false, effects: false, positionalElevation: false, levels: false });
    expect(soundFeaturesFor(0)).toEqual(soundFeaturesFor(14));
  });
});

describe('FoundrySoundEnvironment', () => {
  it('reads the effect ids of CONFIG.soundEffects, null without the registry', () => {
    expect(
      new FoundrySoundEnvironment(() => ({ CONFIG: { soundEffects: { lowpass: {}, reverb: {} } } }), () => 13).effectTypes()
    ).toEqual(['lowpass', 'reverb']);
    expect(new FoundrySoundEnvironment(() => ({}), () => 13).effectTypes()).toBeNull();
    expect(new FoundrySoundEnvironment(() => ({}), () => 11).features().effects).toBe(false);
  });
});
