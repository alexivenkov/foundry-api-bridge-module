import type { FoundryLightDocument, FoundryLightGame, FoundryLightScene } from '../../../../core/lights/infrastructure';
import { createCreateLightHandler } from '../CreateLightHandler';
import { createDeleteLightHandler } from '../DeleteLightHandler';
import { createGetLightsHandler } from '../GetLightsHandler';
import { createUpdateLightHandler } from '../UpdateLightHandler';
import type { LightHandlerDependencies } from '../GetLightsHandler';

function lightDocument(id: string, overrides: Partial<FoundryLightDocument> = {}): FoundryLightDocument {
  return {
    id,
    name: undefined,
    x: 100,
    y: 200,
    elevation: 0,
    levels: new Set<string>(),
    rotation: 0,
    walls: true,
    vision: false,
    hidden: false,
    locked: false,
    config: {
      negative: false,
      priority: 0,
      alpha: 0.5,
      angle: 360,
      bright: 10,
      color: { css: '#ff8800' },
      coloration: 1,
      dim: 20,
      attenuation: 0.5,
      luminosity: 0.5,
      saturation: 0,
      contrast: 0,
      shadows: 0,
      animation: { type: 'torch', speed: 5, intensity: 5, reverse: false },
      darkness: { min: 0, max: 1 }
    },
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

interface World {
  deps: LightHandlerDependencies;
  scene: FoundryLightScene;
  create: jest.Mock;
  remove: jest.Mock;
  documents: FoundryLightDocument[];
}

function world(generation = 14): World {
  const documents = [lightDocument('l1')];
  const create = jest.fn();
  const remove = jest.fn().mockResolvedValue([]);
  const scene: FoundryLightScene = {
    id: 'scene-1',
    lights: { get: (id) => documents.find((doc) => doc.id === id), contents: documents },
    levels: { contents: [] },
    createEmbeddedDocuments: create,
    deleteEmbeddedDocuments: remove
  };
  const game: FoundryLightGame = {
    scenes: { get: (id) => (id === scene.id ? scene : undefined), active: scene }
  };
  return {
    deps: {
      gameProvider: { getGame: () => game },
      globals: () => ({ CONFIG: { Canvas: { lightAnimations: { torch: {} }, darknessAnimations: { hole: {} } } } }),
      generation: () => generation
    },
    scene,
    create,
    remove,
    documents
  };
}

describe('light handlers', () => {
  it('get-lights lists the active scene with the full snapshot', async () => {
    const { deps } = world();
    const result = await createGetLightsHandler(deps)({});
    expect(result.sceneId).toBe('scene-1');
    expect(result.lights).toEqual([
      {
        id: 'l1',
        x: 100,
        y: 200,
        elevation: 0,
        rotation: 0,
        walls: true,
        vision: false,
        hidden: false,
        dim: 20,
        bright: 10,
        angle: 360,
        color: '#ff8800',
        alpha: 0.5,
        coloration: 'luminance',
        luminosity: 0.5,
        attenuation: 0.5,
        saturation: 0,
        contrast: 0,
        shadows: 0,
        animation: { type: 'torch', speed: 5, intensity: 5, reverse: false },
        darkness: { min: 0, max: 1 },
        negative: false,
        priority: 0,
        name: null,
        locked: false,
        levels: []
      }
    ]);
  });

  it('get-lights omits the Foundry 14 fields on 13', async () => {
    const { deps } = world(13);
    const [entry] = (await createGetLightsHandler(deps)({ sceneId: null })).lights;
    expect(entry).toBeDefined();
    expect(entry).not.toHaveProperty('name');
    expect(entry).not.toHaveProperty('locked');
    expect(entry).not.toHaveProperty('levels');
    expect(entry).toHaveProperty('negative', false);
  });

  it('get-lights fails for an unknown scene', async () => {
    const { deps } = world();
    await expect(createGetLightsHandler(deps)({ sceneId: 'nope' })).rejects.toThrow('Scene not found: nope');
  });

  it('create-light creates on the active scene and answers with the scene id', async () => {
    const { deps, create } = world();
    create.mockResolvedValue([lightDocument('new', { x: 5, y: 6 })]);

    const result = await createCreateLightHandler(deps)({ x: 5, y: 6, dim: 30, coloration: 'legacy' });

    expect(create).toHaveBeenCalledWith('AmbientLight', [{ x: 5, y: 6, config: { dim: 30, coloration: 0 } }]);
    expect(result).toMatchObject({ id: 'new', x: 5, y: 6, sceneId: 'scene-1' });
  });

  it('create-light rejects invalid params before reaching Foundry', async () => {
    const { deps, create } = world();
    await expect(createCreateLightHandler(deps)({ x: 0, y: 0, alpha: 3 })).rejects.toThrow(/^alpha: /);
    expect(create).not.toHaveBeenCalled();
  });

  it('create-light refuses Foundry 14 colorations on 13', async () => {
    const { deps, create } = world(13);
    await expect(createCreateLightHandler(deps)({ x: 0, y: 0, coloration: 'natural-attenuation' })).rejects.toThrow(
      'The natural-attenuation coloration requires Foundry 14 or newer'
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('update-light writes a partial config and answers with the light', async () => {
    const { deps, documents } = world();
    const result = await createUpdateLightHandler(deps)({ lightId: 'l1', animation: { speed: 8 }, color: null });
    expect(documents[0]?.update).toHaveBeenCalledWith({ config: { color: null, animation: { speed: 8 } } });
    expect(result).toMatchObject({ id: 'l1', sceneId: 'scene-1' });
  });

  it('update-light refuses an animation the world does not register', async () => {
    const { deps, documents } = world();
    await expect(createUpdateLightHandler(deps)({ lightId: 'l1', animation: { type: 'disco' } })).rejects.toThrow(
      'Unknown light animation: disco. Known: torch'
    );
    expect(documents[0]?.update).not.toHaveBeenCalled();
  });

  it('update-light and delete-light fail for an unknown light', async () => {
    const { deps, remove } = world();
    await expect(createUpdateLightHandler(deps)({ lightId: 'nope', dim: 1 })).rejects.toThrow('Light not found: nope');
    await expect(createDeleteLightHandler(deps)({ lightId: 'nope' })).rejects.toThrow('Light not found: nope');
    expect(remove).not.toHaveBeenCalled();
  });

  it('delete-light deletes and confirms', async () => {
    const { deps, remove } = world();
    await expect(createDeleteLightHandler(deps)({ lightId: 'l1', sceneId: 'scene-1' })).resolves.toEqual({
      deleted: true,
      lightId: 'l1',
      sceneId: 'scene-1'
    });
    expect(remove).toHaveBeenCalledWith('AmbientLight', ['l1']);
  });
});
