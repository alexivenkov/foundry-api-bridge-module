import { SceneNotFoundError } from '../../../shared';
import {
  FoundryPrototypeTokens,
  type FoundryPrototypeActor,
  type FoundryPrototypeGame,
  type FoundryPrototypeScene
} from '../FoundryPrototypeTokens';
import type { FoundryTokenDocument } from '../foundryTokenTypes';
import { appearanceWriteOptions } from '../writeOptions';
import { prototypeSource } from './tokenAppearanceSources';

function createdToken(): FoundryTokenDocument {
  return {
    id: 'new',
    name: 'Goblin (2)',
    x: 100,
    y: 200,
    width: 1,
    height: 1,
    elevation: 0,
    rotation: 0,
    hidden: false,
    texture: { src: 'goblin.webp' },
    disposition: -1,
    actorId: 'a1',
    actor: null,
    update: jest.fn(),
    delete: jest.fn()
  };
}

type TestActor = FoundryPrototypeActor & { getTokenDocument: jest.Mock; unsaved: { updateSource: jest.Mock } };

function setup(generation = 13): {
  store: FoundryPrototypeTokens;
  actor: TestActor;
  keep: FoundryPrototypeScene;
} {
  const unsaved = { updateSource: jest.fn() };
  const prototypeToken = prototypeSource({ texture: { ...prototypeSource().texture, scaleX: -1 } });
  const actor: TestActor = {
    id: 'a1',
    _source: { prototypeToken },
    update: jest.fn((data: Record<string, unknown>) => {
      Object.assign(prototypeToken, data['prototypeToken']);
      return Promise.resolve(undefined);
    }),
    getTokenImages: jest.fn().mockResolvedValue(['goblin-1.webp', 'goblin-2.webp']),
    getTokenDocument: jest.fn().mockResolvedValue(unsaved),
    unsaved
  };
  const keep: FoundryPrototypeScene = {
    id: 'keep',
    name: 'Keep',
    active: true,
    tokens: {
      contents: [
        { id: 't1', name: 'Goblin', x: 0, y: 0, elevation: 0, hidden: false, actorId: 'a1', actorLink: false },
        { id: 't2', name: 'Orc', x: 0, y: 0, elevation: 0, hidden: false, actorId: 'a2' }
      ]
    },
    createEmbeddedDocuments: jest.fn().mockResolvedValue([createdToken()])
  };
  const crypt: FoundryPrototypeScene = {
    id: 'crypt',
    name: 'Crypt',
    tokens: { contents: [{ id: 't3', name: 'Goblin', x: 50, y: 60, elevation: 5, hidden: true, actorId: 'a1', actorLink: true }] },
    createEmbeddedDocuments: jest.fn()
  };
  const game: FoundryPrototypeGame = {
    actors: { get: (id) => (id === 'a1' ? actor : undefined) },
    scenes: { get: (id) => [keep, crypt].find((scene) => scene.id === id), active: keep, contents: [keep, crypt] }
  };
  const store = new FoundryPrototypeTokens({ getGame: () => game }, () => appearanceWriteOptions(generation, {}));
  return { store, actor, keep };
}

describe('FoundryPrototypeTokens', () => {
  it('reads the prototype from the stored actor data', () => {
    expect(setup().store.findPrototype('a1')).toMatchObject({ actorId: 'a1', name: 'Goblin', randomImg: false });
    expect(setup().store.findPrototype('ghost')).toBeNull();
  });

  it('updates the prototype through the actor with the core codes', async () => {
    const { store, actor } = setup();

    const updated = await store.updatePrototype('a1', {
      name: 'Gob',
      randomImg: true,
      disposition: 'friendly',
      nameDisplay: 'always',
      texture: { src: 'goblin-*.webp' },
      sight: { enabled: true, range: 30 }
    });

    expect(actor.update).toHaveBeenCalledWith({
      prototypeToken: {
        name: 'Gob',
        randomImg: true,
        disposition: 1,
        displayName: 50,
        texture: { src: 'goblin-*.webp' },
        sight: { enabled: true, range: 30 }
      }
    });
    expect(updated).toMatchObject({ name: 'Gob', randomImg: true, disposition: 'friendly', nameDisplay: 'always' });
  });

  it('lists the wildcard images', async () => {
    await expect(setup().store.tokenImages('a1')).resolves.toEqual(['goblin-1.webp', 'goblin-2.webp']);
  });

  it('places a token from the prototype with the draft on top, keeping the prototype mirroring for scale', async () => {
    const { store, actor, keep } = setup();

    const token = await store.createFromPrototype('keep', { actorId: 'a1', x: 100, y: 200, hidden: true, scale: 2 });

    expect(actor.getTokenDocument).toHaveBeenCalledWith(
      { actorId: 'a1', x: 100, y: 200, hidden: true, texture: { scaleX: -2, scaleY: 2 } },
      { parent: keep }
    );
    expect(keep.createEmbeddedDocuments).toHaveBeenCalledWith('Token', [actor.unsaved]);
    expect(token).toMatchObject({ id: 'new', name: 'Goblin (2)' });
  });

  it('replaces the prototype detection modes on the unsaved token instead of merging them', async () => {
    const { store, actor } = setup(13);

    await store.createFromPrototype('keep', { actorId: 'a1', x: 0, y: 0, detectionModes: [{ id: 'seeAll', enabled: true, range: null }] });

    expect(actor.getTokenDocument.mock.calls[0]?.[0]).not.toHaveProperty('detectionModes');
    expect(actor.unsaved.updateSource).toHaveBeenCalledWith({ detectionModes: [{ id: 'seeAll', enabled: true, range: null }] });
  });

  it('fails for a scene that does not exist', async () => {
    await expect(setup().store.createFromPrototype('nowhere', { actorId: 'a1', x: 0, y: 0 })).rejects.toThrow(SceneNotFoundError);
  });

  it('finds every token of an actor on every scene', () => {
    expect(setup().store.listActorTokens('a1')).toEqual([
      { sceneId: 'keep', sceneName: 'Keep', sceneActive: true, tokenId: 't1', name: 'Goblin', x: 0, y: 0, elevation: 0, hidden: false, actorLink: false },
      { sceneId: 'crypt', sceneName: 'Crypt', sceneActive: false, tokenId: 't3', name: 'Goblin', x: 50, y: 60, elevation: 5, hidden: true, actorLink: true }
    ]);
  });
});
