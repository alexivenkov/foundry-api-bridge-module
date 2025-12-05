import { createActorHandler } from '../CreateActorHandler';

const mockCreatedActor = {
  id: 'new-actor-123',
  uuid: 'Actor.new-actor-123',
  name: 'Test Character',
  type: 'character',
  img: 'icons/svg/mystery-man.svg',
  folder: null
};

const mockGame = {
  actors: {
    documentClass: {
      create: jest.fn()
    }
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('createActorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.documentClass.create.mockResolvedValue(mockCreatedActor);
  });

  describe('successful creation', () => {
    it('should create an actor with required fields', async () => {
      const result = await createActorHandler({
        name: 'Test Character',
        type: 'character'
      });

      expect(mockGame.actors.documentClass.create).toHaveBeenCalledWith({
        name: 'Test Character',
        type: 'character'
      });
      expect(result).toEqual({
        id: 'new-actor-123',
        uuid: 'Actor.new-actor-123',
        name: 'Test Character',
        type: 'character',
        img: 'icons/svg/mystery-man.svg',
        folder: null
      });
    });

    it('should pass folder when provided', async () => {
      await createActorHandler({
        name: 'Test Character',
        type: 'character',
        folder: 'folder-123'
      });

      expect(mockGame.actors.documentClass.create).toHaveBeenCalledWith({
        name: 'Test Character',
        type: 'character',
        folder: 'folder-123'
      });
    });

    it('should pass img when provided', async () => {
      await createActorHandler({
        name: 'Test Character',
        type: 'character',
        img: 'path/to/image.png'
      });

      expect(mockGame.actors.documentClass.create).toHaveBeenCalledWith({
        name: 'Test Character',
        type: 'character',
        img: 'path/to/image.png'
      });
    });

    it('should pass system data when provided', async () => {
      const systemData = {
        abilities: { str: { value: 18 } },
        attributes: { hp: { value: 50, max: 50 } }
      };

      await createActorHandler({
        name: 'Test Character',
        type: 'character',
        system: systemData
      });

      expect(mockGame.actors.documentClass.create).toHaveBeenCalledWith({
        name: 'Test Character',
        type: 'character',
        system: systemData
      });
    });

    it('should pass all optional fields when provided', async () => {
      await createActorHandler({
        name: 'Full Character',
        type: 'npc',
        folder: 'folder-456',
        img: 'custom/image.png',
        system: { cr: 5 }
      });

      expect(mockGame.actors.documentClass.create).toHaveBeenCalledWith({
        name: 'Full Character',
        type: 'npc',
        folder: 'folder-456',
        img: 'custom/image.png',
        system: { cr: 5 }
      });
    });

    it('should return folder name when actor has folder', async () => {
      mockGame.actors.documentClass.create.mockResolvedValue({
        ...mockCreatedActor,
        folder: { name: 'NPCs' }
      });

      const result = await createActorHandler({
        name: 'Test Character',
        type: 'npc'
      });

      expect(result.folder).toBe('NPCs');
    });
  });
});