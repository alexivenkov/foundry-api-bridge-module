import { ActorNotFoundError, TargetTokenNotFoundError } from '../../../shared';
import { FoundryActorStore } from '../FoundryActorStore';
import type { FoundryActorDocument, FoundryActorGame, FoundryActorItem } from '../foundryActorTypes';

function item(overrides: Partial<FoundryActorItem> = {}): FoundryActorItem {
  return {
    id: 'i1',
    name: 'Scimitar',
    type: 'weapon',
    img: 'scimitar.webp',
    toObject: jest.fn().mockReturnValue({ system: { damage: '1d6' } }),
    ...overrides
  };
}

function document(overrides: Partial<FoundryActorDocument> = {}, items: FoundryActorItem[] = []): FoundryActorDocument {
  const doc: FoundryActorDocument = {
    id: 'a1',
    uuid: 'Actor.a1',
    name: 'Goblin',
    type: 'npc',
    img: 'goblin.webp',
    folder: null,
    items: { forEach: (fn) => { items.forEach(fn); } },
    getRollData: jest.fn().mockReturnValue({ attributes: { hp: { value: 7 } } }),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
  (doc.update as jest.Mock).mockImplementation((data: Partial<FoundryActorDocument>) => {
    Object.assign(doc, data);
    return Promise.resolve(doc);
  });
  return doc;
}

interface Setup {
  store: FoundryActorStore;
  create: jest.Mock;
}

function setup(actors: FoundryActorDocument[] = [], tokenActors: Record<string, FoundryActorDocument | null> = {}): Setup {
  const create = jest.fn();
  const cave = {
    id: 'cave',
    tokens: {
      get: (id: string) => (id in tokenActors ? { id, actor: tokenActors[id] ?? null } : undefined)
    }
  };
  const game: FoundryActorGame = {
    actors: {
      get: (id) => actors.find((candidate) => candidate.id === id),
      forEach: (fn) => { actors.forEach(fn); },
      documentClass: { create }
    },
    scenes: { get: (id) => (id === 'cave' ? cave : undefined), active: cave }
  };
  return { store: new FoundryActorStore({ getGame: () => game }), create };
}

describe('FoundryActorStore', () => {
  describe('reading', () => {
    it('lists every actor of the world', () => {
      const { store } = setup([document(), document({ id: 'a2', name: 'Wagon', type: 'vehicle', img: null })]);

      expect(store.listActors()).toEqual([
        { id: 'a1', name: 'Goblin', type: 'npc', img: 'goblin.webp' },
        { id: 'a2', name: 'Wagon', type: 'vehicle', img: null }
      ]);
    });

    it('reads an actor with its roll data and the stored system data of its items', () => {
      const scimitar = item();
      const rollData = { abilities: { str: { mod: 2 } } };
      const goblin = document({ getRollData: jest.fn().mockReturnValue(rollData) }, [scimitar, item({ id: 'i2', img: undefined })]);

      const details = setup([goblin]).store.findActorDetails('a1');

      expect(details?.rollData).toBe(rollData);
      expect(details?.items).toEqual([
        { id: 'i1', name: 'Scimitar', type: 'weapon', img: 'scimitar.webp', system: { damage: '1d6' } },
        { id: 'i2', name: 'Scimitar', type: 'weapon', img: null, system: { damage: '1d6' } }
      ]);
      expect(scimitar.toObject).toHaveBeenCalledWith(false);
    });

    it('returns null for an unknown actor', () => {
      expect(setup().store.findActorDetails('zz')).toBeNull();
    });
  });

  describe('createActor', () => {
    it('sends only the attributes that are set, the folder by id', async () => {
      const { store, create } = setup();
      create.mockResolvedValue(
        document({ id: 'new', uuid: 'Actor.new', name: 'Orc', img: 'orc.webp', folder: { name: 'Monsters' } })
      );

      const created = await store.createActor({ name: 'Orc', type: 'npc', folderId: 'f1' });

      expect(create).toHaveBeenCalledWith({ name: 'Orc', type: 'npc', folder: 'f1' });
      expect(Object.keys(create.mock.calls[0][0] as object)).toEqual(['name', 'type', 'folder']);
      expect(created).toEqual({
        id: 'new',
        uuid: 'Actor.new',
        name: 'Orc',
        type: 'npc',
        img: 'orc.webp',
        folderName: 'Monsters'
      });
    });

    it('passes the image and the system data through, null included', async () => {
      const { store, create } = setup();
      create.mockResolvedValue(document());
      const system = { attributes: { hp: { value: 15, max: 15 } } };

      await store.createActor({ name: 'Orc', type: 'npc', img: null, folderId: null, system });

      expect(create).toHaveBeenCalledWith({ name: 'Orc', type: 'npc', folder: null, img: null, system });
    });

    it('resolves to null when the core created nothing', async () => {
      const { store, create } = setup();
      create.mockResolvedValue(undefined);

      await expect(store.createActor({ name: 'Orc', type: 'npc' })).resolves.toBeNull();
    });
  });

  describe('updateActor', () => {
    it('updates a world actor and reads it back', async () => {
      const goblin = document();
      const { store } = setup([goblin]);

      const updated = await store.updateActor({ kind: 'world', actorId: 'a1' }, { name: 'Goblin Boss', img: 'boss.webp' });

      expect(goblin.update).toHaveBeenCalledWith({ name: 'Goblin Boss', img: 'boss.webp' });
      expect(updated).toMatchObject({ id: 'a1', name: 'Goblin Boss', img: 'boss.webp' });
    });

    it("updates a token's own actor, leaving the world actor alone", async () => {
      const world = document();
      const tokenActor = document({ name: 'Goblin 3' });
      const { store } = setup([world], { t3: tokenActor });
      const system = { attributes: { hp: { value: 3 } } };

      await store.updateActor({ kind: 'token', sceneId: 'cave', tokenId: 't3' }, { system });

      expect(tokenActor.update).toHaveBeenCalledWith({ system });
      expect(world.update).not.toHaveBeenCalled();
    });

    it('sends an empty update when nothing is set', async () => {
      const goblin = document();

      await setup([goblin]).store.updateActor({ kind: 'world', actorId: 'a1' }, {});

      expect(goblin.update).toHaveBeenCalledWith({});
    });

    it('moves the actor out of its folder with a null folder id', async () => {
      const goblin = document();

      await setup([goblin]).store.updateActor({ kind: 'world', actorId: 'a1' }, { folderId: null });

      expect(goblin.update).toHaveBeenCalledWith({ folder: null });
    });

    it('fails with the lookup error of the reference when the actor is gone', async () => {
      const { store } = setup();

      await expect(store.updateActor({ kind: 'world', actorId: 'zz' }, {})).rejects.toThrow(ActorNotFoundError);
      await expect(store.updateActor({ kind: 'token', sceneId: 'cave', tokenId: 'zz' }, {})).rejects.toThrow(
        TargetTokenNotFoundError
      );
    });
  });

  describe('deleteActor', () => {
    it('deletes the actor document', async () => {
      const goblin = document();

      await setup([goblin]).store.deleteActor('a1');

      expect(goblin.delete).toHaveBeenCalledTimes(1);
    });

    it('does nothing for an actor that is already gone', async () => {
      await expect(setup().store.deleteActor('zz')).resolves.toBeUndefined();
    });
  });
});
