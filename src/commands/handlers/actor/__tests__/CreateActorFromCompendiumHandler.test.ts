import { createActorFromCompendiumHandler } from '../CreateActorFromCompendiumHandler';

const mockCompendiumActor = {
  id: 'comp-actor-123',
  uuid: 'Compendium.dnd5e.monsters.comp-actor-123',
  name: 'Goblin',
  type: 'npc',
  img: 'icons/creatures/goblin.png',
  folder: null,
  toObject: jest.fn()
};

const mockCreatedActor = {
  id: 'new-actor-456',
  uuid: 'Actor.new-actor-456',
  name: 'Goblin',
  type: 'npc',
  img: 'icons/creatures/goblin.png',
  folder: null
};

const mockPack = {
  collection: 'dnd5e.monsters',
  metadata: {
    type: 'Actor'
  },
  getDocument: jest.fn()
};

const mockGame = {
  actors: {
    documentClass: {
      create: jest.fn()
    }
  },
  packs: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('createActorFromCompendiumHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.packs.get.mockReturnValue(mockPack);
    mockPack.getDocument.mockResolvedValue(mockCompendiumActor);
    mockCompendiumActor.toObject.mockReturnValue({
      _id: 'comp-actor-123',
      name: 'Goblin',
      type: 'npc',
      img: 'icons/creatures/goblin.png',
      system: { cr: 0.25 }
    });
    mockGame.actors.documentClass.create.mockResolvedValue(mockCreatedActor);
  });

  describe('successful creation', () => {
    it('should create an actor from compendium', async () => {
      const result = await createActorFromCompendiumHandler({
        packId: 'dnd5e.monsters',
        actorId: 'comp-actor-123'
      });

      expect(mockGame.packs.get).toHaveBeenCalledWith('dnd5e.monsters');
      expect(mockPack.getDocument).toHaveBeenCalledWith('comp-actor-123');
      expect(mockCompendiumActor.toObject).toHaveBeenCalled();
      expect(mockGame.actors.documentClass.create).toHaveBeenCalledWith({
        name: 'Goblin',
        type: 'npc',
        img: 'icons/creatures/goblin.png',
        system: { cr: 0.25 }
      });
      expect(result).toEqual({
        id: 'new-actor-456',
        uuid: 'Actor.new-actor-456',
        name: 'Goblin',
        type: 'npc',
        img: 'icons/creatures/goblin.png',
        folder: null
      });
    });

    it('should override name when provided', async () => {
      await createActorFromCompendiumHandler({
        packId: 'dnd5e.monsters',
        actorId: 'comp-actor-123',
        name: 'Custom Goblin'
      });

      expect(mockGame.actors.documentClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Custom Goblin' })
      );
    });

    it('should set folder when provided', async () => {
      await createActorFromCompendiumHandler({
        packId: 'dnd5e.monsters',
        actorId: 'comp-actor-123',
        folder: 'folder-789'
      });

      expect(mockGame.actors.documentClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'folder-789' })
      );
    });

    it('should remove _id from compendium data before creating', async () => {
      await createActorFromCompendiumHandler({
        packId: 'dnd5e.monsters',
        actorId: 'comp-actor-123'
      });

      const createCall = mockGame.actors.documentClass.create.mock.calls[0][0];
      expect(createCall).not.toHaveProperty('_id');
    });

    it('should return folder name when actor has folder', async () => {
      mockGame.actors.documentClass.create.mockResolvedValue({
        ...mockCreatedActor,
        folder: { name: 'Monsters' }
      });

      const result = await createActorFromCompendiumHandler({
        packId: 'dnd5e.monsters',
        actorId: 'comp-actor-123'
      });

      expect(result.folder).toBe('Monsters');
    });
  });

  describe('error handling', () => {
    it('should throw error if pack not found', async () => {
      mockGame.packs.get.mockReturnValue(undefined);

      await expect(
        createActorFromCompendiumHandler({
          packId: 'non-existent.pack',
          actorId: 'comp-actor-123'
        })
      ).rejects.toThrow('Compendium pack not found: non-existent.pack');
    });

    it('should throw error if pack is not an Actor pack', async () => {
      mockGame.packs.get.mockReturnValue({
        ...mockPack,
        metadata: { type: 'Item' }
      });

      await expect(
        createActorFromCompendiumHandler({
          packId: 'dnd5e.items',
          actorId: 'comp-actor-123'
        })
      ).rejects.toThrow('Compendium pack is not an Actor pack: dnd5e.items');
    });

    it('should throw error if actor not found in compendium', async () => {
      mockPack.getDocument.mockResolvedValue(null);

      await expect(
        createActorFromCompendiumHandler({
          packId: 'dnd5e.monsters',
          actorId: 'non-existent'
        })
      ).rejects.toThrow('Actor not found in compendium: non-existent');
    });
  });
});