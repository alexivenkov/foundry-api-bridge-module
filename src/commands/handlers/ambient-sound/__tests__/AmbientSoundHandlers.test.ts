import type {
  FoundryAmbientSoundDocument,
  FoundryAmbientSoundGame,
  FoundryAmbientSoundScene,
  FoundryAudioGlobals
} from '../../../../core/ambient-sounds/infrastructure';
import { createCreateAmbientSoundHandler } from '../CreateAmbientSoundHandler';
import { createDeleteAmbientSoundHandler } from '../DeleteAmbientSoundHandler';
import { createGetAmbientSoundsHandler } from '../GetAmbientSoundsHandler';
import { createPlaySoundAtPositionHandler } from '../PlaySoundAtPositionHandler';
import { createPreloadSoundHandler } from '../PreloadSoundHandler';
import { createUpdateAmbientSoundHandler } from '../UpdateAmbientSoundHandler';
import type { AmbientSoundHandlerDependencies } from '../GetAmbientSoundsHandler';

function soundDocument(id: string, overrides: Partial<FoundryAmbientSoundDocument> = {}): FoundryAmbientSoundDocument {
  return {
    id,
    name: 'Fire',
    x: 10,
    y: 20,
    elevation: 0,
    levels: new Set<string>(),
    radius: 30,
    path: 'sounds/fire.ogg',
    repeat: true,
    volume: 0.5,
    walls: true,
    easing: true,
    hidden: false,
    locked: false,
    darkness: { min: 0, max: 1 },
    effects: { base: { type: 'reverb', intensity: 3 }, muffled: { intensity: 5 } },
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

interface World {
  deps: AmbientSoundHandlerDependencies;
  create: jest.Mock;
  remove: jest.Mock;
  emitAtPosition: jest.Mock;
  preload: jest.Mock;
  documents: FoundryAmbientSoundDocument[];
  audio: { locked: boolean; preload: jest.Mock };
}

function world(generation = 14): World {
  const documents = [soundDocument('s1')];
  const create = jest.fn();
  const remove = jest.fn().mockResolvedValue([]);
  const emitAtPosition = jest.fn().mockResolvedValue({ failed: false });
  const preload = jest.fn().mockResolvedValue({ failed: false });
  const scene: FoundryAmbientSoundScene = {
    id: 'scene-1',
    sounds: { get: (id) => documents.find((doc) => doc.id === id), contents: documents },
    levels: { contents: [{ id: 'lvl1' }] },
    createEmbeddedDocuments: create,
    deleteEmbeddedDocuments: remove
  };
  const game: FoundryAmbientSoundGame = {
    scenes: {
      get: (id) => (id === scene.id ? scene : id === 'scene-2' ? { ...scene, id: 'scene-2' } : undefined),
      active: scene
    }
  };
  const audio = { locked: false, preload };
  const globals: FoundryAudioGlobals = {
    CONFIG: { soundEffects: { lowpass: {}, highpass: {}, reverb: {} } },
    canvas: { ready: true, scene: { id: 'scene-1' }, sounds: { emitAtPosition } },
    game: { audio }
  };
  return {
    deps: { gameProvider: { getGame: () => game }, audioGlobals: () => globals, generation: () => generation },
    create,
    remove,
    emitAtPosition,
    preload,
    documents,
    audio
  };
}

describe('ambient sound handlers', () => {
  it('get-ambient-sounds lists the active scene', async () => {
    const { deps } = world();
    await expect(createGetAmbientSoundsHandler(deps)({})).resolves.toEqual({
      sceneId: 'scene-1',
      ambientSounds: [
        {
          id: 's1',
          x: 10,
          y: 20,
          elevation: 0,
          radius: 30,
          path: 'sounds/fire.ogg',
          repeat: true,
          volume: 0.5,
          walls: true,
          easing: true,
          hidden: false,
          darkness: { min: 0, max: 1 },
          baseEffect: { type: 'reverb', intensity: 3 },
          muffledEffect: { type: null, intensity: 5 },
          name: 'Fire',
          locked: false,
          levels: []
        }
      ]
    });
  });

  it('get-ambient-sounds omits the Foundry 14 fields on 13 and fails for an unknown scene', async () => {
    const { deps } = world(13);
    const [entry] = (await createGetAmbientSoundsHandler(deps)({ sceneId: '' })).ambientSounds;
    expect(entry).not.toHaveProperty('name');
    expect(entry).not.toHaveProperty('levels');
    expect(entry).toHaveProperty('baseEffect');
    await expect(createGetAmbientSoundsHandler(deps)({ sceneId: 'nope' })).rejects.toThrow('Scene not found: nope');
  });

  it('create-ambient-sound creates and answers with the scene id', async () => {
    const { deps, create } = world();
    create.mockResolvedValue([soundDocument('new')]);
    const result = await createCreateAmbientSoundHandler(deps)({
      x: 1,
      y: 2,
      radius: 15,
      path: 'sounds/wind.ogg',
      levels: ['lvl1']
    });
    expect(create).toHaveBeenCalledWith('AmbientSound', [
      { x: 1, y: 2, radius: 15, path: 'sounds/wind.ogg', levels: ['lvl1'] }
    ]);
    expect(result).toMatchObject({ id: 'new', sceneId: 'scene-1' });
  });

  it('create-ambient-sound rejects a non-audio path and a foreign level', async () => {
    const { deps, create } = world();
    await expect(
      createCreateAmbientSoundHandler(deps)({ x: 1, y: 2, radius: 15, path: 'notes/readme.txt' })
    ).rejects.toThrow(/^path: /);
    await expect(
      createCreateAmbientSoundHandler(deps)({ x: 1, y: 2, radius: 15, path: 'a.ogg', levels: ['lvl9'] })
    ).rejects.toThrow('Unknown scene level: lvl9');
    expect(create).not.toHaveBeenCalled();
  });

  it('update-ambient-sound writes a partial update', async () => {
    const { deps, documents } = world();
    const result = await createUpdateAmbientSoundHandler(deps)({
      ambientSoundId: 's1',
      volume: 0.9,
      baseEffect: { type: null }
    });
    expect(documents[0]?.update).toHaveBeenCalledWith({ volume: 0.9, effects: { base: { type: '' } } });
    expect(result).toMatchObject({ id: 's1', sceneId: 'scene-1' });
  });

  it('update-ambient-sound and delete-ambient-sound fail for an unknown sound', async () => {
    const { deps, remove } = world();
    await expect(createUpdateAmbientSoundHandler(deps)({ ambientSoundId: 'x', volume: 1 })).rejects.toThrow(
      'Ambient sound not found: x'
    );
    await expect(createDeleteAmbientSoundHandler(deps)({ ambientSoundId: 'x' })).rejects.toThrow(
      'Ambient sound not found: x'
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it('delete-ambient-sound deletes and confirms', async () => {
    const { deps, remove } = world();
    await expect(createDeleteAmbientSoundHandler(deps)({ ambientSoundId: 's1' })).resolves.toEqual({
      deleted: true,
      ambientSoundId: 's1',
      sceneId: 'scene-1'
    });
    expect(remove).toHaveBeenCalledWith('AmbientSound', ['s1']);
  });

  it('play-sound-at-position broadcasts through canvas.sounds.emitAtPosition', async () => {
    const { deps, emitAtPosition } = world();
    await expect(
      createPlaySoundAtPositionHandler(deps)({
        src: 'sounds/trap.ogg',
        x: 100,
        y: 200,
        radius: 30,
        muffledEffect: { type: 'lowpass', intensity: 6 },
        walls: false
      })
    ).resolves.toEqual({
      broadcast: true,
      src: 'sounds/trap.ogg',
      sceneId: 'scene-1',
      x: 100,
      y: 200,
      radius: 30,
      gmPlayback: 'done'
    });
    expect(emitAtPosition).toHaveBeenCalledWith('sounds/trap.ogg', { x: 100, y: 200 }, 30, {
      volume: 1,
      easing: true,
      walls: false,
      gmAlways: true,
      muffledEffect: { type: 'lowpass', intensity: 6 }
    });
  });

  it('play-sound-at-position refuses an unknown effect and a scene that is not on the canvas', async () => {
    const { deps, emitAtPosition } = world();
    const handler = createPlaySoundAtPositionHandler(deps);
    await expect(
      handler({ src: 'sounds/trap.ogg', x: 1, y: 1, radius: 5, baseEffect: { type: 'echo' } })
    ).rejects.toThrow('Unknown sound effect: echo. Known: lowpass, highpass, reverb');
    await expect(handler({ src: 'sounds/trap.ogg', x: 1, y: 1, radius: 5, sceneId: 'scene-2' })).rejects.toThrow(
      "Scene scene-2 is not the scene open on the GM's canvas"
    );
    await expect(handler({ src: 'sounds/trap.ogg', x: 1, y: 1, radius: 0 })).rejects.toThrow(/^radius: /);
    expect(emitAtPosition).not.toHaveBeenCalled();
  });

  it('preload-sound asks every client and reports a locked GM browser as deferred', async () => {
    const { deps, preload, audio } = world();
    audio.locked = true;
    preload.mockReturnValue(new Promise<never>(() => undefined));
    await expect(createPreloadSoundHandler(deps)({ src: 'music/theme.mp3' })).resolves.toEqual({
      broadcast: true,
      src: 'music/theme.mp3',
      gmPreload: 'deferred'
    });
    expect(preload).toHaveBeenCalledWith('music/theme.mp3');
  });

  it('preload-sound validates the path', async () => {
    const { deps, preload } = world();
    await expect(createPreloadSoundHandler(deps)({ src: '' })).rejects.toThrow(/^src: /);
    expect(preload).not.toHaveBeenCalled();
  });
});
