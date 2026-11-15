import { SceneNotFoundError } from '../../../shared';
import { FoundryTokenStore } from '../FoundryTokenStore';
import type { FoundryTokenDocument, FoundryTokenGame, FoundryTokenScene } from '../foundryTokenTypes';

function document(overrides: Partial<FoundryTokenDocument> = {}): FoundryTokenDocument {
  const doc: FoundryTokenDocument = {
    id: 't1',
    name: 'Goblin',
    x: 100,
    y: 200,
    width: 1,
    height: 1,
    elevation: 0,
    rotation: 0,
    hidden: false,
    texture: { src: 'icons/goblin.png' },
    disposition: -1,
    actorId: 'a1',
    actorLink: false,
    actor: {
      id: 'a1',
      type: 'npc',
      statuses: new Set(['prone']),
      system: { attributes: { hp: { value: 7, max: 9 }, ac: { value: 15 } } }
    },
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
  (doc.update as jest.Mock).mockImplementation((data: Partial<FoundryTokenDocument>) => {
    Object.assign(doc, data);
    return Promise.resolve(doc);
  });
  return doc;
}

function scene(documents: FoundryTokenDocument[] = [], grid?: FoundryTokenScene['grid']): {
  scene: FoundryTokenScene;
  create: jest.Mock;
  get: jest.Mock;
} {
  const create = jest.fn();
  const get = jest.fn((tokenId: string) => documents.find((doc) => doc.id === tokenId));
  return {
    scene: { id: 'dungeon', name: 'Dungeon', tokens: { get, contents: documents }, grid, createEmbeddedDocuments: create },
    create,
    get
  };
}

function storeFor(target: FoundryTokenScene, generation?: number): FoundryTokenStore {
  const game = {
    scenes: { get: (id: string) => (id === target.id ? target : undefined), active: target },
    ...(generation !== undefined ? { release: { generation } } : {})
  } as FoundryTokenGame;
  (globalThis as Record<string, unknown>)['game'] = game;
  return new FoundryTokenStore({ getGame: () => game });
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>)['game'];
});

