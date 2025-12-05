import { updateActorHandler } from '../UpdateActorHandler';

const mockUpdatedActor = {
  id: 'actor-123',
  uuid: 'Actor.actor-123',
  name: 'Updated Character',
  type: 'character',
  img: 'icons/svg/mystery-man.svg',
  folder: null
};

const mockActor = {
  id: 'actor-123',
  uuid: 'Actor.actor-123',
  name: 'Original Character',
  type: 'character',
  img: 'icons/svg/mystery-man.svg',
  folder: null,
  update: jest.fn()
};

const mockGame = {
  actors: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('updateActorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.update.mockResolvedValue(mockUpdatedActor);
  });

  describe('successful updates', () => {
    it('should update actor name', async () => {
      const result = await updateActorHandler({
        actorId: 'actor-123',
        name: 'Updated Character'
      });

      expect(mockGame.actors.get).toHaveBeenCalledWith('actor-123');
      expect(mockActor.update).toHaveBeenCalledWith({
        name: 'Updated Character'
      });
      expect(result).toEqual({
        id: 'actor-123',
        uuid: 'Actor.actor-123',
        name: 'Updated Character',
        type: 'character',
        img: 'icons/svg/mystery-man.svg',
        folder: null
      });
    });

    it('should update actor img', async () => {
      await updateActorHandler({
        actorId: 'actor-123',
        img: 'new/image.png'
      });

      expect(mockActor.update).toHaveBeenCalledWith({
        img: 'new/image.png'
      });
    });

    it('should update actor folder', async () => {
      await updateActorHandler({
        actorId: 'actor-123',
        folder: 'folder-456'
      });

      expect(mockActor.update).toHaveBeenCalledWith({
        folder: 'folder-456'
      });
    });

    it('should update actor system data', async () => {
      const systemData = {
        abilities: { str: { value: 20 } }
      };

      await updateActorHandler({
        actorId: 'actor-123',
        system: systemData
      });

      expect(mockActor.update).toHaveBeenCalledWith({
        system: systemData
      });
    });

    it('should update multiple fields at once', async () => {
      await updateActorHandler({
        actorId: 'actor-123',
        name: 'New Name',
        img: 'new/image.png',
        folder: 'folder-789',
        system: { level: 5 }
      });

      expect(mockActor.update).toHaveBeenCalledWith({
        name: 'New Name',
        img: 'new/image.png',
        folder: 'folder-789',
        system: { level: 5 }
      });
    });

    it('should not include undefined fields in update', async () => {
      await updateActorHandler({
        actorId: 'actor-123',
        name: 'Only Name'
      });

      const updateCall = mockActor.update.mock.calls[0][0];
      expect(updateCall).toEqual({ name: 'Only Name' });
      expect(updateCall).not.toHaveProperty('img');
      expect(updateCall).not.toHaveProperty('folder');
      expect(updateCall).not.toHaveProperty('system');
    });

    it('should return folder name when actor has folder', async () => {
      mockActor.update.mockResolvedValue({
        ...mockUpdatedActor,
        folder: { name: 'Party Members' }
      });

      const result = await updateActorHandler({
        actorId: 'actor-123',
        name: 'Updated Character'
      });

      expect(result.folder).toBe('Party Members');
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        updateActorHandler({
          actorId: 'non-existent',
          name: 'New Name'
        })
      ).rejects.toThrow('Actor not found: non-existent');
    });
  });
});