describe('FoundryTokenStore', () => {
  describe('reading', () => {
    it('maps a token with its actor, statuses and conventional hp / ac', () => {
      expect(storeFor(scene([document()]).scene).findToken('dungeon', 't1')).toEqual({
        id: 't1',
        name: 'Goblin',
        x: 100,
        y: 200,
        width: 1,
        height: 1,
        elevation: 0,
        rotation: 0,
        hidden: false,
        textureSrc: 'icons/goblin.png',
        disposition: 'hostile',
        actorId: 'a1',
        actorLink: false,
        actor: { id: 'a1', type: 'npc', statuses: ['prone'], vitals: { hp: { value: 7, max: 9 }, ac: 15 } }
      });
    });

    it.each([
      [-2, 'secret'],
      [-1, 'hostile'],
      [0, 'neutral'],
      [1, 'friendly'],
      [99, 'neutral']
    ] as const)('reads disposition code %i as %s', (code, expected) => {
      const { scene: dungeon } = scene([document({ disposition: code })]);

      expect(storeFor(dungeon).findToken('dungeon', 't1')?.disposition).toBe(expected);
    });

    it('falls back to the actor for a token that does not carry actorId or actorLink', () => {
      const doc = document();
      delete doc.actorId;
      delete doc.actorLink;

      expect(storeFor(scene([doc]).scene).findToken('dungeon', 't1')).toMatchObject({ actorId: 'a1', actorLink: false });
    });

    it('keeps the declared actor id when the actor itself is gone', () => {
      const { scene: dungeon } = scene([document({ actor: null })]);

      expect(storeFor(dungeon).findToken('dungeon', 't1')).toMatchObject({ actorId: 'a1', actor: null });
    });

    it('reports no vitals for an actor of another data layout', () => {
      const { scene: dungeon } = scene([document({ actor: { id: 'a1', system: {} } })]);

      expect(storeFor(dungeon).findToken('dungeon', 't1')?.actor).toEqual({
        id: 'a1',
        type: null,
        statuses: [],
        vitals: { hp: null, ac: null }
      });
    });

    it('returns null for an unknown token and rejects an unknown scene', () => {
      const store = storeFor(scene().scene);

      expect(store.findToken('dungeon', 'missing')).toBeNull();
      expect(() => store.listTokens('missing')).toThrow(SceneNotFoundError);
    });

    it('reads the grid, leaving unset values to the caller', () => {
      expect(storeFor(scene([], { size: 70, distance: 1.5, units: 'm' }).scene).readGrid('dungeon')).toEqual({
        size: 70,
        distance: 1.5,
        units: 'm'
      });
      expect(storeFor(scene().scene).readGrid('dungeon')).toEqual({ size: null, distance: null, units: null });
    });
  });

  describe('createToken', () => {
    it('writes the scale into texture.scaleX / scaleY, never a top-level scale', async () => {
      const { scene: dungeon, create } = scene();
      create.mockResolvedValue([document({ id: 'new' })]);

      const created = await storeFor(dungeon).createToken('dungeon', {
        actorId: 'a1',
        x: 10,
        y: 20,
        hidden: true,
        elevation: 5,
        rotation: 90,
        scale: 1.5,
        actorLink: true
      });

      expect(create).toHaveBeenCalledWith('Token', [
        {
          actorId: 'a1',
          x: 10,
          y: 20,
          hidden: true,
          elevation: 5,
          rotation: 90,
          texture: { scaleX: 1.5, scaleY: 1.5 },
          actorLink: true
        }
      ]);
      expect(created?.id).toBe('new');
    });

    it('sends only what is set and resolves to null when nothing was created', async () => {
      const { scene: dungeon, create } = scene();
      create.mockResolvedValue([]);

      await expect(storeFor(dungeon).createToken('dungeon', { actorId: 'a1', x: 1, y: 2 })).resolves.toBeNull();
      expect(create).toHaveBeenCalledWith('Token', [{ actorId: 'a1', x: 1, y: 2 }]);
    });
  });

  describe('updateToken', () => {
    it('writes the core codes for name display and disposition', async () => {
      const doc = document();

      await storeFor(scene([doc]).scene).updateToken('dungeon', 't1', {
        name: 'Boss',
        nameDisplay: 'always',
        disposition: 'secret',
        lockRotation: true
      });

      expect(doc.update).toHaveBeenCalledWith({ name: 'Boss', displayName: 50, disposition: -2, lockRotation: true });
    });

    it('keeps a mirrored token mirrored when its scale changes', async () => {
      const doc = document({ texture: { src: 'icons/goblin.png', scaleX: -1, scaleY: 1 } });

      await storeFor(scene([doc]).scene).updateToken('dungeon', 't1', { scale: 2 });

      expect(doc.update).toHaveBeenCalledWith({ texture: { scaleX: -2, scaleY: 2 } });
    });

    it('returns the token as it is afterwards, or null when it is gone', async () => {
      const store = storeFor(scene([document()]).scene);

      await expect(store.updateToken('dungeon', 't1', { hidden: true })).resolves.toMatchObject({ hidden: true });
      await expect(store.updateToken('dungeon', 'missing', { hidden: true })).resolves.toBeNull();
    });
  });

  describe('placeToken', () => {
    it('moves the token and returns it from where it now stands', async () => {
      const doc = document();

      const moved = await storeFor(scene([doc]).scene).placeToken(
        'dungeon',
        't1',
        { x: 300, y: 400, elevation: 10 },
        { animate: false, throughDoor: false }
      );

      expect(doc.update).toHaveBeenCalledWith({ x: 300, y: 400, elevation: 10 }, { animate: false });
      expect(moved).toMatchObject({ x: 300, y: 400, elevation: 10 });
    });

    it('teleports through a freshly opened door before Foundry 14', async () => {
      const doc = document();

      await storeFor(scene([doc]).scene, 13).placeToken('dungeon', 't1', { x: 300, y: 0 }, { animate: true, throughDoor: true });

      expect(doc.update).toHaveBeenCalledWith({ x: 300, y: 0 }, { animate: true, teleport: true });
    });

    it('takes an ordinary step through the door on Foundry 14, which dropped teleport', async () => {
      const doc = document();

      await storeFor(scene([doc]).scene, 14).placeToken('dungeon', 't1', { x: 300, y: 0 }, { animate: true, throughDoor: true });

      expect(doc.update).toHaveBeenCalledWith({ x: 300, y: 0 }, { animate: true });
    });

    it('resolves to null when the token is gone after the step', async () => {
      const doc = document();
      const { scene: dungeon, get } = scene([doc]);
      get.mockReturnValueOnce(doc).mockReturnValueOnce(undefined);

      await expect(
        storeFor(dungeon).placeToken('dungeon', 't1', { x: 1, y: 1 }, { animate: true, throughDoor: false })
      ).resolves.toBeNull();
    });
  });

  it('deletes the token document', async () => {
    const doc = document();

    await storeFor(scene([doc]).scene).deleteToken('dungeon', 't1');

    expect(doc.delete).toHaveBeenCalled();
  });
});
